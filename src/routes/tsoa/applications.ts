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
  Security,
  Delete,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";

import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { Application } from "../../types/sql";
import { updateClientInKV } from "../../hooks/update-client";
import { NotFoundError, UnauthorizedError } from "../../errors";
import { Context } from "cloudworker-router";
import { Env } from "../../types";

async function checkAccess(ctx: Context<Env>, tenantId: string, id: string) {
  const db = getDb(ctx.env);

  const application = await db
    .selectFrom("applications")
    .innerJoin("tenants", "tenants.id", "applications.tenantId")
    .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
    .where("admin_users.id", "=", ctx.state.user.sub)
    .where("tenants.id", "=", tenantId)
    .where("applications.id", "=", id)
    .select("applications.id")
    .executeTakeFirst();

  if (!application) {
    // Application not found. Could be that the user has no access
    throw new NotFoundError();
  }
}

@Route("tenants/{tenantId}/applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
  ): Promise<Application[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const applications = await db
      .selectFrom("applications")
      .innerJoin("tenants", "tenants.id", "applications.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .selectAll("applications")
      .execute();

    return applications;
  }

  @Get("{id}")
  @Security("oauth2", [])
  public async getApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Application | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const application = await db
      .selectFrom("applications")
      .innerJoin("tenants", "tenants.id", "applications.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .where("applications.id", "=", id)
      .selectAll("applications")
      .executeTakeFirst();

    if (!application) {
      this.setStatus(404);
      return "Not found";
    }

    return application;
  }

  @Delete("{id}")
  @Security("oauth2", [])
  public async deleteConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);

    await checkAccess(request.ctx, tenantId, id);

    await db
      .deleteFrom("applications")
      .where("applications.tenantId", "=", tenantId)
      .where("applications.id", "=", id)
      .execute();

    await updateClientInKV(env, id);

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2", [])
  public async patchApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Application, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);

    await checkAccess(request.ctx, tenantId, id);

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

    await updateClientInKV(env, id);

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Application, "id" | "createdAt" | "modifiedAt">,
  ): Promise<Application> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const tenant = await db
      .selectFrom("tenants")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .select("tenants.id")
      .executeTakeFirst();

    if (!tenant) {
      throw new UnauthorizedError();
    }

    const application: Application = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    await updateClientInKV(env, application.id);

    this.setStatus(201);
    return application;
  }
}
