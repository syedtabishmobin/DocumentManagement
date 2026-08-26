import { Module } from "@nestjs/common";
import { LocalController } from "./local.controller.js";
import { LocalStore } from "./local.store.js";

@Module({
  controllers: [LocalController],
  providers: [LocalStore],
})
export class AppModule {}
