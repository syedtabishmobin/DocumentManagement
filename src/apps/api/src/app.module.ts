import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { LocalController } from "./local.controller.js";
import { LocalStore } from "./local.store.js";
import { AuthController } from "./auth.controller.js";
import { IdentityStore } from "./identity.store.js";
import { SessionGuard } from "./session.guard.js";

@Module({
  controllers: [AuthController, LocalController],
  providers: [LocalStore, IdentityStore, { provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
