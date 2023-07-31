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
import { RequestWithContext } from "../../types/RequestWithContext";
import { Application } from "../../types/sql";
import { updateClientInKV } from "../../hooks/update-client";
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";

@Route("tenants/{tenantId}/applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listApplications(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<Application[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const applications = await db
      .selectFrom("applications")
      .where("applications.tenantId", "=", tenantId)
      .selectAll()
      .offset(parsedRange.from)
      .limit(parsedRange.limit)
      .execute();

    if (parsedRange.entity) {
      this.setHeader(
        headers.contentRange,
        `${parsedRange.entity}=${parsedRange.from}-${parsedRange.to}/${parsedRange.limit}`,
      );
    }

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
      .where("applications.tenantId", "=", tenantId)
      .selectAll()
      .executeTakeFirst();

    if (!application) {
      this.setStatus(404);
      return "Not found";
    }

    return application;
  }

  @Delete("{id}")
  @Security("oauth2", [])
  public async deleteApplication(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);

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
    body: Partial<
      Omit<Application, "tenantId" | "createdAt" | "modifiedAt">
    > & {
      name: string;
    },
  ): Promise<Application> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const application: Application = {
      allowedWebOrigins: "",
      allowedCallbackUrls: "",
      allowedLogoutUrls: "",
      clientSecret: nanoid(),
      id: nanoid(),
      ...body,
      tenantId,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    await updateClientInKV(env, application.id);

    this.setStatus(201);
    return application;
  }

  @Put("{id}")
  @Security("oauth2", [])
  public async putConnection(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("id") id: string,
    @Body()
    body: Omit<Application, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<Application> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const application: Application = {
      ...body,
      tenantId,
      id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db
      .insertInto("applications")
      .values(application)
      .onConflict((oc) => oc.column("id").doUpdateSet(body))
      .execute();

    await updateClientInKV(env, application.id);

    this.setStatus(200);
    return application;
  }
}
