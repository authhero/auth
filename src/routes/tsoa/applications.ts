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
} from "@tsoa/runtime";
import { v4 as uuidv4 } from "uuid";
import { UpdateResult } from "kysely";

import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { Application } from "../../types/sql";
import { Env, Client } from "../../types";

async function updateClientInKV(env: Env, clientId: string) {
  const db = getDb(env);
  const application = await db
    .selectFrom("applications")
    .innerJoin("tenants", "applications.tenantId", "tenants.id")
    .select([
      "applications.id",
      "applications.name",
      "applications.tenantId",
      "applications.allowedWebOrigins",
      "applications.allowedCallbackUrls",
      "applications.allowedLogoutUrls",
      "applications.clientSecret",
      "tenants.senderEmail",
      "tenants.senderName",
      "tenants.audience",
      "tenants.issuer",
    ])
    .where("applications.id", "=", clientId)
    .executeTakeFirst();

  if (!application) {
    throw new Error("Client not found");
  }

  const authProviders = await db
    .selectFrom("authProviders")
    .where("tenantId", "=", application.tenantId)
    .selectAll()
    .execute();

  const client: Client = {
    id: application.id,
    name: application.name,
    audience: application.audience,
    issuer: application.issuer,
    senderEmail: application.senderEmail,
    senderName: application.senderName,
    loginBaseUrl: env.ISSUER,
    tenantId: application.tenantId,
    allowedCallbackUrls: application.allowedCallbackUrls?.split(",") || [],
    allowedLogoutUrls: application.allowedLogoutUrls?.split(",") || [],
    allowedWebOrigins: application.allowedWebOrigins?.split(",") || [],
    clientSecret: application.clientSecret,
    authProviders,
  };

  await env.CLIENTS.put(clientId, JSON.stringify(client));

  return client;
}

@Route("tenants/{tenantId}/applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  @Security("oauth2", [])
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

  @Get("{id}")
  @Security("oauth2", [])
  public async getApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string
  ): Promise<Application | string> {
    const db = getDb(request.ctx.env);
    const application = await db
      .selectFrom("applications")
      .where("applications.tenantId", "=", tenantId)
      .where("applications.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!application) {
      this.setStatus(404);
      return "Not found";
    }

    return application;
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
    >
  ): Promise<UpdateResult[]> {
    const { env } = request.ctx;

    const db = getDb(env);
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

    return results;
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Application, "id" | "createdAt" | "modifiedAt">
  ): Promise<Application> {
    const { env } = request.ctx;

    const db = getDb(env);
    const application: Application = {
      ...body,
      tenantId,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    await updateClientInKV(env, application.id);

    this.setStatus(201);
    return application;
  }
}
