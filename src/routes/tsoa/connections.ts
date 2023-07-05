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
import { Connection } from "../../types/sql";

@Route("tenants/{tenantId}/connections")
@Tags("connections")
export class ConnectionsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listConnections(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string
  ): Promise<Connection[]> {
    const db = getDb(request.ctx.env);
    const connections = await db
      .selectFrom("connections")
      .where("connections.tenantId", "=", tenantId)
      .selectAll()
      .execute();

    return connections;
  }

  @Get("{id}")
  @Security("oauth2", [])
  public async getConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string
  ): Promise<Connection | string> {
    const db = getDb(request.ctx.env);
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

  @Patch("{id}")
  @Security("oauth2", [])
  public async patchConnection(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Connection, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >
  ): Promise<UpdateResult[]> {
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

    return results;
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postConnections(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Connection, "id" | "createdAt" | "modifiedAt">
  ): Promise<Connection> {
    const { env } = request.ctx;

    const db = getDb(env);
    const connection: Connection = {
      ...body,
      tenantId,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("connections").values(connection).execute();

    this.setStatus(201);
    return connection;
  }
}
