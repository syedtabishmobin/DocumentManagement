#!/usr/bin/env python3
"""Contract, privacy, routing and read-only tests for the local Control Centre."""

from __future__ import annotations

import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch

import control_centre
import control_centre_project


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


class ControlCentreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.store = Path(self.temp.name) / "events.jsonl"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def snapshot(self) -> dict:
        with patch("agent_ops.github_snapshot", return_value=GITHUB_FIXTURE):
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

    def test_shared_id_drill_through_and_invalid_id(self) -> None:
        snapshot = self.snapshot()
        found = control_centre.trace_lookup(snapshot, "STORY-P1-006")
        self.assertEqual(found["status"], "FOUND")
        self.assertTrue(found["record"]["references"])
        self.assertEqual(control_centre.trace_lookup(snapshot, "issue-60")["status"], "FOUND")
        with self.assertRaises(ValueError):
            control_centre.trace_lookup(snapshot, "../../secret")

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
