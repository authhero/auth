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
import { Migration } from "../../types/sql";
import { updateTenantClientsInKV } from "../../hooks/update-client";
import { Context } from "cloudworker-router";
import { Env } from "../../types";
import { NotFoundError, UnauthorizedError } from "../../errors";

async function checkAccess(ctx: Context<Env>, tenantId: string, id: string) {
  const db = getDb(ctx.env);

  const user = await db
    .selectFrom("migrations")
    .innerJoin("tenants", "tenants.id", "migrations.tenantId")
    .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
    .where("admin_users.id", "=", ctx.state.user.sub)
    .where("tenants.id", "=", tenantId)
    .where("migrations.id", "=", id)
    .select("migrations.id")
    .executeTakeFirst();

  if (!user) {
    // Application not found. Could be that the user has no access
    throw new NotFoundError();
  }
}

@Route("tenants/{tenantId}/migrations")
@Tags("migrations")
export class MigrationsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listMigrations(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
  ): Promise<Migration[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const migrations = await db
      .selectFrom("migrations")
      .innerJoin("tenants", "tenants.id", "migrations.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .selectAll("migrations")
      .execute();

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
      .innerJoin("tenants", "tenants.id", "migrations.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .where("migrations.id", "=", id)
      .selectAll("migrations")
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

    await checkAccess(request.ctx, tenantId, id);

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

    await checkAccess(request.ctx, tenantId, id);

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

    await updateTenantClientsInKV(env, tenantId);

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

    const migration: Migration = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("migrations").values(migration).execute();

    await updateTenantClientsInKV(env, tenantId);

    this.setStatus(201);
    return migration;
  }
}
