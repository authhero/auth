import {
  Controller,
  Get,
  Post,
  Patch,
  Path,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import { Application } from "../../types/sql";
import { UpdateResult } from "kysely";

@Route("applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  public async listApplications(
    @Request() request: RequestWithContext
  ): Promise<Application[]> {
    const db = getDb(request.ctx);
    const applications = await db
      .selectFrom("applications")
      .selectAll()
      .execute();

    return applications;
  }

  @Patch("{id}")
  public async patchApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Body()
    body: Partial<
      Omit<Application, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >
  ): Promise<UpdateResult[]> {
    const db = getDb(request.ctx);
    const application = {
      ...body,
      modifiedAt: new Date().toISOString(),
    };

    const results = await db
      .updateTable("applications")
      .set(application)
      .where("id", "=", id)
      .execute();

    return results;
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postApplications(
    @Request() request: RequestWithContext,
    @Body()
    body: Omit<Application, "id" | "createdAt" | "modifiedAt">
  ): Promise<Application> {
    const db = getDb(request.ctx);
    const application = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    this.setStatus(201);
    return application;
  }
}
