import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const profile = process.env.DM_PROFILE ?? "local";
  if (profile === "local" && (process.env.DM_OUTBOUND_NETWORK ?? "deny") !== "deny") {
    throw new Error("The local profile requires DM_OUTBOUND_NETWORK=deny");
  }

  const app = await NestFactory.create(AppModule, { logger: ["error", "warn", "log"] });
  const origins = (process.env.DM_WEB_ORIGIN ?? "http://localhost:4173,http://127.0.0.1:4173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Workspace-Id", "X-Purpose-Id", "Idempotency-Key", "If-Match", "X-Correlation-Id"],
    exposedHeaders: ["X-CSRF-Token", "X-Correlation-Id", "ETag"],
    credentials: true,
  });
  app.setGlobalPrefix("api");
  const port = Number(process.env.DM_API_PORT ?? 4310);
  const host = process.env.DM_BIND_HOST ?? (profile === "local" ? "127.0.0.1" : "0.0.0.0");
  await app.listen(port, host);
  console.log(`Doculyra API started (${profile}) on ${host}:${port}`);
}

void bootstrap();
