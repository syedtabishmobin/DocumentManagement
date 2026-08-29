#!/usr/bin/env python3
"""Focused tests for framework, notification and attribution invariants."""

from __future__ import annotations

import copy
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import github_attribution
import notification_ledger
import validate_agent_framework

ROOT = Path(__file__).resolve().parents[1]


class FrameworkTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = notification_ledger.load(ROOT / ".agents/config/notifications.json")
        self.contacts = notification_ledger.load(ROOT / ".agents/config/contacts.json")
        self.event = {
            "key": "decision:dec-test:first-blocking-notification",
            "eventType": "BLOCKING_DECISION",
            "projectId": "doculyra",
            "subject": "[Doculyra][ACTION REQUIRED][DEC-TEST] Test decision",
            "authoritativeUrl": "https://github.com/syedtabishmobin/DocumentManagement/issues/18",
            "requiredAction": "Choose an option.",
            "reason": "A bounded path requires authority.",
            "appliesTo": ["framework notification conformance"],
            "recommendation": "Option A because it preserves the approved architecture.",
            "alternatives": ["Option B delays activation and retains the existing blocker."],
            "blocked": ["autonomous queue activation"],
            "continuing": ["independent framework validation"],
            "remaining": ["apply the recorded decision and rerun conformance"],
        }

    def operational_config(self) -> dict:
        config = copy.deepcopy(self.config)
        config["adapter"].update({"activation": "ENABLED", "deliveryConformance": "PASS", "sendAllowed": True})
        return config

    def ledger(self, directory: str) -> Path:
        path = Path(directory) / "ledger.json"
        path.write_text('{"schemaVersion":"1.0.0","events":[]}\n', encoding="utf-8")
        return path

    def test_duplicate_recipient_is_removed_from_cc(self) -> None:
        expected_to = self.contacts["routing"]["resolved"]["to"]
        self.assertEqual(notification_ledger.resolve_recipients(self.contacts), {"to": expected_to, "cc": []})

    def test_allow_list_drift_fails_closed(self) -> None:
        contacts = copy.deepcopy(self.contacts)
        contacts["routing"]["resolved"]["cc"] = contacts["routing"]["resolved"]["to"]
        with self.assertRaisesRegex(ValueError, "allow-list"):
            notification_ledger.resolve_recipients(contacts)

    def test_disabled_adapter_reports_external_action(self) -> None:
        result = notification_ledger.plan(self.event, self.config, self.contacts, {"schemaVersion": "1.0.0", "events": []})
        self.assertFalse(result["sendAllowed"])
        self.assertEqual(result["result"], "EXTERNAL_ACTION_REQUIRED")

    def test_conformance_mode_is_explicit_and_normal_send_remains_disabled(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            with self.assertRaisesRegex(ValueError, "not enabled"):
                notification_ledger.reserve(self.event, self.config, self.contacts, ledger_path)
            reserved = notification_ledger.reserve(self.event, self.config, self.contacts, ledger_path, conformance=True)
            self.assertTrue(reserved["acquired"])

    def test_atomic_reservation_has_one_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            now = datetime(2026, 8, 29, 12, 0, tzinfo=timezone.utc)
            with ThreadPoolExecutor(max_workers=2) as executor:
                results = list(executor.map(lambda _: notification_ledger.reserve(self.event, config, self.contacts, ledger_path, now=now), range(2)))
            self.assertEqual(sum(result["acquired"] for result in results), 1)
            self.assertEqual({result["result"] for result in results}, {"RESERVED", "DUPLICATE_IN_PROGRESS"})
            self.assertEqual(len(notification_ledger.load(ledger_path)["events"]), 1)

    def test_provider_operation_id_is_deterministic_and_payload_bound(self) -> None:
        stable = notification_ledger.provider_operation_id(self.event)
        self.assertEqual(stable, notification_ledger.provider_operation_id(copy.deepcopy(self.event)))
        changed = copy.deepcopy(self.event)
        changed["subject"] += " changed"
        self.assertNotEqual(stable, notification_ledger.provider_operation_id(changed))

    def test_same_key_cannot_change_payload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            notification_ledger.record(self.event, self.config, ledger_path, "EXTERNAL_ACTION_REQUIRED", self.event["authoritativeUrl"], None)
            changed = dict(self.event)
            changed["subject"] += " changed"
            with self.assertRaisesRegex(ValueError, "different event payload"):
                notification_ledger.record(changed, self.config, ledger_path, "EXTERNAL_ACTION_REQUIRED", changed["authoritativeUrl"], None)

    def test_provider_submission_is_not_delivery(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
            submitted = notification_ledger.mark_submitted(self.event, config, ledger_path, reservation["plan"]["providerOperationId"], "Succeeded")
            self.assertEqual(submitted["status"], "SUBMITTED")
            self.assertEqual(submitted["evidence"], "ACS_OUT_FOR_DELIVERY")

    def test_sent_can_only_be_recorded_by_terminal_delivery_reconciliation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            with self.assertRaisesRegex(ValueError, "delivery reconciliation"):
                notification_ledger.record(self.event, self.operational_config(), ledger_path, "SENT", "false-claim", None)

    def test_delivered_reconciliation_is_idempotent_and_cannot_be_downgraded(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
            message_id = reservation["plan"]["providerOperationId"]
            notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
            delivered = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, "Delivered")
            repeated = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, "Delivered")
            self.assertEqual(delivered["status"], "SENT")
            self.assertEqual(repeated["status"], "SENT")
            conflicting = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, "Bounced")
            self.assertEqual(conflicting["status"], "SENT")
            self.assertEqual(conflicting["deliveryStatus"], "Delivered")
            self.assertEqual(conflicting["deliveryReconciliationStatus"], "CONFLICTING_TERMINAL_IGNORED")

    def test_pending_and_negative_delivery_are_truthful(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
            message_id = reservation["plan"]["providerOperationId"]
            notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
            pending = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, "PENDING")
            failed = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, "Suppressed")
            self.assertEqual(pending["status"], "SUBMITTED")
            self.assertEqual(failed["status"], "FAILED")
            self.assertEqual(failed["deliveryStatus"], "Suppressed")

    def test_delivery_query_failure_is_durable_without_erasing_submission(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
            message_id = reservation["plan"]["providerOperationId"]
            notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
            failed = notification_ledger.record_reconciliation_failure(self.event, ledger_path, "DELIVERY_RECONCILIATION_EXTERNAL_ACTION_REQUIRED")
            self.assertEqual(failed["status"], "SUBMITTED")
            self.assertEqual(failed["deliveryReconciliationStatus"], "EXTERNAL_ACTION_REQUIRED")

    def test_delivery_query_failure_preserves_each_existing_terminal_state(self) -> None:
        for terminal in ("Delivered", *sorted(notification_ledger.NEGATIVE_DELIVERY_STATUSES)):
            with self.subTest(terminal=terminal), tempfile.TemporaryDirectory() as directory:
                ledger_path = self.ledger(directory)
                config = self.operational_config()
                reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
                message_id = reservation["plan"]["providerOperationId"]
                notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
                terminal_entry = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, terminal)
                original_evidence = terminal_entry["evidence"]
                failed = notification_ledger.record_reconciliation_failure(self.event, ledger_path, "DELIVERY_RECONCILIATION_EXTERNAL_ACTION_REQUIRED")
                self.assertEqual(failed["status"], "SENT" if terminal == "Delivered" else "FAILED")
                self.assertEqual(failed["deliveryStatus"], terminal)
                self.assertEqual(failed["evidence"], original_evidence)
                self.assertEqual(failed["deliveryReconciliationStatus"], "EXTERNAL_ACTION_REQUIRED")

    def test_first_terminal_delivery_evidence_is_immutable_in_both_orders(self) -> None:
        for terminal in ("Delivered", *sorted(notification_ledger.NEGATIVE_DELIVERY_STATUSES)):
            with self.subTest(duplicate=terminal), tempfile.TemporaryDirectory() as directory:
                ledger_path = self.ledger(directory)
                config = self.operational_config()
                reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
                message_id = reservation["plan"]["providerOperationId"]
                notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
                first = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, terminal, observed_at="2026-08-29T12:00:00Z")
                repeated = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, terminal, observed_at="2026-08-29T12:01:00Z")
                self.assertEqual(repeated["status"], first["status"])
                self.assertEqual(repeated["deliveryStatus"], terminal)
                self.assertEqual(repeated["deliveryObservedAt"], "2026-08-29T12:00:00Z")
                self.assertEqual(repeated["evidence"], first["evidence"])
        pairs = (("Bounced", "Suppressed"), ("Suppressed", "Bounced"), ("Delivered", "Failed"), ("Failed", "Delivered"))
        for first, second in pairs:
            with self.subTest(first=first, second=second), tempfile.TemporaryDirectory() as directory:
                ledger_path = self.ledger(directory)
                config = self.operational_config()
                reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
                message_id = reservation["plan"]["providerOperationId"]
                notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
                original = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, first, observed_at="2026-08-29T12:00:00Z")
                original_evidence = original["evidence"]
                repeated = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, first, observed_at="2026-08-29T12:01:00Z")
                conflicting = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, second, observed_at="2026-08-29T12:02:00Z")
                self.assertEqual(repeated["deliveryObservedAt"], "2026-08-29T12:00:00Z")
                self.assertEqual(conflicting["deliveryStatus"], first)
                self.assertEqual(conflicting["deliveryObservedAt"], "2026-08-29T12:00:00Z")
                self.assertEqual(conflicting["evidence"], original_evidence)
                self.assertEqual(conflicting["lastConflictingDeliveryStatus"], second)

    def test_bounded_retry_exhaustion_cannot_spam(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            start = datetime(2026, 8, 29, 12, 0, tzinfo=timezone.utc)
            first = notification_ledger.reserve(self.event, config, self.contacts, ledger_path, now=start)
            second = notification_ledger.reserve(self.event, config, self.contacts, ledger_path, retry=True, now=start + timedelta(minutes=6))
            third = notification_ledger.reserve(self.event, config, self.contacts, ledger_path, retry=True, now=start + timedelta(minutes=12))
            exhausted = notification_ledger.reserve(self.event, config, self.contacts, ledger_path, retry=True, now=start + timedelta(minutes=18))
            self.assertTrue(first["acquired"] and second["acquired"] and third["acquired"])
            self.assertFalse(exhausted["acquired"])
            self.assertEqual(exhausted["result"], "EXTERNAL_ACTION_REQUIRED")
            self.assertEqual(exhausted["entry"]["attemptCount"], 3)

    def test_unambiguous_transport_failure_requires_external_action(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
            failed = notification_ledger.record_failure(self.event, config, ledger_path, "PROVIDER_AUTHENTICATION_FAILED")
            self.assertEqual(failed["status"], "EXTERNAL_ACTION_REQUIRED")

    def test_dispatch_invokes_transport_once_and_duplicate_dispatch_does_not_resend(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            message_id = notification_ledger.provider_operation_id(self.event)
            with patch.object(notification_ledger, "_transport", return_value={"status": "SUBMITTED", "providerMessageId": message_id, "providerStatus": "Succeeded"}) as transport:
                first = notification_ledger.dispatch(self.event, config, self.contacts, ledger_path, conformance=False, retry=False)
                duplicate = notification_ledger.dispatch(self.event, config, self.contacts, ledger_path, conformance=False, retry=False)
            self.assertEqual(first["result"], "SUBMITTED")
            self.assertEqual(duplicate["result"], "SUBMITTED")
            transport.assert_called_once()

    def test_dispatch_transport_failure_records_external_action(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            with patch.object(notification_ledger, "_transport", side_effect=RuntimeError("synthetic provider failure")):
                result = notification_ledger.dispatch(self.event, config, self.contacts, ledger_path, conformance=False, retry=False)
            self.assertEqual(result["result"], "EXTERNAL_ACTION_REQUIRED")
            self.assertEqual(notification_ledger.load(ledger_path)["events"][0]["status"], "EXTERNAL_ACTION_REQUIRED")

    def test_delivery_check_reconciles_provider_terminal_result(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = self.ledger(directory)
            config = self.operational_config()
            reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
            message_id = reservation["plan"]["providerOperationId"]
            notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
            with patch.object(notification_ledger, "_transport", return_value={"status": "DELIVERED", "providerMessageId": message_id, "deliveryStatus": "Delivered", "observedAt": "2026-08-29T12:00:00Z", "hardBounce": False}):
                result = notification_ledger.check_delivery(self.event, config, ledger_path)
            self.assertEqual(result["result"], "SENT")
            self.assertEqual(result["deliveryStatus"], "Delivered")

    def test_delivery_check_fails_closed_for_malformed_or_mismatched_provider_output(self) -> None:
        malformed = (
            {},
            {"status": "DELIVERED", "providerMessageId": "wrong", "deliveryStatus": "Delivered"},
            {"status": "DELIVERED", "providerMessageId": None, "deliveryStatus": "Delivered"},
            {"status": "DELIVERED", "deliveryStatus": "Delivered"},
            {"status": "DELIVERED", "providerMessageId": "placeholder"},
            {"status": "FAILED", "providerMessageId": "placeholder", "deliveryStatus": "Delivered"},
            {"status": "PENDING", "providerMessageId": "placeholder", "deliveryStatus": "Bounced"},
            {"status": "DELIVERED", "providerMessageId": "placeholder", "deliveryStatus": "Delivered", "unexpected": True},
        )
        for response in malformed:
            with self.subTest(response=response), tempfile.TemporaryDirectory() as directory:
                ledger_path = self.ledger(directory)
                config = self.operational_config()
                reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
                message_id = reservation["plan"]["providerOperationId"]
                notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
                candidate = copy.deepcopy(response)
                if candidate.get("providerMessageId") == "placeholder":
                    candidate["providerMessageId"] = message_id
                with patch.object(notification_ledger, "_transport", return_value=candidate):
                    result = notification_ledger.check_delivery(self.event, config, ledger_path)
                entry = notification_ledger.load(ledger_path)["events"][0]
                self.assertEqual(result["result"], "EXTERNAL_ACTION_REQUIRED")
                self.assertEqual(entry["status"], "SUBMITTED")
                self.assertEqual(entry["deliveryReconciliationStatus"], "EXTERNAL_ACTION_REQUIRED")

    def test_delivery_check_timeout_from_submitted_or_terminal_preserves_truth(self) -> None:
        for terminal in (None, "Delivered", "Bounced"):
            with self.subTest(terminal=terminal), tempfile.TemporaryDirectory() as directory:
                ledger_path = self.ledger(directory)
                config = self.operational_config()
                reservation = notification_ledger.reserve(self.event, config, self.contacts, ledger_path)
                message_id = reservation["plan"]["providerOperationId"]
                notification_ledger.mark_submitted(self.event, config, ledger_path, message_id, "Succeeded")
                terminal_entry = notification_ledger.reconcile_delivery(self.event, config, ledger_path, message_id, terminal) if terminal else None
                original_evidence = terminal_entry["evidence"] if terminal_entry else None
                with patch.object(notification_ledger, "_transport", side_effect=RuntimeError("synthetic timeout")):
                    result = notification_ledger.check_delivery(self.event, config, ledger_path)
                entry = notification_ledger.load(ledger_path)["events"][0]
                self.assertEqual(result["result"], "EXTERNAL_ACTION_REQUIRED")
                self.assertEqual(entry["status"], "SUBMITTED" if terminal is None else ("SENT" if terminal == "Delivered" else "FAILED"))
                self.assertEqual(entry["deliveryReconciliationStatus"], "EXTERNAL_ACTION_REQUIRED")
                if terminal:
                    self.assertEqual(entry["deliveryStatus"], terminal)
                    self.assertEqual(entry["evidence"], original_evidence)

    def test_blocking_message_contains_all_required_decision_sections(self) -> None:
        body = notification_ledger.compose_plain_text(self.event)
        for marker in ("Authoritative record:", "Action required:", "Recommendation:", "Alternatives and impacts:", "Work blocked:", "Work continuing:", "Work remaining after this action:"):
            self.assertIn(marker, body)
        self.assertIn(self.event["authoritativeUrl"], body)

    def test_uat_message_contains_complete_acceptance_packet(self) -> None:
        event = copy.deepcopy(self.event)
        event.update({
            "key": "release:rc-notify-test:uat-ready",
            "eventType": "UAT_READY",
            "subject": "[Doculyra][UAT READY][RC-NOTIFY-TEST] Notification conformance",
            "releaseEvidence": "https://github.com/syedtabishmobin/DocumentManagement/issues/18",
            "accessInstructions": "Use the synthetic Stage route in the authoritative record.",
            "deliveredScope": ["notification adapter only"],
            "acceptanceSummary": "Independent framework checks passed.",
            "residualRisks": ["Live Azure conformance remains environment-dependent."],
            "businessAcceptanceStatus": "PASS",
            "recommendedUatScenarios": ["Verify the subject, links and one-recipient routing."],
        })
        notification_ledger.validate_event(event, self.config)
        body = notification_ledger.compose_plain_text(event)
        for marker in ("Stage access:", "Delivered scope:", "QA, test and evaluation summary:", "Known residual defects and risks:", "BA/business acceptance status:", "Recommended UAT scenarios:", "Durable release evidence:"):
            self.assertIn(marker, body)

    def test_record_validator_reports_missing_required_field(self) -> None:
        schema = notification_ledger.load(ROOT / ".agents/protocols/notification-event.schema.json")
        incomplete = dict(self.event)
        incomplete.pop("reason")
        self.assertTrue(any("reason" in error for error in validate_agent_framework.validate_required(incomplete, schema)))

    def test_uat_ready_requires_complete_accepted_packet(self) -> None:
        event = dict(self.event)
        event.update({"key": "release:rc-test:uat-ready", "eventType": "UAT_READY", "subject": "[Doculyra][UAT READY][RC-TEST] Test candidate"})
        with self.assertRaisesRegex(ValueError, "UAT_READY event missing fields"):
            notification_ledger.validate_event(event, self.config)

    def test_notification_event_rejects_non_durable_routes_and_sensitive_content_canaries(self) -> None:
        unsafe_urls = (
            "http://github.com/syedtabishmobin/DocumentManagement/issues/18",
            "https://user:pass@github.com/syedtabishmobin/DocumentManagement/issues/18",
            "https://github.com/syedtabishmobin/DocumentManagement/settings/secrets/actions",
            "https://github.com/syedtabishmobin/DocumentManagement/issues/18?token=synthetic",
            "https://github.com/syedtabishmobin/DocumentManagement/issues/18#fragment",
            "https://github.com/other/repository/issues/18",
        )
        for value in unsafe_urls:
            with self.subTest(url=value):
                event = copy.deepcopy(self.event)
                event["authoritativeUrl"] = value
                with self.assertRaisesRegex(ValueError, "authoritativeUrl"):
                    notification_ledger.validate_event(event, self.config)
        canaries = (
            "Raw prompt: synthetic customer request",
            "Authorization: Bearer synthetic-token-value",
            "client_secret=synthetic-value",
            "Tool output: synthetic provider payload",
            "Customer content: synthetic document body",
        )
        for value in canaries:
            with self.subTest(value=value):
                event = copy.deepcopy(self.event)
                event["reason"] = value
                with self.assertRaisesRegex(ValueError, "prohibited"):
                    notification_ledger.validate_event(event, self.config)

    def test_notification_event_accepts_each_configured_durable_route_class(self) -> None:
        urls = (
            "https://github.com/syedtabishmobin/DocumentManagement/issues/18",
            "https://github.com/syedtabishmobin/DocumentManagement/pull/19",
            "https://github.com/syedtabishmobin/DocumentManagement/actions/runs/33254027462",
            "https://github.com/syedtabishmobin/DocumentManagement/actions/runs/33254027462/job/99104523095",
            "https://github.com/syedtabishmobin/DocumentManagement/commit/c590b2437b6e0e1feaa7ab530dc5ffa509a28295",
        )
        for value in urls:
            with self.subTest(url=value):
                event = copy.deepcopy(self.event)
                event["authoritativeUrl"] = value
                notification_ledger.validate_event(event, self.config)

    def test_github_agent_attribution_round_trip_and_missing_field_rejection(self) -> None:
        values = {
            "agent_id": "codex-test",
            "run_id": "run-test",
            "role_id": "qa-release-lead",
            "work_item": "issue-18",
            "capability_ids": "telemetry-validation",
            "skill_ids": "telemetry-validation",
            "tool_ids": "github-issues,pnpm-node",
        }
        footer = github_attribution.render(values)
        self.assertEqual(github_attribution.validate(f"Evidence\n\n{footer}"), [])
        values.pop("run_id")
        with self.assertRaisesRegex(ValueError, "run_id"):
            github_attribution.render(values)

    def test_github_agent_attribution_rejects_unregistered_mismatched_and_duplicate_claims(self) -> None:
        values = {
            "agent_id": "codex-test",
            "run_id": "run-test",
            "role_id": "qa-release-lead",
            "work_item": "issue-18",
            "capability_ids": "telemetry-validation",
            "skill_ids": "telemetry-validation",
            "tool_ids": "github-issues,pnpm-node",
        }
        variants = (
            ("role_id", "nonexistent-role", "not registered"),
            ("capability_ids", "critical-decision", "not authorised"),
            ("capability_ids", "nonexistent-capability", "unregistered"),
            ("skill_ids", "nonexistent-skill", "unregistered"),
            ("skill_ids", "defect-evidence", "not matched"),
            ("tool_ids", "nonexistent-tool", "unregistered"),
            ("tool_ids", "github-issues,github-issues", "duplicate"),
            ("tool_ids", "github-issues,", "empty"),
        )
        for field, value, message in variants:
            with self.subTest(field=field, value=value):
                candidate = dict(values)
                candidate[field] = value
                with self.assertRaisesRegex(ValueError, message):
                    github_attribution.render(candidate)


if __name__ == "__main__":
    unittest.main()
