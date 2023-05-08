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
import { v4 as uuidv4 } from "uuid";
import { Application } from "../../types/sql";
import { UpdateResult } from "kysely";

@Route("tenants/{tenantId}/applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  public async listApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string
  ): Promise<Application[]> {
    const db = getDb(request.ctx.env);
    const applications = await db
      .selectFrom("applications")
      .where("applications.tenantId", "=", tenantId)
      .selectAll()
      .execute();

    return applications;
  }

  @Patch("{id}")
  public async patchApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Application, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >
  ): Promise<UpdateResult[]> {
    const db = getDb(request.ctx.env);
    const application = {
      ...body,
      tenantId,
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
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Application, "id" | "createdAt" | "modifiedAt">
  ): Promise<Application> {
    const db = getDb(request.ctx.env);
    const application = {
      ...body,
      tenantId,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    this.setStatus(201);
    return application;
  }
}
