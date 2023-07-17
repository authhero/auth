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
} from "@tsoa/runtime";
import { Tenant, AdminUser } from "../../types/sql";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";

@Route("tenants")
@Tags("tenants")
export class TenantsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listTenants(
    @Request() request: RequestWithContext
  ): Promise<Tenant[]> {
    const { ctx } = request;
    const db = getDb(ctx.env);

    const tenants = await db
      .selectFrom("tenants")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .selectAll("tenants")
      .execute();

    return tenants;
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postTenants(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Tenant, "id">
  ): Promise<Tenant> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const tenant = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    const adminUser: AdminUser = {
      id: ctx.state.user.sub,
      // TODO: Fetch this from the profile endpoint
      email: "placeholder",
      tenantId: tenant.id,
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("tenants").values(tenant).execute();
    await db.insertInto("admin_users").values(adminUser).execute();

    this.setStatus(201);
    return tenant;
  }
}
