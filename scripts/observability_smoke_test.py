#!/usr/bin/env python3
"""Independent-of-provider smoke tests for the local observability contract and query path."""

from __future__ import annotations

import copy
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

import agent_ops
import validate_observability


BASE_TIME = "2026-08-29T10:00:00Z"
ISSUE_URL = "https://github.com/syedtabishmobin/DocumentManagement/issues/11"


def unavailable_count() -> dict[str, object]:
    return {"value": None, "provenance": "UNAVAILABLE"}


def unavailable_cost() -> dict[str, object]:
    return {"value": None, "currency": None, "provenance": "UNAVAILABLE"}


def event(event_id: str, event_type: str, agent_id: str, state: str, minute: int, **extra: object) -> dict[str, object]:
    record: dict[str, object] = {
        "schemaVersion": "1.0.0",
        "eventId": event_id,
        "eventType": event_type,
        "occurredAt": f"2026-08-29T10:{minute:02d}:00Z",
        "projectId": "doculyra",
        "runId": "run-obs-smoke",
        "agentId": agent_id,
        "state": state,
        "dataClassification": "OPERATIONAL_METADATA",
        "synthetic": True,
    }
    record.update(extra)
    return record


def usage(record_id: str, scope: str, total: int | None, provenance: str) -> dict[str, object]:
    count = lambda value: {"value": value, "provenance": provenance if value is not None else "UNAVAILABLE"}
    return {
        "recordId": record_id,
        "scope": scope,
        "inputTokens": count(total),
        "cachedInputTokens": unavailable_count(),
        "outputTokens": unavailable_count(),
        "reasoningTokens": unavailable_count(),
        "totalTokens": count(total),
        "credits": unavailable_count(),
        "providerCost": unavailable_cost(),
        "toolCost": unavailable_cost(),
    }


def fixture_events() -> list[dict[str, object]]:
    work = {"kind": "TASK", "id": "11", "url": ISSUE_URL}
    return [
        event("evt-001", "AGENT_STARTED", "agent-root", "RUNNING", 0, roleId="delivery-orchestrator", workItem=work, capabilityIds=["agent-operations-observability"], skillIds=["repository-discovery"], toolIds=["git", "github-issues"], branch="codex/11-agent-operations-observability", worktree="/synthetic/worktree", environmentId="agent-local"),
        event("evt-002", "SUBAGENT_SPAWNED", "agent-qa", "STARTING", 1, parentAgentId="agent-root", roleId="qa-release-lead", workItem=work, capabilityIds=["telemetry-validation"]),
        event("evt-003", "AGENT_STARTED", "agent-qa", "TESTING", 2, parentAgentId="agent-root", roleId="qa-release-lead", workItem=work, skillIds=["telemetry-validation"], toolIds=["pnpm-node"]),
        event("evt-004", "TEST_PASSED", "agent-qa", "TESTING", 3, parentAgentId="agent-root", workItem=work, quality={"gateId": "observability-smoke", "status": "PASS", "acceptanceCriterionId": "OBS-AC-08", "reworkCycle": 0}),
        event("evt-005", "USAGE_RECORDED", "agent-qa", "TESTING", 4, parentAgentId="agent-root", workItem=work, usage=usage("usage-child-1", "SELF_ONLY", 100, "PROVIDER_REPORTED")),
        event("evt-006", "USAGE_RECORDED", "agent-root", "RUNNING", 5, workItem=work, usage=usage("usage-parent-rollup", "INCLUSIVE", 100, "ATTRIBUTED")),
        event("evt-007", "USAGE_RECORDED", "agent-qa", "TESTING", 6, parentAgentId="agent-root", workItem=work, usage=usage("usage-child-1", "SELF_ONLY", 100, "PROVIDER_REPORTED")),
        event("evt-008", "AGENT_COMPLETED", "agent-qa", "COMPLETED", 7, parentAgentId="agent-root", workItem=work, resultCode="PASS", durationMs=300000),
        event("evt-009", "HUMAN_DECISION_REQUIRED", "agent-root", "BLOCKED", 8, workItem=work, blocker={"kind": "HUMAN_DECISION", "id": "DEC-SYNTHETIC", "status": "OPEN", "url": ISSUE_URL}),
        event("evt-010", "NOTIFICATION_STATUS_CHANGED", "agent-root", "BLOCKED", 9, workItem=work, blocker={"kind": "HUMAN_DECISION", "id": "DEC-SYNTHETIC", "status": "OPEN", "url": ISSUE_URL}, notification={"eventKey": "decision:dec-synthetic:first-blocking-notification", "status": "EXTERNAL_ACTION_REQUIRED", "authoritativeUrl": ISSUE_URL}),
        event("evt-011", "ENVIRONMENT_PROMOTED", "agent-root", "BLOCKED", 10, workItem=work, environmentId="dev", resultCode="SYNTHETIC_PREVIEW_AVAILABLE", blocker={"kind": "HUMAN_DECISION", "id": "DEC-SYNTHETIC", "status": "OPEN", "url": ISSUE_URL}),
        event("evt-012", "RETRY_RECORDED", "agent-root", "BLOCKED", 11, workItem=work, retryCount=1, blocker={"kind": "HUMAN_DECISION", "id": "DEC-SYNTHETIC", "status": "OPEN", "url": ISSUE_URL}),
    ]


class ObservabilitySmokeTests(unittest.TestCase):
    def test_fixture_events_validate(self) -> None:
        for item in fixture_events():
            self.assertEqual(validate_observability.validate_event(item), [], item["eventId"])

    def test_local_store_and_active_state(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "events.jsonl"
            for item in fixture_events():
                agent_ops.append_event(item, path)
            loaded = agent_ops.read_events(path)
            snapshot = agent_ops.status_snapshot(loaded, at=datetime(2026, 8, 29, 10, 12, tzinfo=timezone.utc))
            self.assertEqual(len(snapshot["activeAgents"]), 1)
            self.assertEqual(snapshot["blockedAgents"][0]["agentId"], "agent-root")
            self.assertEqual(snapshot["blockedAgents"][0]["blocker"]["kind"], "HUMAN_DECISION")
            self.assertEqual(snapshot["agents"][0]["workItem"]["id"], "11")

    def test_parent_child_tree(self) -> None:
        rows = agent_ops.tree_rows(agent_ops.aggregate_agent_states(fixture_events(), datetime(2026, 8, 29, 10, 12, tzinfo=timezone.utc)))
        self.assertEqual([(row["agentId"], row["depth"]) for row in rows], [("agent-root", 0), ("agent-qa", 1)])

    def test_quality_state_is_visible_on_agent(self) -> None:
        agents = {item["agentId"]: item for item in agent_ops.aggregate_agent_states(fixture_events(), datetime(2026, 8, 29, 10, 12, tzinfo=timezone.utc))}
        self.assertEqual(agents["agent-qa"]["quality"]["status"], "PASS")

    def test_defect_severity_is_minimized_from_issue_form(self) -> None:
        body = "## Expected and actual result\nSynthetic mismatch\n\n### Severity\n\nHIGH\n"
        self.assertEqual(agent_ops.issue_severity(body, []), "HIGH")
        self.assertEqual(agent_ops.issue_severity("", [{"name": "risk:high"}]), "HIGH")
        self.assertEqual(agent_ops.issue_severity("", []), "UNAVAILABLE")

    def test_usage_deduplicates_and_excludes_parent_rollup(self) -> None:
        summary = agent_ops.summary_snapshot(fixture_events(), at=datetime(2026, 8, 29, 10, 12, tzinfo=timezone.utc))
        self.assertEqual(summary["usage"]["totalTokens"]["byProvenance"], {"PROVIDER_REPORTED": 100})
        self.assertEqual(summary["usageReconciliation"]["duplicatesExcluded"], 1)
        self.assertEqual(summary["usageReconciliation"]["inclusiveParentRollupsExcluded"], 1)
        self.assertEqual(summary["usageReconciliation"]["aggregationScope"], "SELF_ONLY")

    def test_unavailable_usage_remains_unavailable(self) -> None:
        no_usage = [item for item in fixture_events() if "usage" not in item]
        summary = agent_ops.summary_snapshot(no_usage, at=datetime(2026, 8, 29, 10, 12, tzinfo=timezone.utc))
        self.assertEqual(summary["usage"]["providerCost"]["status"], "UNAVAILABLE")
        self.assertEqual(summary["usage"]["totalTokens"]["status"], "UNAVAILABLE")

    def test_null_metric_cannot_claim_measured(self) -> None:
        invalid = copy.deepcopy(fixture_events()[4])
        invalid["usage"]["totalTokens"] = {"value": None, "provenance": "MEASURED"}
        self.assertTrue(any("null value must be UNAVAILABLE" in error for error in validate_observability.validate_event(invalid)))

    def test_raw_prompt_and_unknown_fields_are_rejected(self) -> None:
        invalid = copy.deepcopy(fixture_events()[0])
        invalid["rawPrompt"] = "private prompt text"
        errors = validate_observability.validate_event(invalid)
        self.assertTrue(any("unallowlisted field" in error for error in errors))
        self.assertTrue(any("prohibited telemetry field" in error for error in errors))

    def test_secret_like_values_are_rejected(self) -> None:
        invalid = copy.deepcopy(fixture_events()[0])
        invalid["branch"] = "authorization=Bearer sensitive-value"
        self.assertTrue(any("sensitive payload" in error for error in validate_observability.validate_event(invalid)))

    def test_cardinality_is_bounded(self) -> None:
        invalid = copy.deepcopy(fixture_events()[0])
        invalid["skillIds"] = [f"skill-{index}" for index in range(33)]
        self.assertTrue(any("maximum item count" in error for error in validate_observability.validate_event(invalid)))

    def test_duplicate_event_id_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "events.jsonl"
            agent_ops.append_event(fixture_events()[0], path)
            with self.assertRaisesRegex(ValueError, "duplicate eventId"):
                agent_ops.append_event(fixture_events()[0], path)


if __name__ == "__main__":
    unittest.main()
