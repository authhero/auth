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
import { Migration } from "../../types/sql";
import { updateTenantClientsInKV } from "../../hooks/update-client";
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";

@Route("tenants/{tenantId}/migrations")
@Tags("migrations")
export class MigrationsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listMigrations(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<Migration[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const migrations = await db
      .selectFrom("migrations")
      .where("migrations.tenantId", "=", tenantId)
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

    return migrations;
  }

  @Get("{id}")
  @Security("oauth2", [])
  public async getMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Migration | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const migration = await db
      .selectFrom("migrations")
      .where("migrations.tenantId", "=", tenantId)
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
  @Security("oauth2", [])
  public async deleteMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);
    await db
      .deleteFrom("migrations")
      .where("migrations.tenantId", "=", tenantId)
      .where("migrations.id", "=", id)
      .execute();

    await updateTenantClientsInKV(env, tenantId);

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2", [])
  public async patchMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Migration, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);
    const migration = {
      ...body,
      tenantId,
      modifiedAt: new Date().toISOString(),
    };

    const results = await db
      .updateTable("migrations")
      .set(migration)
      .where("id", "=", id)
      .execute();

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postMigrations(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Migration, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<Migration> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const migration: Migration = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("migrations").values(migration).execute();

    this.setStatus(201);
    return migration;
  }

  @Put("{id}")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async putMigration(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Migration, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<Migration> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const migration: Migration = {
      ...body,
      tenantId,
      id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    try {
      await db
        .insertInto("migrations")
        .values(migration)
        // .onConflict((oc) => oc.column("id").doUpdateSet(body))
        .execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, createdAt, tenantId, ...migrationUpdate } = migration;
      await db
        .updateTable("migrations")
        .set(migrationUpdate)
        .where("id", "=", migration.id)
        .execute();
    }

    await db.insertInto("migrations").values(migration).execute();

    this.setStatus(201);
    return migration;
  }
}
