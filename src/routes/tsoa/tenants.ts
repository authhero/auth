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
import { Tenant } from "../../types/sql/Tenant";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { v4 as uuidv4 } from "uuid";

@Route("tenants")
@Tags("tenants")
export class TenantsController extends Controller {
  @Get("")
  @Security('oauth2', [])
  public async listTenants(
    @Request() request: RequestWithContext
  ): Promise<Tenant[]> {
    const db = getDb(request.ctx.env);
    const tenants = await db.selectFrom("tenants").selectAll().execute();

    return tenants;
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postTenants(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Tenant, "id">
  ): Promise<Tenant> {
    const db = getDb(request.ctx.env);
    const tenant = {
      ...body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("tenants").values(tenant).execute();

    this.setStatus(201);
    return tenant;
  }
}
