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

import { getDbFromEnv } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { Migration } from "../../types/sql";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";

@Route("tenants/{tenantId}/migrations")
@Tags("migrations")
export class MigrationsController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listMigrations(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenant_id: string,
    @Header("range") rangeRequest?: string,
  ): Promise<Migration[]> {
    const { ctx } = request;

    const db = getDbFromEnv(ctx.env);
    const query = db
      .selectFrom("migrations")
      .where("migrations.tenant_id", "=", tenant_id);

    const { data, range } = await executeQuery(query, rangeRequest);

    if (range) {
      this.setHeader(headers.contentRange, range);
    }

    return data;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Migration | string> {
    const { ctx } = request;

    const db = getDbFromEnv(ctx.env);
    const migration = await db
      .selectFrom("migrations")
      .where("migrations.tenant_id", "=", tenantId)
      .where("migrations.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!migration) {
      this.setStatus(404);
      return "Not found";
    }

    return migration;
  }

  @Delete("{id}")
  @Security("oauth2managementApi", [""])
  public async deleteMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDbFromEnv(env);
    await db
      .deleteFrom("migrations")
      .where("migrations.tenant_id", "=", tenantId)
      .where("migrations.id", "=", id)
      .execute();

    await updateTenantClientsInKV(env, tenantId);

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async patchMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Migration, "id" | "tenant_id" | "created_at" | "updated_at">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDbFromEnv(env);
    const migration = {
      ...body,
      tenantId,
      updated_at: new Date().toISOString(),
    };

    const results = await db
      .updateTable("migrations")
      .set(migration)
      .where("id", "=", id)
      .execute();

    await updateTenantClientsInKV(env, tenantId);

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postMigrations(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenant_id: string,
    @Body()
    body: Omit<Migration, "id" | "tenant_id" | "created_at" | "updated_at">,
  ): Promise<Migration> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDbFromEnv(env);

    const migration: Migration = {
      ...body,
      tenant_id,
      id: nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.insertInto("migrations").values(migration).execute();

    await updateTenantClientsInKV(env, tenant_id);

    this.setStatus(201);
    return migration;
  }

  @Put("{id}")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async putMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenant_id: string,
    @Body()
    body: Omit<Migration, "id" | "tenant_id" | "created_at" | "updated_at">,
  ): Promise<Migration> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDbFromEnv(env);

    const migration: Migration = {
      ...body,
      tenant_id,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await db.insertInto("migrations").values(migration).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, created_at, tenant_id, ...migrationUpdate } = migration;
      await db
        .updateTable("migrations")
        .set(migrationUpdate)
        .where("id", "=", migration.id)
        .execute();
    }

    await db.insertInto("migrations").values(migration).execute();

    await updateTenantClientsInKV(env, tenant_id);

    this.setStatus(201);
    return migration;
  }
}
