#!/usr/bin/env python3
"""Contract, privacy, routing and read-only tests for the local Control Centre."""

from __future__ import annotations

import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch

import control_centre
import control_centre_project
import control_centre_project_reconcile


GITHUB_FIXTURE = {
    "availability": "MEASURED",
    "sourceAvailability": {"issues": "MEASURED", "pullRequests": "MEASURED"},
    "openIssues": [{"number": 60, "title": "Lease-loss retries bypass bounded exhaustion", "url": "https://github.com/syedtabishmobin/DocumentManagement/issues/60", "labels": [{"name": "type:defect"}, {"name": "risk:high"}], "severity": "HIGH"}],
    "pendingDecisions": [],
    "openDefects": [{"number": 60, "title": "Lease-loss retries bypass bounded exhaustion", "url": "https://github.com/syedtabishmobin/DocumentManagement/issues/60", "labels": [{"name": "type:defect"}], "severity": "HIGH"}],
    "defectsBySeverity": {"HIGH": 1},
    "openUatReadyRecords": [],
    "openPullRequests": [{"number": 59, "title": "Story P1-006", "url": "https://github.com/syedtabishmobin/DocumentManagement/pull/59", "headRefName": "codex/58-story-p1-006", "statusCheckRollup": []}],
    "errors": {},
}


def attributed_record(
    *,
    display_agent_id: str,
    role: str,
    activity: str,
    run_id: str,
    commit: str,
    body: str,
) -> str:
    return f"""**🤖 {role} · {display_agent_id}**
`{activity}` · `{run_id}`

{body}

<!-- doculyra-agent-meta:v2
display_agent_id={display_agent_id}
display_role={role}
activity={activity}
display_run_id={run_id}
runtime_agent_id=codex-00000000-0000-0000-0000-000000000001
runtime_run_id=run-control-centre-test
parent_display_agent_id=ORCH-010
work_item=issue-61/pr-62
capability_ids=independent-qa,telemetry-validation
skill_ids=telemetry-validation
tool_ids=git,github-issues
commit={commit}
environment=agent-local
-->"""


CONTROL_CENTRE_SHA = "39a4325f083924dccfbb967805f1a31d04ccd82e"
MERGED_SHA = "65798b1f083924dccfbb967805f1a31d04ccd82e"
GITHUB_DELIVERY_FIXTURE = {
    "availability": "MEASURED",
    "issues": [
        {"number": 61, "title": "Control Centre", "url": "https://github.com/syedtabishmobin/DocumentManagement/issues/61", "state": "OPEN", "labels": ["type:work"], "body": "Tracked by https://github.com/syedtabishmobin/DocumentManagement/pull/62"},
        {"number": 64, "title": "Reverse trace defect", "url": "https://github.com/syedtabishmobin/DocumentManagement/issues/64", "state": "OPEN", "labels": ["type:defect"], "body": attributed_record(display_agent_id="QA-FUNC-017", role="Independent Functional QA", activity="independent-defect-finding", run_id="RUN-20260830-0079", commit=CONTROL_CENTRE_SHA, body="Issue #61 / PR https://github.com/syedtabishmobin/DocumentManagement/pull/62; STORY-P1-006; AC-BL-P1-001; TEST-SEC-P1-015; DEC-036")},
        {"number": 55, "title": "Safety containment", "url": "https://github.com/syedtabishmobin/DocumentManagement/issues/55", "state": "CLOSED", "labels": ["type:work"], "body": "STORY-P1-005"},
        {"number": 57, "title": "Historical defect", "url": "https://github.com/syedtabishmobin/DocumentManagement/issues/57", "state": "CLOSED", "labels": ["type:defect"], "body": "STORY-P1-005; PR https://github.com/syedtabishmobin/DocumentManagement/pull/56"},
    ],
    "pullRequests": [
        {"number": 62, "title": "Control Centre", "url": "https://github.com/syedtabishmobin/DocumentManagement/pull/62", "state": "OPEN", "branch": "codex/61-ai-native-control-centre", "headCommit": CONTROL_CENTRE_SHA, "mergeCommit": None, "body": "Closes #61"},
        {"number": 56, "title": "Safety containment", "url": "https://github.com/syedtabishmobin/DocumentManagement/pull/56", "state": "MERGED", "branch": "codex/55-safety", "headCommit": None, "mergeCommit": MERGED_SHA, "body": "Closes #55; STORY-P1-005"},
    ],
    "comments": [
        {"number": 62, "url": "https://github.com/example/pr/62#qa", "body": attributed_record(display_agent_id="QA-FUNC-017", role="Independent Functional QA", activity="independent-qa", run_id="RUN-20260830-0079", commit=CONTROL_CENTRE_SHA, body="Verdict: FAIL. Defect #64.")},
        {"number": 57, "url": "https://github.com/example/issues/57#fix", "body": attributed_record(display_agent_id="ORCH-010", role="Delivery Orchestrator", activity="fix-ready", run_id="RUN-20260830-0078", commit=MERGED_SHA, body="FIX_READY for independent retest.")},
        {"number": 57, "url": "https://github.com/example/issues/57#retest", "body": attributed_record(display_agent_id="QA-FUNC-017", role="Independent Functional QA", activity="independent-retest", run_id="RUN-20260830-0079", commit=MERGED_SHA, body="Verdict: PASS.")},
    ],
    "unavailable": [],
    "retentionLimit": control_centre.GITHUB_RETENTION,
}


class ControlCentreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.store = Path(self.temp.name) / "events.jsonl"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def snapshot(self, delivery: dict | None = None) -> dict:
        with patch("agent_ops.github_snapshot", return_value=GITHUB_FIXTURE), patch(
            "control_centre.github_delivery_snapshot",
            return_value=deepcopy(delivery or GITHUB_DELIVERY_FIXTURE),
        ):
            return control_centre.build_snapshot(online=True, event_store=self.store)

    def test_snapshot_covers_all_read_only_sections_and_truthful_nulls(self) -> None:
        snapshot = self.snapshot()
        self.assertTrue(snapshot["readOnly"])
        self.assertEqual(snapshot["audit"]["status"], "PASS")
        self.assertEqual(len(snapshot["routes"]), 16)
        self.assertEqual(snapshot["workstreams"]["queueState"], "PAUSED_BY_PRODUCT_AUTHORITY")
        self.assertEqual(snapshot["costTokens"]["usage"]["totalTokens"]["status"], "UNAVAILABLE")
        self.assertEqual(snapshot["costTokens"]["usage"]["totalTokens"]["byProvenance"], {})
        self.assertEqual(snapshot["costTokens"]["reconciliation"]["aggregationScope"], "SELF_ONLY")
        self.assertEqual(snapshot["overview"]["openDefectCount"], 1)
        self.assertEqual(snapshot["traceability"]["sourceStatus"]["github"], "MEASURED")
        self.assertGreaterEqual(snapshot["traceability"]["governedRecordCount"], 6)

    def test_shared_id_drill_through_and_invalid_id(self) -> None:
        snapshot = self.snapshot()
        found = control_centre.trace_lookup(snapshot, "STORY-P1-006")
        self.assertEqual(found["status"], "FOUND")
        self.assertTrue(found["record"]["references"])
        self.assertEqual(control_centre.trace_lookup(snapshot, "issue-64")["status"], "FOUND")
        with self.assertRaises(ValueError):
            control_centre.trace_lookup(snapshot, "../../secret")

    def test_reverse_trace_covers_commit_closed_defect_merged_pr_and_attribution(self) -> None:
        snapshot = self.snapshot()
        commit = control_centre.trace_lookup(snapshot, CONTROL_CENTRE_SHA.upper())
        self.assertEqual(commit["status"], "FOUND")
        self.assertEqual(commit["id"], CONTROL_CENTRE_SHA)
        self.assertTrue({"pr-62", "issue-61"}.issubset({item["id"] for item in commit["chain"]}))
        self.assertTrue(any(item["kind"] == "QA_RESULT" and item["attribution"]["displayAgentId"] == "QA-FUNC-017" for item in commit["evidence"]))

        defect = control_centre.trace_lookup(snapshot, "issue-57")
        self.assertEqual(defect["record"]["kind"], "GITHUB_DEFECT")
        self.assertEqual(defect["record"]["state"], "CLOSED")
        self.assertTrue({"FIX_READY", "INDEPENDENT_RETEST"}.issubset({item["kind"] for item in defect["evidence"]}))

        pull = control_centre.trace_lookup(snapshot, "pr-56")
        self.assertEqual(pull["record"]["state"], "MERGED")
        self.assertIn(MERGED_SHA, pull["record"]["relatedIds"])

    def test_static_story_acceptance_test_and_decision_reconstruct_github_assurance(self) -> None:
        snapshot = self.snapshot()
        expectations = {
            "STORY-P1-006": {"issue-64", "pr-62"},
            "AC-BL-P1-001": {"issue-64"},
            "TEST-SEC-P1-015": {"issue-64"},
            "DEC-036": {"issue-57", "pr-56"},
        }
        for stable_id, expected in expectations.items():
            result = control_centre.trace_lookup(snapshot, stable_id)
            self.assertEqual(result["status"], "FOUND")
            self.assertTrue(expected.issubset({item["id"] for item in result["chain"]}), stable_id)
        for stable_id in ("STORY-P1-006", "TEST-SEC-P1-015", "DEC-036"):
            result = control_centre.trace_lookup(snapshot, stable_id)
            self.assertTrue(
                any(item["kind"] in {"QA_RESULT", "INDEPENDENT_RETEST"} for item in result["evidence"]),
                stable_id,
            )

    def test_evidence_kind_uses_attributed_activity_not_incidental_fix_ready_text(self) -> None:
        record = attributed_record(
            display_agent_id="ORCH-010",
            role="Framework Delivery Orchestrator",
            activity="control-centre-start",
            run_id="RUN-20260830-0078",
            commit=CONTROL_CENTRE_SHA,
            body="The next governed action will eventually require FIX_READY evidence.",
        )
        evidence = control_centre._evidence_record(record, "https://github.com/example/issues/61")
        self.assertIsNotNone(evidence)
        self.assertEqual(evidence["kind"], "ATTRIBUTED_RECORD")

    def test_evidence_kind_does_not_treat_pending_retest_wording_as_retest(self) -> None:
        record = attributed_record(
            display_agent_id="ORCH-010",
            role="Orchestrator",
            activity="fix-coordination",
            run_id="RUN-20260830-0078",
            commit=CONTROL_CENTRE_SHA,
            body="Independent retest remains pending.",
        )
        evidence = control_centre._evidence_record(record, "https://example.invalid/comment")
        self.assertIsNotNone(evidence)
        self.assertEqual(evidence["kind"], "ATTRIBUTED_RECORD")

    def test_evidence_outcome_uses_governed_activity_when_body_has_no_verdict_field(self) -> None:
        record = attributed_record(
            display_agent_id="QA-FUNC-017",
            role="Independent Functional QA",
            activity="independent-retest-fail",
            run_id="RUN-20260830-0079",
            commit=CONTROL_CENTRE_SHA,
            body="Independent replacement-candidate retest did not pass its gate.",
        )
        evidence = control_centre._evidence_record(record, "https://example.invalid/comment")
        self.assertIsNotNone(evidence)
        self.assertEqual(evidence["kind"], "INDEPENDENT_RETEST")
        self.assertEqual(evidence["outcome"], "FAIL")

    def test_labeled_pr_shorthand_does_not_create_a_spurious_issue_join(self) -> None:
        related = control_centre._text_trace_ids(
            "PR #56 closes #55; Pull Request #62 fixes Issue #61.",
            shorthand_kind="issue",
        )
        self.assertTrue({"pr-56", "issue-55", "pr-62", "issue-61"}.issubset(related))
        self.assertNotIn("issue-56", related)
        self.assertNotIn("issue-62", related)

    def test_audit_fails_when_static_index_exists_but_governed_history_is_empty(self) -> None:
        delivery = {
            "availability": "MEASURED", "issues": [], "pullRequests": [], "comments": [],
            "unavailable": [], "retentionLimit": control_centre.GITHUB_RETENTION,
        }
        snapshot = self.snapshot(delivery)
        self.assertGreater(snapshot["traceability"]["stableIdCount"], 0)
        self.assertEqual(snapshot["audit"]["status"], "FAIL")
        failed = {item["id"] for item in snapshot["audit"]["checks"] if item["status"] == "FAIL"}
        self.assertTrue({"CC-AUD-011", "CC-AUD-012", "CC-AUD-013", "CC-AUD-015", "CC-AUD-016", "CC-AUD-017", "CC-AUD-018"}.issubset(failed))

    def test_audit_fails_when_qa_fix_retest_join_is_missing(self) -> None:
        delivery = deepcopy(GITHUB_DELIVERY_FIXTURE)
        delivery["comments"] = []
        snapshot = self.snapshot(delivery)
        failed = {item["id"] for item in snapshot["audit"]["checks"] if item["status"] == "FAIL"}
        self.assertIn("CC-AUD-015", failed)

    def test_audit_fails_when_required_static_classes_are_disconnected_from_github(self) -> None:
        delivery = deepcopy(GITHUB_DELIVERY_FIXTURE)
        issue = next(item for item in delivery["issues"] if item["number"] == 64)
        issue["body"] = "Issue #61 / PR https://github.com/syedtabishmobin/DocumentManagement/pull/62"
        snapshot = self.snapshot(delivery)
        failed = {item["id"] for item in snapshot["audit"]["checks"] if item["status"] == "FAIL"}
        self.assertTrue({"CC-AUD-017", "CC-AUD-018"}.issubset(failed))

    def test_unavailable_history_is_explicit_and_raw_artifact_content_is_not_exposed(self) -> None:
        unavailable = {
            "availability": "UNAVAILABLE", "issues": [], "pullRequests": [], "comments": [],
            "unavailable": ["GitHub durable comment evidence is unavailable."],
            "retentionLimit": control_centre.GITHUB_RETENTION,
        }
        snapshot = self.snapshot(unavailable)
        self.assertEqual(snapshot["traceability"]["sourceStatus"]["github"], "UNAVAILABLE")
        self.assertEqual(snapshot["audit"]["status"], "FAIL")
        serialized = json.dumps(self.snapshot())
        self.assertNotIn("doculyra-agent-meta", serialized)
        self.assertNotIn("FIX_READY for independent retest", serialized)
        self.assertNotIn("runtime_run_id=", serialized)

    def test_metric_catalog_has_complete_semantics(self) -> None:
        catalog = control_centre.load_json(control_centre.ROOT / ".agents/observability/metric-catalog.json")
        required = {"id", "unit", "definition", "source", "calculation", "freshness", "provenance", "nullHandling", "qualityLink"}
        self.assertTrue(catalog["metrics"])
        for metric in catalog["metrics"]:
            self.assertTrue(required.issubset(metric), metric["id"])
            self.assertIn(metric["freshness"], {"LIVE", "CURRENT", "HISTORICAL"})
        self.assertIn("never represented as zero", catalog["nullRule"])

    def test_persistent_project_configuration_is_complete(self) -> None:
        result = control_centre_project.report(online=False)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(len(result["viewUrls"]), 10)
        config = control_centre.load_json(control_centre.CONFIG_PATH)
        self.assertEqual(config["githubProject"]["automation"]["provider"], "GITHUB_PROJECTS_BUILT_IN")
        self.assertEqual(config["githubProject"]["automation"]["autoAdd"]["repository"], config["repository"])
        self.assertEqual(len(config["progressMeasures"]), 6)
        plan = control_centre_project_reconcile.build_plan(config)
        self.assertEqual(plan["autoAdd"]["managedByThisScript"], False)
        self.assertEqual(len(plan["views"]), 10)
        self.assertEqual(len(plan["currentItems"]), 7)

    def test_project_reconcile_preserves_option_identity_when_renaming_defaults(self) -> None:
        config = control_centre.load_json(control_centre.CONFIG_PATH)
        live = {
            "items": {"nodes": []},
            "fields": {"nodes": [
                {"__typename": "ProjectV2SingleSelectField", "id": "status-id", "name": "Status", "options": [
                    {"id": "todo-id", "name": "Todo", "color": "GRAY", "description": "not started"},
                    {"id": "doing-id", "name": "In Progress", "color": "YELLOW", "description": "active"},
                    {"id": "done-id", "name": "Done", "color": "GREEN", "description": "complete"},
                ]},
                {"__typename": "ProjectV2SingleSelectField", "id": "type-id", "name": "Work Type", "options": [
                    {"id": "defect-id", "name": "Defect", "color": "RED", "description": ""},
                ]},
                {"__typename": "ProjectV2SingleSelectField", "id": "priority-id", "name": "Priority", "options": [
                    {"id": f"priority-{name}", "name": name, "color": "GRAY", "description": ""}
                    for name in ["P0", "P1", "P2", "P3"]
                ]},
            ]}
        }
        calls = []
        with patch("control_centre_project_reconcile.graphql", side_effect=lambda query, variables=None: calls.append(variables) or {}):
            applied = control_centre_project_reconcile.reconcile_options(config, live)
        self.assertEqual(applied, ["field-options:Work Type", "field-options:Status"])
        inputs = {call["input"]["fieldId"]: call["input"] for call in calls}
        status = inputs["status-id"]["singleSelectOptions"]
        work_type = inputs["type-id"]["singleSelectOptions"]
        self.assertEqual(next(item for item in status if item["name"] == "Backlog")["id"], "todo-id")
        self.assertEqual(next(item for item in status if item["name"] == "Development")["id"], "doing-id")
        self.assertEqual(next(item for item in work_type if item["name"] == "Bug")["id"], "defect-id")

    def test_online_project_validation_fails_for_unpopulated_current_item(self) -> None:
        config = control_centre.load_json(control_centre.CONFIG_PATH)
        items = []
        for expected in config["githubProject"]["currentItemMetadata"]:
            item = {
                "content": {"number": expected["number"], "type": expected["kind"]},
                **{
                    control_centre_project.project_item_json_key(name): value
                    for name, value in expected.items()
                    if name not in {"kind", "number"}
                },
            }
            items.append(item)
        passed, evidence = control_centre_project.current_item_metadata_check(config, items)
        self.assertTrue(passed, evidence)
        pr = next(item for item in items if item["content"] == {"number": 62, "type": "PullRequest"})
        pr["status"] = "Backlog"
        pr.pop("current Agent ID")
        passed, evidence = control_centre_project.current_item_metadata_check(config, items)
        self.assertFalse(passed)
        self.assertIn("PullRequest #62 Status", evidence)
        self.assertIn("PullRequest #62 Current Agent ID", evidence)

    def test_privacy_and_accessibility_assets_are_local(self) -> None:
        html = (control_centre.ASSET_ROOT / "index.html").read_text(encoding="utf-8")
        js = (control_centre.ASSET_ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('href="#main"', html)
        self.assertIn('aria-live="polite"', html)
        self.assertNotIn("https://", html)
        self.assertNotIn("http://", html)
        self.assertNotIn("innerHTML", js)
        self.assertNotIn("eval(", js)

    def test_cache_does_not_query_source_on_every_render(self) -> None:
        calls = []
        cache = control_centre.SnapshotCache(30, lambda: calls.append(1) or {"value": len(calls)})
        self.assertEqual(cache.get(), {"value": 1})
        self.assertEqual(cache.get(), {"value": 1})
        self.assertEqual(len(calls), 1)

    def test_http_routes_security_headers_and_mutation_rejection(self) -> None:
        cache = control_centre.SnapshotCache(30, self.snapshot)
        server = control_centre.ThreadingHTTPServer(("127.0.0.1", 0), control_centre.ControlCentreHandler)
        server.snapshot_cache = cache
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            for route in ["/overview", "/agents", "/agent-tree", "/workstreams", "/capabilities", "/skills", "/tools", "/quality", "/cost-tokens", "/performance", "/failures-retries", "/decisions", "/environments", "/traceability", "/audit", "/historical-trends"]:
                with urllib.request.urlopen(base + route) as response:
                    self.assertEqual(response.status, 200)
                    self.assertIn("frame-ancestors 'none'", response.headers["Content-Security-Policy"])
            with urllib.request.urlopen(base + "/api/v1/snapshot") as response:
                payload = json.load(response)
                self.assertTrue(payload["readOnly"])
            request = urllib.request.Request(base + "/api/v1/snapshot", data=b"{}", method="POST")
            with self.assertRaises(urllib.error.HTTPError) as failure:
                urllib.request.urlopen(request)
            self.assertEqual(failure.exception.code, 405)
            self.assertEqual(json.load(failure.exception)["status"], "READ_ONLY")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
