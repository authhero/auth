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
import { UpdateResult } from "kysely";

import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { Connection } from "../../types/sql";
import { updateTenantClientsInKV } from "../../hooks/update-client";
import { Context } from "cloudworker-router";
import { Env } from "../../types";
import { NotFoundError, UnauthorizedError } from "../../errors";

async function checkAccess(ctx: Context<Env>, tenantId: string, id: string) {
  const db = getDb(ctx.env);

  const user = await db
    .selectFrom("connections")
    .innerJoin("tenants", "tenants.id", "connections.tenantId")
    .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
    .where("admin_users.id", "=", ctx.state.user.sub)
    .where("tenants.id", "=", tenantId)
    .where("connections.id", "=", id)
    .select("connections.id")
    .executeTakeFirst();

  if (!user) {
    // Application not found. Could be that the user has no access
    throw new NotFoundError();
  }
}

@Route("tenants/{tenantId}/connections")
@Tags("connections")
export class ConnectionsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listConnections(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
  ): Promise<Connection[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const connections = await db
      .selectFrom("connections")
      .innerJoin("tenants", "tenants.id", "connections.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .selectAll("connections")
      .execute();

    return connections;
  }

  @Get("{id}")
  @Security("oauth2", [])
  public async getConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Connection | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const connection = await db
      .selectFrom("connections")
      .innerJoin("tenants", "tenants.id", "connections.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .where("connections.id", "=", id)
      .selectAll("connections")
      .executeTakeFirst();

    if (!connection) {
      this.setStatus(404);
      return "Not found";
    }

    return connection;
  }

  @Delete("{id}")
  @Security("oauth2", [])
  public async deleteConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    await checkAccess(request.ctx, tenantId, id);

    const db = getDb(env);
    await db
      .deleteFrom("connections")
      .where("connections.tenantId", "=", tenantId)
      .where("connections.id", "=", id)
      .execute();

    await updateTenantClientsInKV(env, tenantId);

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2", [])
  public async patchConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Connection, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >,
  ): Promise<UpdateResult[]> {
    const { env } = request.ctx;

    await checkAccess(request.ctx, tenantId, id);

    const db = getDb(env);
    const connection = {
      ...body,
      tenantId,
      modifiedAt: new Date().toISOString(),
    };

    const results = await db
      .updateTable("connections")
      .set(connection)
      .where("id", "=", id)
      .execute();

    await updateTenantClientsInKV(env, tenantId);

    return results;
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postConnections(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Connection, "id" | "createdAt" | "modifiedAt">,
  ): Promise<Connection> {
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

    const connection: Connection = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("connections").values(connection).execute();

    await updateTenantClientsInKV(env, tenantId);

    this.setStatus(201);
    return connection;
  }
}
