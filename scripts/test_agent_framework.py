#!/usr/bin/env python3
"""Focused tests for framework record and notification invariants."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import notification_ledger
import validate_agent_framework

ROOT = Path(__file__).resolve().parents[1]


class FrameworkTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = notification_ledger.load(ROOT / ".agents/config/notifications.json")
        self.contacts = notification_ledger.load(ROOT / ".agents/config/contacts.json")
        self.event = {"key": "decision:dec-test:first-blocking-notification", "eventType": "BLOCKING_DECISION", "projectId": "doculyra", "subject": "[Doculyra][ACTION REQUIRED][DEC-TEST] Test decision", "authoritativeUrl": "https://github.com/syedtabishmobin/DocumentManagement/issues/1", "requiredAction": "Choose an option.", "reason": "A bounded path requires authority.", "appliesTo": ["test"], "recommendation": "Option A", "alternatives": ["Option B"], "blocked": ["test path"], "continuing": ["independent work"], "remaining": ["implement decision"]}

    def test_duplicate_recipient_is_removed_from_cc(self) -> None:
        expected_to = self.contacts["routing"]["resolved"]["to"]
        self.assertEqual(notification_ledger.resolve_recipients(self.contacts), {"to": expected_to, "cc": []})

    def test_disabled_adapter_reports_external_action(self) -> None:
        result = notification_ledger.plan(self.event, self.config, self.contacts, {"schemaVersion": "1.0.0", "events": []})
        self.assertFalse(result["sendAllowed"])
        self.assertEqual(result["result"], "EXTERNAL_ACTION_REQUIRED")

    def test_same_key_cannot_change_payload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = Path(directory) / "ledger.json"
            ledger_path.write_text('{"schemaVersion":"1.0.0","events":[]}\n', encoding="utf-8")
            notification_ledger.record(self.event, self.config, ledger_path, "EXTERNAL_ACTION_REQUIRED", self.event["authoritativeUrl"], None)
            changed = dict(self.event)
            changed["subject"] += " changed"
            with self.assertRaisesRegex(ValueError, "different event payload"):
                notification_ledger.record(changed, self.config, ledger_path, "EXTERNAL_ACTION_REQUIRED", changed["authoritativeUrl"], None)

    def test_sent_requires_operational_adapter_and_provider_id(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            ledger_path = Path(directory) / "ledger.json"
            ledger_path.write_text('{"schemaVersion":"1.0.0","events":[]}\n', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "operational adapter"):
                notification_ledger.record(self.event, self.config, ledger_path, "SENT", self.event["authoritativeUrl"], None)

    def test_record_validator_reports_missing_required_field(self) -> None:
        schema = notification_ledger.load(ROOT / ".agents/protocols/notification-event.schema.json")
        incomplete = dict(self.event)
        incomplete.pop("reason")
        self.assertTrue(any("reason" in error for error in validate_agent_framework.validate_required(incomplete, schema)))

    def test_uat_ready_requires_complete_accepted_packet(self) -> None:
        uat_event = dict(self.event)
        uat_event.update({"key": "release:rc-test:uat-ready", "eventType": "UAT_READY", "subject": "[Doculyra][UAT READY][RC-TEST] Test candidate"})
        with self.assertRaisesRegex(ValueError, "UAT_READY event missing fields"):
            notification_ledger.validate_event(uat_event, self.config)


if __name__ == "__main__":
    unittest.main()
