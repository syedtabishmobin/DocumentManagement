#!/usr/bin/env python3
"""Plan and record exactly-once Product Authority notifications."""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / ".agents/config/notifications.json"
DEFAULT_CONTACTS = ROOT / ".agents/config/contacts.json"
REQUIRED_EVENT_FIELDS = {"key", "eventType", "projectId", "subject", "authoritativeUrl", "requiredAction", "reason", "appliesTo", "recommendation", "alternatives", "blocked", "continuing", "remaining"}
UAT_REQUIRED_FIELDS = {"releaseEvidence", "accessInstructions", "deliveredScope", "acceptanceSummary", "residualRisks", "businessAcceptanceStatus", "recommendedUatScenarios"}
STATUSES = {"RESERVED", "SENT", "FAILED", "EXTERNAL_ACTION_REQUIRED"}


def load(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def event_fingerprint(event: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(event, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def validate_event(event: dict[str, Any], config: dict[str, Any]) -> None:
    missing = sorted(REQUIRED_EVENT_FIELDS - set(event))
    if missing:
        raise ValueError(f"notification event missing fields: {', '.join(missing)}")
    if event["eventType"] not in config["events"] or event["projectId"] != config["projectId"]:
        raise ValueError("event type or project does not match notification configuration")
    if not str(event["authoritativeUrl"]).startswith("https://github.com/"):
        raise ValueError("authoritativeUrl must be a direct GitHub URL")
    prefix = "[Doculyra][ACTION REQUIRED]" if event["eventType"] == "BLOCKING_DECISION" else "[Doculyra][UAT READY]"
    if not event["subject"].startswith(prefix):
        raise ValueError(f"subject must start with {prefix}")
    if event["eventType"] == "UAT_READY":
        missing_uat = sorted(UAT_REQUIRED_FIELDS - set(event))
        if missing_uat:
            raise ValueError(f"UAT_READY event missing fields: {', '.join(missing_uat)}")
        if event["businessAcceptanceStatus"] != "PASS":
            raise ValueError("UAT_READY requires PASS business acceptance")


def resolve_recipients(contacts: dict[str, Any]) -> dict[str, list[str]]:
    by_id = {item["id"]: item["email"].strip().lower() for item in contacts["contacts"]}
    routing = contacts["routing"]
    to = by_id[routing["toContactId"]]
    cc = [by_id[item] for item in routing["ccContactIds"]]
    return {"to": [to], "cc": [address for address in dict.fromkeys(cc) if address != to]}


def operational(config: dict[str, Any]) -> bool:
    adapter = config["adapter"]
    return adapter["implementation"] == "IMPLEMENTED" and adapter["activation"] == "ENABLED" and adapter["deliveryConformance"] == "PASS" and adapter["sendAllowed"] is True


def plan(event: dict[str, Any], config: dict[str, Any], contacts: dict[str, Any], ledger: dict[str, Any]) -> dict[str, Any]:
    validate_event(event, config)
    existing = next((item for item in ledger.get("events", []) if item.get("key") == event["key"]), None)
    return {"key": event["key"], "eventType": event["eventType"], "recipients": resolve_recipients(contacts), "adapter": config["adapter"]["kind"], "sendAllowed": operational(config), "result": "READY_TO_SEND" if operational(config) and existing is None else (existing["status"] if existing else config["nonOperationalResult"]), "existing": existing is not None}


def atomic_write(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
        temp_name = handle.name
    os.replace(temp_name, path)


def record(event: dict[str, Any], config: dict[str, Any], ledger_path: Path, status: str, evidence: str, provider_message_id: str | None) -> dict[str, Any]:
    validate_event(event, config)
    if status not in STATUSES:
        raise ValueError(f"unsupported status: {status}")
    if status == "SENT" and (not operational(config) or not provider_message_id):
        raise ValueError("SENT requires an operational adapter and provider message ID")
    lock_path = ledger_path.with_suffix(ledger_path.suffix + ".lock")
    lock_path.touch(exist_ok=True)
    with lock_path.open("r+") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        ledger = load(ledger_path)
        now = datetime.now(timezone.utc).isoformat()
        fingerprint = event_fingerprint(event)
        existing = next((item for item in ledger.get("events", []) if item.get("key") == event["key"]), None)
        if existing:
            if existing.get("fingerprint") != fingerprint:
                raise ValueError("deduplication key already exists for a different event payload")
            if existing.get("status") == "SENT" and status != "SENT":
                raise ValueError("a confirmed SENT event cannot be downgraded")
            existing.update({"status": status, "lastUpdatedAt": now, "evidence": evidence})
            if provider_message_id:
                existing["providerMessageId"] = provider_message_id
            result = existing
        else:
            result = {"key": event["key"], "eventType": event["eventType"], "subject": event["subject"], "authoritativeUrl": event["authoritativeUrl"], "fingerprint": fingerprint, "status": status, "firstRecordedAt": now, "lastUpdatedAt": now, "evidence": evidence}
            if provider_message_id:
                result["providerMessageId"] = provider_message_id
            ledger.setdefault("events", []).append(result)
        atomic_write(ledger_path, ledger)
        return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["plan", "record"])
    parser.add_argument("event")
    parser.add_argument("--status", choices=sorted(STATUSES))
    parser.add_argument("--evidence")
    parser.add_argument("--provider-message-id")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--contacts", default=str(DEFAULT_CONTACTS))
    parser.add_argument("--ledger")
    args = parser.parse_args()
    config = load(Path(args.config))
    event = load(Path(args.event))
    ledger_path = Path(args.ledger or ROOT / config["ledger"])
    if args.command == "plan":
        result = plan(event, config, load(Path(args.contacts)), load(ledger_path))
    else:
        if not args.status or not args.evidence:
            parser.error("record requires --status and --evidence")
        result = record(event, config, ledger_path, args.status, args.evidence, args.provider_message_id)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
