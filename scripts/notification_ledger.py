#!/usr/bin/env python3
"""Plan, reserve, dispatch and reconcile Product Authority notifications."""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import subprocess
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

from validate_observability import FORBIDDEN_VALUE_PATTERNS, validate_url

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / ".agents/config/notifications.json"
DEFAULT_CONTACTS = ROOT / ".agents/config/contacts.json"
OBSERVABILITY_CONFIG = ROOT / ".agents/project/observability.json"
REQUIRED_EVENT_FIELDS = {"key", "eventType", "projectId", "subject", "authoritativeUrl", "requiredAction", "reason", "appliesTo", "recommendation", "alternatives", "blocked", "continuing", "remaining"}
UAT_REQUIRED_FIELDS = {"releaseEvidence", "accessInstructions", "deliveredScope", "acceptanceSummary", "residualRisks", "businessAcceptanceStatus", "recommendedUatScenarios"}
STATUSES = {"RESERVED", "SUBMITTED", "SENT", "FAILED", "EXTERNAL_ACTION_REQUIRED"}
NEGATIVE_DELIVERY_STATUSES = {"Bounced", "Quarantined", "FilteredSpam", "Suppressed", "Failed"}
OPERATION_NAMESPACE = uuid.UUID("58a0cc27-95c8-4a62-a7bf-d21eff2ac466")


def load(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def event_fingerprint(event: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(event, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def provider_operation_id(event: dict[str, Any]) -> str:
    return str(uuid.uuid5(OPERATION_NAMESPACE, f"{event['key']}:{event_fingerprint(event)}"))


def _non_empty_text(value: Any, name: str) -> None:
    if not isinstance(value, str) or not value.strip() or len(value) > 20_000:
        raise ValueError(f"{name} must be non-empty minimized text")
    if "\n" in value or "\r" in value or any(pattern.search(value) for pattern in FORBIDDEN_VALUE_PATTERNS):
        raise ValueError(f"{name} contains prohibited prompt, content, credential, or payload material")


def _text_list(value: Any, name: str, *, allow_empty: bool = False) -> None:
    if not isinstance(value, list) or len(value) > 20 or (not allow_empty and not value):
        raise ValueError(f"{name} must be a bounded list of non-empty text")
    for item in value:
        _non_empty_text(item, name)
        if len(item) > 2_000:
            raise ValueError(f"{name} must be a bounded list of non-empty text")
    if len(value) != len(set(value)):
        raise ValueError(f"{name} must not contain duplicate entries")


def _durable_github_url(value: Any, name: str) -> None:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be a durable configured-repository GitHub URL")
    observability = load(OBSERVABILITY_CONFIG)
    privacy = observability.get("privacy", {})
    try:
        patterns = tuple(re.compile(pattern) for pattern in privacy.get("evidenceRoutePatterns", []))
    except re.error as exc:
        raise ValueError("configured evidence route pattern is invalid") from exc
    errors = validate_url(
        value,
        set(privacy.get("evidenceHosts", [])),
        set(privacy.get("evidenceRepositories", [])),
        patterns,
        name,
    )
    if errors:
        raise ValueError(errors[0])


def validate_event(event: dict[str, Any], config: dict[str, Any]) -> None:
    missing = sorted(REQUIRED_EVENT_FIELDS - set(event))
    if missing:
        raise ValueError(f"notification event missing fields: {', '.join(missing)}")
    if event["eventType"] not in config["events"] or event["projectId"] != config["projectId"]:
        raise ValueError("event type or project does not match notification configuration")
    if len(json.dumps(event, separators=(",", ":")).encode("utf-8")) > 32_768:
        raise ValueError("notification event exceeds the minimized size limit")
    _durable_github_url(event["authoritativeUrl"], "authoritativeUrl")
    prefix = "[Doculyra][ACTION REQUIRED]" if event["eventType"] == "BLOCKING_DECISION" else "[Doculyra][UAT READY]"
    _non_empty_text(event["subject"], "subject")
    if not event["subject"].startswith(prefix) or len(event["subject"]) > 200:
        raise ValueError(f"subject must start with {prefix} and remain bounded")
    for field in ("requiredAction", "reason", "recommendation"):
        _non_empty_text(event[field], field)
    for field in ("appliesTo", "alternatives", "blocked", "continuing", "remaining"):
        _text_list(event[field], field, allow_empty=field == "continuing")
    if event["eventType"] == "UAT_READY":
        missing_uat = sorted(UAT_REQUIRED_FIELDS - set(event))
        if missing_uat:
            raise ValueError(f"UAT_READY event missing fields: {', '.join(missing_uat)}")
        if event["businessAcceptanceStatus"] != "PASS":
            raise ValueError("UAT_READY requires PASS business acceptance")
        for field in ("releaseEvidence", "accessInstructions", "acceptanceSummary"):
            _non_empty_text(event[field], field)
        for field in ("deliveredScope", "residualRisks", "recommendedUatScenarios"):
            _text_list(event[field], field, allow_empty=field == "residualRisks")
        _durable_github_url(event["releaseEvidence"], "releaseEvidence")


def resolve_recipients(contacts: dict[str, Any]) -> dict[str, list[str]]:
    by_id = {item["id"]: item["email"].strip().lower() for item in contacts["contacts"]}
    routing = contacts["routing"]
    to = by_id[routing["toContactId"]]
    cc = [by_id[item] for item in routing["ccContactIds"]]
    recipients = {"to": [to], "cc": [address for address in dict.fromkeys(cc) if address != to]}
    if recipients != routing.get("resolved"):
        raise ValueError("computed recipients do not match the reviewed recipient allow-list")
    return recipients


def operational(config: dict[str, Any]) -> bool:
    adapter = config["adapter"]
    return adapter["implementation"] == "IMPLEMENTED" and adapter["activation"] == "ENABLED" and adapter["deliveryConformance"] == "PASS" and adapter["sendAllowed"] is True


def conformance_allowed(config: dict[str, Any]) -> bool:
    adapter = config["adapter"]
    return adapter["implementation"] == "IMPLEMENTED" and adapter["activation"] == "CONFIGURED_DISABLED" and adapter["deliveryConformance"] in {"NOT_RUN", "BLOCKED_EXTERNAL_VALIDATION"} and adapter.get("conformanceSendAllowed") is True


def _bullets(values: list[str]) -> str:
    return "\n".join(f"- {value}" for value in values) if values else "- None recorded."


def compose_plain_text(event: dict[str, Any]) -> str:
    sections = [
        event["subject"],
        f"Authoritative record: {event['authoritativeUrl']}",
        f"Action required:\n{event['requiredAction']}",
        f"Why this notification was raised:\n{event['reason']}",
        f"Applies to:\n{_bullets(event['appliesTo'])}",
        f"Recommendation:\n{event['recommendation']}",
        f"Alternatives and impacts:\n{_bullets(event['alternatives'])}",
        f"Work blocked:\n{_bullets(event['blocked'])}",
        f"Work continuing:\n{_bullets(event['continuing'])}",
        f"Work remaining after this action:\n{_bullets(event['remaining'])}",
    ]
    if event["eventType"] == "UAT_READY":
        sections.extend([
            f"Stage access:\n{event['accessInstructions']}",
            f"Delivered scope:\n{_bullets(event['deliveredScope'])}",
            f"QA, test and evaluation summary:\n{event['acceptanceSummary']}",
            f"Known residual defects and risks:\n{_bullets(event['residualRisks'])}",
            f"BA/business acceptance status:\n{event['businessAcceptanceStatus']}",
            f"Recommended UAT scenarios:\n{_bullets(event['recommendedUatScenarios'])}",
            f"Durable release evidence: {event['releaseEvidence']}",
        ])
    return "\n\n".join(sections) + "\n"


def dispatch_plan(event: dict[str, Any], config: dict[str, Any], contacts: dict[str, Any]) -> dict[str, Any]:
    validate_event(event, config)
    return {
        "schemaVersion": "1.0.0",
        "eventKey": event["key"],
        "eventType": event["eventType"],
        "providerOperationId": provider_operation_id(event),
        "subject": event["subject"],
        "plainText": compose_plain_text(event),
        "recipients": resolve_recipients(contacts),
    }


def plan(event: dict[str, Any], config: dict[str, Any], contacts: dict[str, Any], ledger: dict[str, Any]) -> dict[str, Any]:
    validate_event(event, config)
    existing = next((item for item in ledger.get("events", []) if item.get("key") == event["key"]), None)
    return {
        "key": event["key"],
        "eventType": event["eventType"],
        "recipients": resolve_recipients(contacts),
        "adapter": config["adapter"]["kind"],
        "sendAllowed": operational(config),
        "result": "READY_TO_SEND" if operational(config) and existing is None else (existing["status"] if existing else config["nonOperationalResult"]),
        "existing": existing is not None,
    }


def atomic_write(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
        temp_name = handle.name
    os.chmod(temp_name, 0o600)
    os.replace(temp_name, path)


def _locked_ledger(ledger_path: Path, callback: Callable[[dict[str, Any]], dict[str, Any]]) -> dict[str, Any]:
    lock_path = ledger_path.with_suffix(ledger_path.suffix + ".lock")
    lock_path.touch(exist_ok=True)
    os.chmod(lock_path, 0o600)
    with lock_path.open("r+") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        ledger = load(ledger_path)
        result = callback(ledger)
        atomic_write(ledger_path, ledger)
        return result


def _existing(ledger: dict[str, Any], key: str) -> dict[str, Any] | None:
    return next((item for item in ledger.get("events", []) if item.get("key") == key), None)


def reserve(event: dict[str, Any], config: dict[str, Any], contacts: dict[str, Any], ledger_path: Path, *, conformance: bool = False, retry: bool = False, now: datetime | None = None) -> dict[str, Any]:
    validate_event(event, config)
    if not operational(config) and not (conformance and conformance_allowed(config)):
        raise ValueError("notification adapter is not enabled for this send mode")
    plan_payload = dispatch_plan(event, config, contacts)
    fingerprint = event_fingerprint(event)
    current = now or datetime.now(timezone.utc)
    lease_seconds = int(config["adapter"]["delivery"]["reservationLeaseSeconds"])
    max_attempts = int(config["adapter"]["delivery"]["maxDispatchAttempts"])

    def update(ledger: dict[str, Any]) -> dict[str, Any]:
        existing = _existing(ledger, event["key"])
        if existing:
            if existing.get("fingerprint") != fingerprint:
                raise ValueError("deduplication key already exists for a different event payload")
            if existing["status"] in {"SUBMITTED", "SENT"}:
                return {"acquired": False, "result": existing["status"], "entry": existing, "plan": plan_payload}
            if existing["status"] in {"FAILED", "EXTERNAL_ACTION_REQUIRED"} and not retry:
                return {"acquired": False, "result": existing["status"], "entry": existing, "plan": plan_payload}
            lease_until = datetime.fromisoformat(existing.get("reservationLeaseUntil", current.isoformat()))
            if existing["status"] == "RESERVED" and lease_until > current:
                return {"acquired": False, "result": "DUPLICATE_IN_PROGRESS", "entry": existing, "plan": plan_payload}
            if int(existing.get("attemptCount", 0)) >= max_attempts:
                existing.update({"status": "EXTERNAL_ACTION_REQUIRED", "lastUpdatedAt": current.isoformat(), "evidence": "MAX_DISPATCH_ATTEMPTS_EXHAUSTED"})
                return {"acquired": False, "result": "EXTERNAL_ACTION_REQUIRED", "entry": existing, "plan": plan_payload}
            existing.update({
                "status": "RESERVED",
                "attemptCount": int(existing.get("attemptCount", 0)) + 1,
                "reservationLeaseUntil": (current + timedelta(seconds=lease_seconds)).isoformat(),
                "lastUpdatedAt": current.isoformat(),
                "evidence": "ATOMIC_RESERVATION_ACQUIRED",
            })
            return {"acquired": True, "result": "RESERVED", "entry": existing, "plan": plan_payload}
        entry = {
            "key": event["key"], "eventType": event["eventType"], "subject": event["subject"],
            "authoritativeUrl": event["authoritativeUrl"], "fingerprint": fingerprint,
            "providerOperationId": plan_payload["providerOperationId"], "status": "RESERVED", "attemptCount": 1,
            "reservationLeaseUntil": (current + timedelta(seconds=lease_seconds)).isoformat(),
            "firstRecordedAt": current.isoformat(), "lastUpdatedAt": current.isoformat(), "evidence": "ATOMIC_RESERVATION_ACQUIRED",
        }
        ledger.setdefault("events", []).append(entry)
        return {"acquired": True, "result": "RESERVED", "entry": entry, "plan": plan_payload}

    return _locked_ledger(ledger_path, update)


def mark_submitted(event: dict[str, Any], config: dict[str, Any], ledger_path: Path, provider_message_id: str, provider_status: str, now: datetime | None = None) -> dict[str, Any]:
    validate_event(event, config)
    if str(provider_message_id).lower() != provider_operation_id(event):
        raise ValueError("provider message ID must match the deterministic provider operation ID")
    current = now or datetime.now(timezone.utc)

    def update(ledger: dict[str, Any]) -> dict[str, Any]:
        existing = _existing(ledger, event["key"])
        if not existing or existing.get("fingerprint") != event_fingerprint(event):
            raise ValueError("submission requires the matching atomic reservation")
        prior_id = existing.get("providerMessageId")
        if prior_id and prior_id != provider_message_id:
            raise ValueError("provider message ID cannot change after submission")
        if existing["status"] == "SENT":
            return existing
        if existing["status"] not in {"RESERVED", "SUBMITTED"}:
            raise ValueError("only a reserved notification can be submitted")
        existing.update({"status": "SUBMITTED", "providerMessageId": provider_message_id, "providerSubmissionStatus": provider_status, "submittedAt": existing.get("submittedAt", current.isoformat()), "lastUpdatedAt": current.isoformat(), "evidence": "ACS_OUT_FOR_DELIVERY"})
        existing.pop("reservationLeaseUntil", None)
        return existing

    return _locked_ledger(ledger_path, update)


def reconcile_delivery(event: dict[str, Any], config: dict[str, Any], ledger_path: Path, provider_message_id: str, delivery_status: str, *, observed_at: str | None = None, hard_bounce: bool | None = None, now: datetime | None = None) -> dict[str, Any]:
    validate_event(event, config)
    if delivery_status not in {"PENDING", "Delivered", *NEGATIVE_DELIVERY_STATUSES}:
        raise ValueError("unsupported terminal delivery status")
    current = now or datetime.now(timezone.utc)

    def update(ledger: dict[str, Any]) -> dict[str, Any]:
        existing = _existing(ledger, event["key"])
        if not existing or existing.get("fingerprint") != event_fingerprint(event) or existing.get("providerMessageId") != provider_message_id:
            raise ValueError("delivery report does not match a submitted notification")
        if existing["status"] not in {"SUBMITTED", "SENT", "FAILED"}:
            raise ValueError("delivery reconciliation requires submitted provider evidence")
        existing["lastDeliveryCheckAt"] = current.isoformat()
        existing["lastUpdatedAt"] = current.isoformat()
        if existing["status"] in {"SENT", "FAILED"}:
            first_terminal = existing.get("deliveryStatus")
            if delivery_status == "PENDING" or delivery_status == first_terminal:
                return existing
            existing.update({
                "deliveryReconciliationStatus": "CONFLICTING_TERMINAL_IGNORED",
                "deliveryReconciliationEvidence": "FIRST_TERMINAL_PROVIDER_EVIDENCE_PRESERVED",
                "lastConflictingDeliveryStatus": delivery_status,
            })
            return existing
        if delivery_status == "PENDING":
            existing["evidence"] = "DELIVERY_REPORT_PENDING"
            return existing
        existing["deliveryStatus"] = delivery_status
        existing["deliveryObservedAt"] = observed_at or current.isoformat()
        if hard_bounce is not None:
            existing["hardBounce"] = hard_bounce
        if delivery_status == "Delivered":
            existing.update({"status": "SENT", "evidence": "ACS_RECIPIENT_DELIVERED"})
        else:
            existing.update({"status": "FAILED", "evidence": f"ACS_RECIPIENT_{delivery_status.upper()}"})
        return existing

    return _locked_ledger(ledger_path, update)


def record_failure(event: dict[str, Any], config: dict[str, Any], ledger_path: Path, evidence: str, *, ambiguous: bool = False, now: datetime | None = None) -> dict[str, Any]:
    if not evidence or len(evidence) > 120 or not evidence.replace("_", "").isalnum():
        raise ValueError("failure evidence must be a bounded machine-readable code")
    current = now or datetime.now(timezone.utc)

    def update(ledger: dict[str, Any]) -> dict[str, Any]:
        existing = _existing(ledger, event["key"])
        if not existing or existing.get("fingerprint") != event_fingerprint(event) or existing["status"] != "RESERVED":
            raise ValueError("failure recording requires the matching active reservation")
        existing.update({"lastUpdatedAt": current.isoformat(), "evidence": evidence})
        if ambiguous:
            existing["reservationLeaseUntil"] = current.isoformat()
        else:
            existing["status"] = "EXTERNAL_ACTION_REQUIRED"
            existing.pop("reservationLeaseUntil", None)
        return existing

    return _locked_ledger(ledger_path, update)


def record_reconciliation_failure(event: dict[str, Any], ledger_path: Path, evidence: str, now: datetime | None = None) -> dict[str, Any]:
    current = now or datetime.now(timezone.utc)

    def update(ledger: dict[str, Any]) -> dict[str, Any]:
        existing = _existing(ledger, event["key"])
        if not existing or existing.get("fingerprint") != event_fingerprint(event) or existing["status"] not in {"SUBMITTED", "SENT", "FAILED"}:
            raise ValueError("reconciliation failure requires the matching submitted notification")
        existing.update({
            "lastDeliveryCheckAt": current.isoformat(),
            "lastUpdatedAt": current.isoformat(),
            "deliveryReconciliationStatus": "EXTERNAL_ACTION_REQUIRED",
            "deliveryReconciliationEvidence": evidence,
        })
        if existing["status"] == "SUBMITTED":
            existing["evidence"] = evidence
        return existing

    return _locked_ledger(ledger_path, update)


def record(event: dict[str, Any], config: dict[str, Any], ledger_path: Path, status: str, evidence: str, provider_message_id: str | None) -> dict[str, Any]:
    validate_event(event, config)
    if status not in STATUSES:
        raise ValueError(f"unsupported status: {status}")
    if status in {"SUBMITTED", "SENT"}:
        raise ValueError(f"{status} must be produced by provider submission/delivery reconciliation")
    current = datetime.now(timezone.utc)
    fingerprint = event_fingerprint(event)

    def update(ledger: dict[str, Any]) -> dict[str, Any]:
        existing = _existing(ledger, event["key"])
        if existing:
            if existing.get("fingerprint") != fingerprint:
                raise ValueError("deduplication key already exists for a different event payload")
            if existing.get("status") == "SENT":
                raise ValueError("a confirmed SENT event cannot be downgraded")
            existing.update({"status": status, "lastUpdatedAt": current.isoformat(), "evidence": evidence})
            return existing
        result = {"key": event["key"], "eventType": event["eventType"], "subject": event["subject"], "authoritativeUrl": event["authoritativeUrl"], "fingerprint": fingerprint, "status": status, "firstRecordedAt": current.isoformat(), "lastUpdatedAt": current.isoformat(), "evidence": evidence}
        ledger.setdefault("events", []).append(result)
        return result

    return _locked_ledger(ledger_path, update)


def _transport(config: dict[str, Any], arguments: list[str], environment: dict[str, str] | None = None) -> dict[str, Any]:
    command = config["adapter"]["transportCommand"] + arguments
    try:
        completed = subprocess.run(command, cwd=ROOT, env=environment, capture_output=True, text=True, timeout=int(config["adapter"]["delivery"]["providerTimeoutSeconds"]), check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError("provider transport could not complete") from exc
    if completed.returncode != 0:
        raise RuntimeError("provider transport command failed")
    try:
        return json.loads(completed.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError) as exc:
        raise RuntimeError("provider transport returned an invalid response") from exc


def _submission_response(response: Any, expected_provider_id: str) -> tuple[str, str]:
    if not isinstance(response, dict) or set(response) != {"status", "providerMessageId", "providerStatus"}:
        raise ValueError("provider submission response has an invalid shape")
    if response["status"] != "SUBMITTED" or response["providerMessageId"] != expected_provider_id:
        raise ValueError("provider submission response does not match the reserved operation")
    if not isinstance(response["providerStatus"], str) or not response["providerStatus"].strip() or len(response["providerStatus"]) > 120:
        raise ValueError("provider submission status is invalid")
    return response["providerMessageId"], response["providerStatus"]


def _delivery_response(response: Any, expected_provider_id: str) -> tuple[str, str | None, str | None, bool | None]:
    allowed_fields = {"status", "providerMessageId", "deliveryStatus", "observedAt", "hardBounce"}
    if not isinstance(response, dict) or not set(response).issubset(allowed_fields) or set(response) < {"status", "providerMessageId"}:
        raise ValueError("provider delivery response has an invalid shape")
    if response["providerMessageId"] != expected_provider_id or response["status"] not in {"PENDING", "DELIVERED", "FAILED"}:
        raise ValueError("provider delivery response does not match the submitted operation")
    delivery_status = response.get("deliveryStatus")
    if response["status"] == "PENDING":
        if delivery_status is not None or "observedAt" in response or "hardBounce" in response:
            raise ValueError("pending delivery response contains terminal evidence")
        return "PENDING", None, None, None
    if delivery_status not in {"Delivered", *NEGATIVE_DELIVERY_STATUSES}:
        raise ValueError("terminal delivery response has an invalid status")
    expected_result = "DELIVERED" if delivery_status == "Delivered" else "FAILED"
    if response["status"] != expected_result:
        raise ValueError("provider delivery result conflicts with its terminal status")
    observed_at = response.get("observedAt")
    hard_bounce = response.get("hardBounce")
    if observed_at is not None and (not isinstance(observed_at, str) or not observed_at.strip() or len(observed_at) > 120):
        raise ValueError("provider delivery observation time is invalid")
    if hard_bounce is not None and not isinstance(hard_bounce, bool):
        raise ValueError("provider hard-bounce evidence is invalid")
    return delivery_status, delivery_status, observed_at, hard_bounce


def dispatch(event: dict[str, Any], config: dict[str, Any], contacts: dict[str, Any], ledger_path: Path, *, conformance: bool, retry: bool, contacts_path: Path = DEFAULT_CONTACTS) -> dict[str, Any]:
    reservation = reserve(event, config, contacts, ledger_path, conformance=conformance, retry=retry)
    if not reservation["acquired"]:
        return {"key": event["key"], "result": reservation["result"], "providerOperationId": reservation["plan"]["providerOperationId"]}
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as handle:
        json.dump(reservation["plan"], handle)
        handle.write("\n")
        plan_path = Path(handle.name)
    os.chmod(plan_path, 0o600)
    environment = dict(os.environ)
    environment["DM_EXTERNAL_NOTIFICATIONS"] = "enabled"
    try:
        response = _transport(config, ["submit", "--plan", str(plan_path), "--contacts", str(contacts_path)], environment)
        provider_message_id, provider_status = _submission_response(response, reservation["plan"]["providerOperationId"])
        entry = mark_submitted(event, config, ledger_path, provider_message_id, provider_status)
        return {"key": event["key"], "result": entry["status"], "providerMessageId": entry["providerMessageId"], "attemptCount": entry["attemptCount"]}
    except (RuntimeError, KeyError, ValueError):
        record_failure(event, config, ledger_path, "PROVIDER_SUBMISSION_EXTERNAL_ACTION_REQUIRED")
        return {"key": event["key"], "result": "EXTERNAL_ACTION_REQUIRED", "reason": "PROVIDER_SUBMISSION_EXTERNAL_ACTION_REQUIRED"}
    finally:
        plan_path.unlink(missing_ok=True)


def check_delivery(event: dict[str, Any], config: dict[str, Any], ledger_path: Path, contacts_path: Path = DEFAULT_CONTACTS) -> dict[str, Any]:
    ledger = load(ledger_path)
    existing = _existing(ledger, event["key"])
    if not existing or existing.get("status") not in {"SUBMITTED", "SENT", "FAILED"} or not existing.get("providerMessageId"):
        raise ValueError("delivery check requires a submitted notification")
    environment = dict(os.environ)
    environment["DM_EXTERNAL_NOTIFICATIONS"] = "enabled"
    try:
        response = _transport(config, ["delivery", "--provider-message-id", existing["providerMessageId"], "--contacts", str(contacts_path)], environment)
        delivery_status, _, observed_at, hard_bounce = _delivery_response(response, existing["providerMessageId"])
        entry = reconcile_delivery(event, config, ledger_path, existing["providerMessageId"], delivery_status, observed_at=observed_at, hard_bounce=hard_bounce)
    except (RuntimeError, KeyError, TypeError, ValueError):
        record_reconciliation_failure(event, ledger_path, "DELIVERY_RECONCILIATION_EXTERNAL_ACTION_REQUIRED")
        return {"key": event["key"], "result": "EXTERNAL_ACTION_REQUIRED", "reason": "DELIVERY_RECONCILIATION_EXTERNAL_ACTION_REQUIRED"}
    return {"key": event["key"], "result": entry["status"], "deliveryStatus": entry.get("deliveryStatus", "PENDING"), "providerMessageId": entry["providerMessageId"]}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["plan", "reserve", "dispatch", "check-delivery", "record"])
    parser.add_argument("event")
    parser.add_argument("--status", choices=sorted(STATUSES))
    parser.add_argument("--evidence")
    parser.add_argument("--provider-message-id")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--contacts", default=str(DEFAULT_CONTACTS))
    parser.add_argument("--ledger")
    parser.add_argument("--conformance", action="store_true")
    parser.add_argument("--retry", action="store_true")
    args = parser.parse_args()
    config = load(Path(args.config))
    event = load(Path(args.event))
    contacts = load(Path(args.contacts))
    ledger_path = Path(args.ledger or ROOT / config["ledger"])
    if args.command == "plan":
        result = plan(event, config, contacts, load(ledger_path))
    elif args.command == "reserve":
        result = reserve(event, config, contacts, ledger_path, conformance=args.conformance, retry=args.retry)
    elif args.command == "dispatch":
        result = dispatch(event, config, contacts, ledger_path, conformance=args.conformance, retry=args.retry, contacts_path=Path(args.contacts))
    elif args.command == "check-delivery":
        result = check_delivery(event, config, ledger_path, contacts_path=Path(args.contacts))
    else:
        if not args.status or not args.evidence:
            parser.error("record requires --status and --evidence")
        result = record(event, config, ledger_path, args.status, args.evidence, args.provider_message_id)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
