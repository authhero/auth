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
import { parseRange } from "../../helpers/content-range";

@Route("tenants")
@Tags("tenants")
export class TenantsController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listTenants(
    @Request() request: RequestWithContext,
    @Header("range") range?: string,
  ): Promise<Tenant[]> {
    const { ctx } = request;
    const db = getDb(ctx.env);

    const parsedRange = parseRange(range);

    let tenants;

    const permissions: string[] = ctx.state.user.permissions || [];
    if (permissions.includes(ctx.env.READ_PERMISSION as string)) {
      tenants = await db
        .selectFrom("tenants")
        .offset(parsedRange.from)
        .limit(parsedRange.limit)
        .selectAll()
        .execute();
    } else {
      tenants = await db
        .selectFrom("tenants")
        .innerJoin("members", "tenants.id", "members.tenantId")
        .where("members.sub", "=", ctx.state.user.sub)
        .offset(parsedRange.from)
        .limit(parsedRange.limit)
        .selectAll("tenants")
        .execute();
    }

    if (parsedRange.entity) {
      this.setHeader(
        headers.contentRange,
        `${parsedRange.entity}=${parsedRange.from}-${parsedRange.to}/${parsedRange.limit}`,
      );
    }

    return tenants;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getTenant(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
  ): Promise<Tenant | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const tenant = await db
      .selectFrom("tenants")
      .where("tenants.id", "=", id)
      .selectAll()
      .executeTakeFirst();

    console.log("tenant: " + JSON.stringify(tenant));

    if (!tenant) {
      this.setStatus(404);
      return "Not found";
    }

    return tenant;
  }

  @Put("{id}")
  @Security("oauth2managementApi", [""])
  public async putTenant(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Body() body: Omit<Tenant, "id">,
  ): Promise<Tenant | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const tenant = {
      ...body,
      id,
      modifiedAt: new Date().toISOString(),
    };

    await db
      .insertInto("tenants")
      .values(tenant)
      .onConflict((oc) => oc.column("id").doUpdateSet(tenant))
      .execute();

    this.setStatus(201);
    return tenant;
  }

  @Post("")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postTenants(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Tenant, "id" | "createdAt" | "modifiedAt">,
  ): Promise<Tenant> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const tenant = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    const adminUser: Member = {
      id: nanoid(),
      sub: ctx.state.user.sub,
      email: "placeholder",
      tenantId: tenant.id,
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("tenants").values(tenant).execute();
    await db.insertInto("members").values(adminUser).execute();

    this.setStatus(201);
    return tenant;
  }
}
