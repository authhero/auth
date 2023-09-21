import {
  Controller,
  Get,
  Post,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
  Security,
  Header,
  Path,
  Put,
} from "@tsoa/runtime";
import { Tenant, Member } from "../../types/sql";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";
import { updateTenantClientsInKV } from "../../hooks/update-client";

@Route("tenants")
@Tags("tenants")
export class TenantsController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listTenants(
    @Request() request: RequestWithContext,
    @Header("range") rangeRequest?: string,
  ): Promise<Tenant[]> {
    const { ctx } = request;
    const db = getDb(ctx.env);

    let query = db.selectFrom("tenants");

    const permissions: string[] = ctx.state.user.permissions || [];
    if (!permissions.includes(ctx.env.READ_PERMISSION as string)) {
      const memberTenants = await db
        .selectFrom("members")
        .where("sub", "=", ctx.state.user.sub)
        .select("tenant_id")
        .execute();

      query = query.where(
        "id",
        "in",
        memberTenants.map((mt) => mt.tenant_id),
      );
    }

    const { data, range } = await executeQuery<"tenants">(query, rangeRequest);

    if (range) {
      this.setHeader(headers.contentRange, range);
    }

    return data;
  }

  @Get("{tenantId}")
  @Security("oauth2managementApi", [""])
  public async getTenant(
    @Request() request: RequestWithContext,
    @Path("tenantId") id: string,
  ): Promise<Tenant | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const tenant = await db
      .selectFrom("tenants")
      .where("tenants.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!tenant) {
      this.setStatus(404);
      return "Not found";
    }

    return tenant;
  }

  @Put("{tenantId}")
  @Security("oauth2managementApi", [""])
  public async putTenant(
    @Request() request: RequestWithContext,
    @Path("tenantId") id: string,
    @Body() body: Omit<Tenant, "id" | "created_at" | "modified_at">,
  ): Promise<Tenant | string> {
    const { env } = request.ctx;

    const db = getDb(env);
    const tenant = {
      ...body,
      id,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };

    try {
      await db.insertInto("tenants").values(tenant).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, created_at, ...tenantUpdate } = tenant;
      await db
        .updateTable("tenants")
        .set(tenantUpdate)
        .where("id", "=", tenant.id)
        .execute();
    }

    await updateTenantClientsInKV(env, id);

    this.setStatus(201);
    return tenant;
  }

  @Post("")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postTenants(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Tenant, "id" | "created_at" | "modified_at">,
  ): Promise<Tenant> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const tenant = {
      ...body,
      id: nanoid(),
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };

    const adminUser: Member = {
      id: nanoid(),
      sub: ctx.state.user.sub,
      email: "placeholder",
      tenant_id: tenant.id,
      role: "admin",
      status: "active",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };

    await db.insertInto("tenants").values(tenant).execute();
    await db.insertInto("members").values(adminUser).execute();

    await updateTenantClientsInKV(ctx.env, tenant.id);

    this.setStatus(201);
    return tenant;
  }
}
