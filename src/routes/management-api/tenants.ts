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
  Query,
  Path,
  Patch,
} from "@tsoa/runtime";
import { Tenant } from "../../types/sql";
import { RequestWithContext } from "../../types/RequestWithContext";
import { Totals } from "../../types/auth0";

export interface GetTenantsWithTotals extends Totals {
  tenants: Tenant[];
}

function parseSort(sort?: string):
  | undefined
  | {
      sort_by: string;
      sort_order: "asc" | "desc";
    } {
  if (!sort) {
    return undefined;
  }

  const [sort_by, orderString] = sort.split(":");
  const sort_order = orderString === "1" ? "asc" : "desc";

  return {
    sort_by,
    sort_order,
  };
}

@Route("api/v2/tenants")
@Tags("tenants")
export class TenantsController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [])
  /**
   * This endpoint is not available in the Auth0 Management API as it only handles one tenant per domain.
   */
  public async listTenants(
    @Request() request: RequestWithContext,
    /**
     * @description The page number where 1 is the first page
     * @isInt value
     * @minimum 1
     */
    @Query() page = 1,
    /**
     * @description The number of items per page
     * @isInt value
     * @minimum 1
     */
    @Query() per_page = 20,
    @Query() include_totals = false,
    /**
     * @description A property that should have the format "string:-1" or "string:1"
     * @pattern ^.+:(-1|1)$
     */
    @Query() sort?: string,
    /**
     * @description A lucene query string used to filter the results"
     */
    @Query() q?: string,
  ): Promise<Tenant[] | GetTenantsWithTotals> {
    const { env } = request.ctx;

    const result = await env.data.tenants.list({
      page,
      per_page,
      include_totals,
      sort: parseSort(sort),
      q,
    });

    if (include_totals) {
      return result as GetTenantsWithTotals;
    }

    return result.tenants;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getTenant(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
  ): Promise<Tenant | string> {
    const { env } = request.ctx;

    const tenant = await env.data.tenants.get(id);

    if (!tenant) {
      this.setStatus(404);
      return "Not found";
    }

    return tenant;
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async putTenant(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Body() body: Omit<Tenant, "id" | "created_at" | "updated_at">,
  ): Promise<Tenant | string> {
    const { env } = request.ctx;

    await env.data.tenants.update(id, body);

    const tenant = await env.data.tenants.get(id);
    if (!tenant) {
      this.setStatus(404);
      return "Not found";
    }

    this.setStatus(201);
    return tenant;
  }

  @Post("")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postTenant(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Tenant, "id" | "created_at" | "updated_at">,
  ): Promise<Tenant> {
    const { env } = request.ctx;

    const tenant = await env.data.tenants.create(body);

    // TODO: this should be a middleware
    if (env.hooks?.tenant?.onCreated) {
      await env.hooks.tenant.onCreated(env, tenant);
    }

    this.setStatus(201);
    return tenant;
  }
}
