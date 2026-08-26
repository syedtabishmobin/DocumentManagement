import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { askQuestionSchema, createMemberSchema, createTaskSchema } from "@document-management/contracts";
import { LocalStore } from "./local.store.js";

@Controller()
export class LocalController {
  constructor(@Inject(LocalStore) private readonly store: LocalStore) {}

  @Get("health")
  health() {
    return { status: "ok", profile: "local", outboundNetwork: "denied", externalAI: false, externalConnectors: false };
  }

  @Get("dashboard")
  dashboard() { return this.store.dashboard(); }

  @Post("documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File) { return this.store.addDocument(file); }

  @Delete("documents/:id")
  async remove(@Param("id") id: string) { await this.store.deleteDocument(id); return { deleted: true }; }

  @Post("assistant/questions")
  ask(@Body() body: unknown) { const input = askQuestionSchema.parse(body); return this.store.ask(input.question, input.documentIds); }

  @Post("members")
  addMember(@Body() body: unknown) { const input = createMemberSchema.parse(body); return this.store.addMember(input.displayName, input.role); }

  @Post("tasks")
  addTask(@Body() body: unknown) { const input = createTaskSchema.parse(body); return this.store.addTask(input); }

  @Patch("tasks/:id/complete")
  completeTask(@Param("id") id: string) { return this.store.completeTask(id); }

  @Get("exports/current")
  exportWorkspace() { return this.store.exportWorkspace(); }
}
