import {
  Controller,
  Get,
  Post,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
} from "@tsoa/runtime";
import { Tenant } from "../../types/sql/Tenant";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";

@Route("tenants")
@Tags("tenants")
export class TenantsController extends Controller {
  @Get("")
  public async listTenants(
    @Request() request: RequestWithContext
  ): Promise<Tenant[]> {
    const db = getDb(request.ctx);
    const tenants = await db.selectFrom("tenants").selectAll().execute();

    return tenants;
  }

  @Get("test")
  public async testTenants(
    @Request() request: RequestWithContext
  ): Promise<any[]> {
    const db = getDb(request.ctx);
    const applications = await db
      .selectFrom("applications")
      .innerJoin("tenants", "applications.tenantId", "tenants.id")
      .leftJoin("authProviders", "authProviders.tenantId", "tenants.id")
      .selectAll()
      // .select([
      //   "applications.id",
      //   "applications.name",
      //   "tenants.audience",
      //   "tenants.id as tenantId",
      // ])
      .execute();

    return applications;
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postTenants(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Tenant, "id">
  ): Promise<Tenant> {
    const db = getDb(request.ctx);
    const tenant = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("tenants").values(tenant).execute();

    this.setStatus(201);
    return tenant;
  }
}
