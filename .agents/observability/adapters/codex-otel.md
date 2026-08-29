# Codex native telemetry adapter contract

Supported Codex installations can emit OpenTelemetry logs, metrics and traces from user-level configuration. Project-local `.codex/config.toml` cannot enforce OTel routing, so a repository records desired settings and verification status without claiming activation.

The privacy baseline is `log_user_prompt = false`. Native events can still include tool-result snippets and error details, so export requires a privacy-filtering collector or destination whose accepted fields and redaction have passed project review. Framework events supply work-item, role, capability and skill attribution that native runtime events may not expose.

Do not scrape terminal or UI text for token/cost values. Record unavailable usage with `UNAVAILABLE` provenance until a supported runtime/export source supplies it.
