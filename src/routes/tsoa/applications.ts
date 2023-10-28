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
  Header,
  Put,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";

import { getDb } from "../../services/db";
import { Application } from "../../types/sql";
import { updateClientInKV } from "../../hooks/update-client";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";

@Route("tenants/{tenantId}/applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") rangeRequest?: string,
  ): Promise<Application[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const query = db
      .selectFrom("applications")
      .where("applications.tenant_id", "=", tenantId);

    const { data, range } = await executeQuery(query, rangeRequest);

    if (range) {
      this.setHeader(headers.contentRange, range);
    }

    return data;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Application | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const application = await db
      .selectFrom("applications")
      .where("applications.tenant_id", "=", tenantId)
      .where("applications.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!application) {
      this.setStatus(404);
      return "Not found";
    }

    return application;
  }

  @Delete("{id}")
  @Security("oauth2managementApi", [""])
  public async deleteApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);

    await db
      .deleteFrom("applications")
      .where("applications.tenant_id", "=", tenantId)
      .where("applications.id", "=", id)
      .execute();

    await updateClientInKV(env, id);

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async patchApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Application, "id" | "tenant_id" | "created_at" | "updated_at">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);

    const application = {
      ...body,
      tenantId,
      updated_at: new Date().toISOString(),
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
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Application, "tenant_id" | "created_at" | "updated_at">
    > & {
      name: string;
    },
  ): Promise<Application> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const application: Application = {
      allowed_web_origins: "",
      allowed_callback_urls: "",
      allowed_logout_urls: "",
      email_validation: "enabled",
      // twoFactorAuthentication: "enabled",
      // enableSignup: true,
      client_secret: nanoid(),
      id: nanoid(),
      ...body,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    await updateClientInKV(env, application.id);

    this.setStatus(201);
    return application;
  }

  @Put("{id}")
  @Security("oauth2managementApi", [""])
  public async putApplication(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("id") id: string,
    @Body()
    body: Omit<Application, "id" | "tenant_id" | "created_at" | "updated_at">,
  ): Promise<Application> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const application: Application = {
      ...body,
      tenant_id: tenantId,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await db
        .insertInto("applications")
        .values(application)
        // .onConflict((oc) => oc.column("id").doUpdateSet(body))
        .execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const {
        id,
        created_at,
        tenant_id: tenantId,
        ...applicationUpdate
      } = application;
      await db
        .updateTable("applications")
        .set(applicationUpdate)
        .where("id", "=", application.id)
        .execute();
    }

    await updateClientInKV(env, application.id);

    this.setStatus(200);
    return application;
  }
}
