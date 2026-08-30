"use strict";

const routeLabels = {
  "/overview": "Overview", "/agents": "Agents", "/agent-tree": "Agent Tree",
  "/workstreams": "Workstreams", "/capabilities": "Capabilities", "/skills": "Skills",
  "/tools": "Tools", "/quality": "Quality", "/cost-tokens": "Cost & Tokens",
  "/performance": "Performance", "/failures-retries": "Failures & Retries",
  "/decisions": "Decisions", "/environments": "Environments", "/traceability": "Traceability",
  "/audit": "Audit", "/historical-trends": "Historical Trends"
};
let snapshot;

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value == null ? "UNAVAILABLE" : String(value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
};

const pill = value => el("span", {class: `pill ${String(value || "unavailable").toLowerCase().replaceAll("_", "-")}`, text: value ?? "UNAVAILABLE"});
const card = (title, content, className = "") => el("article", {class: `card ${className}`}, el("h2", {text: title}), content);
const stat = (label, value, detail) => el("div", {}, el("div", {class: "label", text: label}), el("div", {class: "stat", text: value ?? "—"}), detail ? el("div", {class: "subtle", text: detail}) : null);
const textValue = value => value == null || value === "" ? "UNAVAILABLE" : Array.isArray(value) ? value.join(", ") || "UNAVAILABLE" : typeof value === "object" ? JSON.stringify(value) : String(value);

function table(headers, rows) {
  if (!rows || !rows.length) return el("div", {class: "empty", text: "No records available from the selected source."});
  return el("div", {class: "table-wrap"}, el("table", {},
    el("thead", {}, el("tr", {}, headers.map(item => el("th", {scope: "col", text: item.label})))),
    el("tbody", {}, rows.map(row => el("tr", {}, headers.map(item => {
      const value = typeof item.value === "function" ? item.value(row) : row[item.value];
      return el("td", {}, value instanceof Node ? value : textValue(value));
    }))))
  ));
}

function kvObject(value) {
  if (value == null) return el("div", {class: "empty", text: "UNAVAILABLE"});
  const wrapper = el("div");
  for (const [key, item] of Object.entries(value)) {
    const rendered = typeof item === "object" && item !== null ? el("code", {text: textValue(item)}) : textValue(item);
    wrapper.append(el("div", {class: "kv"}, el("span", {text: key}), el("span", {}, rendered)));
  }
  return wrapper;
}

function renderNavigation() {
  const nav = document.querySelector("#navigation");
  nav.replaceChildren(...Object.entries(routeLabels).map(([path, label]) => {
    const link = el("a", {class: "nav-link", href: path, text: label});
    if ((location.pathname === "/" ? "/overview" : location.pathname) === path) link.setAttribute("aria-current", "page");
    return link;
  }));
}

function overview() {
  const data = snapshot.overview;
  const fresh = snapshot.freshness.map(item => el("div", {class: "kv"}, el("span", {text: item.freshnessClass}), el("span", {}, pill(item.status), " ", item.detail)));
  const checkpoint = snapshot.queueCheckpoint.isolatedInFlightWork;
  return el("div", {class: "grid"},
    card("Active agents", stat("Current local runtime", data.activeAgentCount, `${data.blockedAgentCount} blocked`)),
    card("Open governed work", stat("GitHub Issues", data.openIssueCount, `${data.openDefectCount ?? "UNAVAILABLE"} defects`)),
    card("Pull requests", stat("Current", data.openPullRequestCount, snapshot.workstreams.queueState)),
    card("Approved baseline", el("div", {}, el("div", {class: "stat", text: data.baselineStatus}), el("code", {text: data.baselineId})), "wide"),
    card("Readiness", el("div", {}, el("p", {}, "Audit ", pill(data.auditStatus)), el("p", {}, "Notification ", pill(data.notificationOperational ? "PASS" : "FAIL")))),
    card("Source freshness", fresh, "half"),
    card("Paused queue checkpoint", el("div", {},
      el("p", {}, pill(snapshot.queueCheckpoint.queueState)),
      el("div", {class: "kv"}, el("span", {text: "Candidate"}), el("code", {text: checkpoint.candidateCommit})),
      el("div", {class: "kv"}, el("span", {text: "Blocking defect"}), el("a", {href: checkpoint.blockingDefect, text: "Issue #60"})),
      el("p", {class: "subtle", text: checkpoint.nextAction})
    ), "half")
  );
}

function agents() {
  return card("Agent and run identity", table([
    {label: "Display identity", value: row => el("strong", {text: `${row.displayRole || "UNAVAILABLE"} · ${row.displayAgentId || "UNAVAILABLE"}`})},
    {label: "Runtime correlation", value: row => el("code", {text: `${row.agentId} / ${row.runId}`})},
    {label: "Role / work", value: row => `${row.roleId || "UNAVAILABLE"} · ${row.workItem?.kind || ""}:${row.workItem?.id || "UNAVAILABLE"}`},
    {label: "State", value: row => pill(row.state)},
    {label: "Capability / skills", value: row => `${textValue(row.capabilityIds)} / ${textValue(row.skillIds)}`},
    {label: "Branch / PR", value: row => `${row.branch || "UNAVAILABLE"} / ${row.pullRequest?.number || "UNAVAILABLE"}`}
  ], snapshot.agents), "full");
}

function agentTree() {
  const rows = snapshot.agentTree.map(item => el("div", {class: "tree-row", style: `margin-left:${Math.min(item.depth, 8) * 24}px`},
    el("strong", {text: `${item.displayAgentId || item.agentId} · ${item.state}`}),
    el("div", {class: "subtle", text: `${item.displayRole || item.roleId || "UNAVAILABLE"} · parent ${item.parentDisplayAgentId || item.parentAgentId || "ROOT"} · ${item.durationMs} ms`})
  ));
  return card("Parent-child delegation", rows.length ? el("div", {}, rows) : el("div", {class: "empty", text: "No retained agent tree events."}), "full");
}

function workstreams() {
  const issueTable = table([
    {label: "Issue", value: row => el("a", {href: row.url, text: `#${row.number}`})}, {label: "Title", value: "title"},
    {label: "Labels", value: row => el("span", {}, row.labels.map(label => pill(label.name)))}
  ], snapshot.workstreams.openIssues);
  const prTable = table([
    {label: "PR", value: row => el("a", {href: row.url, text: `#${row.number}`})}, {label: "Title", value: "title"},
    {label: "Branch", value: row => el("code", {text: row.headRefName})}
  ], snapshot.workstreams.openPullRequests);
  return el("div", {class: "grid"}, card("Governed Issues", issueTable, "full"), card("Pull requests", prTable, "full"));
}

function registrySection(title, rows) {
  return card(title, table([
    {label: "ID", value: row => el("code", {text: row.id})}, {label: "Status", value: row => pill(row.status || "REGISTERED")},
    {label: "Observed invocations", value: row => row.invocations ?? "UNAVAILABLE"}, {label: "Provenance", value: row => pill(row.invocationProvenance)},
    {label: "Purpose", value: row => row.purpose || "—"}
  ], rows), "full");
}

function quality() {
  return el("div", {class: "grid"},
    card("Quality states (30 days)", kvObject(snapshot.quality.states), "half"),
    card("Defects by severity", kvObject(snapshot.quality.defectsBySeverity), "half"),
    card("Open defects", table([
      {label: "Defect", value: row => el("a", {href: row.url, text: `#${row.number}`})}, {label: "Title", value: "title"},
      {label: "Severity", value: row => pill(row.severity)}
    ], snapshot.quality.openDefects), "full")
  );
}

function costTokens() {
  const rows = Object.entries(snapshot.costTokens.usage).map(([id, item]) => ({id, status: item.status, value: item.byProvenance || item.byCurrencyAndProvenance, provenance: Object.keys(item.byProvenance || item.byCurrencyAndProvenance || {}).join(", ") || "UNAVAILABLE"}));
  return el("div", {class: "grid"},
    card("Usage and cost", table([{label: "Metric", value: row => el("code", {text: row.id})}, {label: "Status", value: row => pill(row.status)}, {label: "Value buckets", value: row => textValue(row.value)}, {label: "Provenance", value: row => pill(row.provenance)}], rows), "full"),
    card("No-double-count reconciliation", kvObject(snapshot.costTokens.reconciliation), "half"),
    card("Native provider telemetry", kvObject(snapshot.costTokens.nativeTelemetry), "half")
  );
}

function performance() {
  return el("div", {class: "grid"}, card("Agent duration", kvObject(snapshot.performance.durations), "half"), card("Context efficiency", kvObject(snapshot.performance.contextEfficiency), "half"), card("1-day window", kvObject(snapshot.performance.window1Day), "half"), card("7-day window", kvObject(snapshot.performance.window7Days), "half"));
}

function failuresRetries() {
  return el("div", {class: "grid"}, card("Failure and retry totals", el("div", {}, stat("Failures", snapshot.failuresRetries.failures), stat("Retries", snapshot.failuresRetries.retries)), "half"), card("Event types", kvObject(snapshot.failuresRetries.eventTypes), "half"));
}

function decisions() {
  return el("div", {class: "grid"}, card("Pending human decisions", table([{label: "Issue", value: row => el("a", {href: row.url, text: `#${row.number}`})}, {label: "Title", value: "title"}], snapshot.decisions.pending), "full"), card("Notification path", kvObject(snapshot.decisions.notifications), "full"));
}

function environments() {
  return el("div", {class: "grid"}, card("Release state", kvObject(snapshot.environments.releaseState), "half"), card("Environment contract", table([{label: "Environment", value: "id"}, {label: "Status", value: row => pill(row.status)}, {label: "Provider", value: row => row.provider || "LOCAL"}, {label: "Promotion target", value: row => row.promotionTarget || "—"}], snapshot.environments.configured.environments), "half"));
}

function traceability() {
  const input = el("input", {class: "search", type: "search", placeholder: "Filter stable IDs, e.g. STORY-P1-006", "aria-label": "Filter traceability IDs"});
  const result = el("div");
  const render = () => {
    const query = input.value.trim().toUpperCase();
    const rows = snapshot.traceability.records.filter(item => !query || item.id.includes(query)).slice(0, 250);
    result.replaceChildren(table([
      {label: "Stable ID", value: row => el("code", {text: row.id})},
      {label: "Repository references", value: row => row.references.map(ref => `${ref.path}:${ref.line}`).join(" · ")},
      {label: "Related IDs", value: row => row.relatedIds.slice(0, 12).join(", ") || "UNAVAILABLE"}
    ], rows));
  };
  input.addEventListener("input", render); render();
  return card(`Shared-ID traceability (${snapshot.traceability.stableIdCount})`, el("div", {}, input, result), "full");
}

function audit() {
  return card(`Control Centre audit · ${snapshot.audit.status}`, table([{label: "Check", value: row => el("code", {text: row.id})}, {label: "Status", value: row => pill(row.status)}, {label: "Evidence", value: "evidence"}], snapshot.audit.checks), "full");
}

function trends() {
  const max = Math.max(1, ...snapshot.historicalTrends.map(item => item.events));
  const rows = snapshot.historicalTrends.map(item => el("div", {class: "trend"}, el("span", {text: item.date}), el("div", {class: "bar"}, el("span", {style: `width:${(item.events / max) * 100}%`})), el("span", {text: `${item.events} events · ${item.qualityFailures || 0} failures`})));
  return card("Retained historical activity", rows.length ? el("div", {}, rows) : el("div", {class: "empty", text: "Historical event data is UNAVAILABLE in this local store."}), "full");
}

const renderers = {
  "/overview": overview, "/agents": agents, "/agent-tree": agentTree, "/workstreams": workstreams,
  "/capabilities": () => registrySection("Capabilities", snapshot.capabilities), "/skills": () => registrySection("Skills", snapshot.skills),
  "/tools": () => registrySection("Tools and adapters", snapshot.tools), "/quality": quality, "/cost-tokens": costTokens,
  "/performance": performance, "/failures-retries": failuresRetries, "/decisions": decisions, "/environments": environments,
  "/traceability": traceability, "/audit": audit, "/historical-trends": trends
};

function renderPage() {
  const route = location.pathname === "/" ? "/overview" : location.pathname;
  document.title = `${routeLabels[route] || "Overview"} · Doculyra Control Centre`;
  document.querySelector("#page-title").textContent = routeLabels[route] || "Overview";
  renderNavigation();
  document.querySelector("#content").replaceChildren((renderers[route] || overview)());
  document.querySelector("#content").setAttribute("aria-busy", "false");
}

async function loadSnapshot() {
  const notice = document.querySelector("#notice");
  notice.textContent = "Refreshing local and governed sources…";
  try {
    const response = await fetch("/api/v1/snapshot", {cache: "no-store"});
    if (!response.ok) throw new Error(`snapshot returned HTTP ${response.status}`);
    snapshot = await response.json();
    document.querySelector("#freshness").textContent = `Observed ${new Date(snapshot.generatedAt).toLocaleString()}`;
    notice.textContent = snapshot.workstreams.queueState === "PAUSED_BY_PRODUCT_AUTHORITY" ? "Product queue is paused at the preserved Story P1-006 checkpoint." : "";
    renderPage();
  } catch (error) {
    document.querySelector("#content").setAttribute("aria-busy", "false");
    document.querySelector("#content").replaceChildren(el("div", {class: "empty", text: "Control Centre snapshot unavailable. Check the terminal for the source error."}));
    notice.textContent = String(error);
  }
}

document.querySelector("#refresh").addEventListener("click", loadSnapshot);
loadSnapshot();
