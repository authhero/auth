import {
  Controller,
  Get,
  Post,
  Patch,
  Path,
  Put,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
  Security,
  Delete,
  Header,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";

import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { SqlConnection } from "../../types/sql";
import { updateTenantClientsInKV } from "../../hooks/update-client";
import { UnauthorizedError } from "../../errors";
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";

@Route("tenants/{tenantId}/connections")
@Tags("connections")
export class ConnectionsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listConnections(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<SqlConnection[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const connections = await db
      .selectFrom("connections")
      .where("connections.tenantId", "=", tenantId)
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

    return connections;
  }

  @Get("{id}")
  @Security("oauth2", [])
  public async getConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<SqlConnection | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const connection = await db
      .selectFrom("connections")
      .where("connections.tenantId", "=", tenantId)
      .where("connections.id", "=", id)
      .selectAll()
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
      Omit<SqlConnection, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >,
  ) {
    const { env } = request.ctx;

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

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postConnections(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<SqlConnection, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<SqlConnection> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);
    const connection: SqlConnection = {
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

  @Put("{id}")
  @Security("oauth2", [])
  public async putConnection(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("id") id: string,
    @Body()
    body: Omit<SqlConnection, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<SqlConnection> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const connection: SqlConnection = {
      ...body,
      tenantId,
      id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db
      .insertInto("connections")
      .values(connection)
      .onConflict((oc) => oc.column("id").doUpdateSet(body))
      .execute();

    await updateTenantClientsInKV(env, tenantId);

    this.setStatus(200);
    return connection;
  }
}
