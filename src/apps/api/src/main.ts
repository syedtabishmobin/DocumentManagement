import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  if ((process.env.DM_OUTBOUND_NETWORK ?? "deny") !== "deny") {
    throw new Error("The local profile requires DM_OUTBOUND_NETWORK=deny");
  }

  const app = await NestFactory.create(AppModule, { logger: ["error", "warn", "log"] });
  const origin = process.env.DM_WEB_ORIGIN ?? "http://localhost:4173";
  app.enableCors({ origin, methods: ["GET", "POST", "PATCH", "DELETE"] });
  app.setGlobalPrefix("api");
  const port = Number(process.env.DM_API_PORT ?? 4310);
  await app.listen(port, "127.0.0.1");
  console.log(`DocumentManagement API running locally at http://127.0.0.1:${port}/api`);
}

void bootstrap();
