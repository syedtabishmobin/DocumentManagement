import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { normalizeWorkspaceDatabase } from "./local.store.js";
import { PostgresWorkspacePersistence } from "./postgres-workspace.persistence.js";
import type { WorkspaceDatabase, WorkspaceState } from "./workspace-state.js";

type Command = "migrate" | "import-local-synthetic" | "verify";

function command(): Command {
  const value = process.argv[2];
  if (value === "migrate" || value === "import-local-synthetic" || value === "verify") return value;
  throw new Error("Usage: persistence.cli.js <migrate|import-local-synthetic|verify>");
}

async function run(): Promise<void> {
  const selected = command();
  const store = PostgresWorkspacePersistence.fromEnvironment(selected === "verify" ? "verify" : "apply");
  try {
    if (selected === "import-local-synthetic") {
      if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") !== "synthetic-only") throw new Error("Local JSON import is restricted to synthetic-only data");
      if ((process.env.DM_PROFILE ?? "local") === "prod") throw new Error("Local JSON import is unavailable in the production profile");
      const sourcePath = resolve(process.env.DM_LOCAL_STATE_PATH ?? resolve(process.env.DM_DATA_DIR ?? "./local-data", "state.json"));
      const source = await readFile(sourcePath);
      const database = normalizeWorkspaceDatabase(JSON.parse(source.toString("utf8")) as WorkspaceDatabase | WorkspaceState);
      const sourceSha256 = createHash("sha256").update(source).digest("hex");
      const result = await store.importSynthetic(database, sourceSha256);
      process.stdout.write(`${JSON.stringify({ command: selected, status: result.status, reused: result.reused, migrationRunId: result.migrationRunId, workspaces: database.workspaces.length, receipts: database.workspaceCreationReceipts.length, outbox: database.authorityOutbox.length })}\n`);
      return;
    }
    const counts = await store.verifyInvariants();
    process.stdout.write(`${JSON.stringify({ command: selected, status: "VERIFIED", ...counts })}\n`);
  } finally {
    await store.close();
  }
}

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Persistence command failed"}\n`);
  process.exitCode = 1;
});
