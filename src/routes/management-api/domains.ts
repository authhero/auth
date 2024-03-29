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
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";
import { SqlDomain } from "../../types/sql/Domain";

@Route("tenants/{tenantId}/domains")
@Tags("domains")
export class DomainsController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listDomains(
    @Request() request: RequestWithContext,
    @Path() tenantId: string,
    @Header("range") range?: string,
  ): Promise<SqlDomain[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDbFromEnv(ctx.env);
    const query = db
      .selectFrom("domains")
      .where("domains.tenant_id", "=", tenantId);

    const domains = await query
      .selectAll()
      .offset(parsedRange.from)
      .limit(parsedRange.limit)
      .execute();

    if (parsedRange.entity) {
      const [{ count }] = await query
        .select((eb) => eb.fn.countAll().as("count"))
        .execute();

      this.setHeader(
        headers.contentRange,
        `${parsedRange.entity}=${parsedRange.from}-${parsedRange.to}/${count}`,
      );
    }

    return domains;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getDomain(
    @Request() request: RequestWithContext,
    @Path() id: string,
    @Path() tenantId: string,
  ): Promise<SqlDomain | string> {
    const { ctx } = request;

    const db = getDbFromEnv(ctx.env);
    const domain = await db
      .selectFrom("domains")
      .where("domains.id", "=", id)
      .where("domains.tenant_id", "=", tenantId)
      .selectAll()
      .executeTakeFirst();

    if (!domain) {
      this.setStatus(404);
      return "Not found";
    }

    return domain;
  }

  @Delete("{id}")
  @Security("oauth2managementApi", [""])
  public async deleteDomain(
    @Request() request: RequestWithContext,
    @Path() id: string,
    @Path() tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDbFromEnv(env);
    await db
      .deleteFrom("domains")
      .where("domains.tenant_id", "=", tenantId)
      .where("domains.id", "=", id)
      .execute();

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async patchDomain(
    @Request() request: RequestWithContext,
    @Path() id: string,
    @Path() tenantId: string,
    @Body()
    body: Partial<
      Omit<SqlDomain, "id" | "tenant_id" | "created_at" | "updated_at">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDbFromEnv(env);
    const domain = {
      ...body,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };

    const results = await db
      .updateTable("domains")
      .set(domain)
      .where("id", "=", id)
      .execute();

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postDomain(
    @Request() request: RequestWithContext,
    @Path() tenantId: string,
    @Body()
    body: { domain: string },
  ): Promise<SqlDomain> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDbFromEnv(env);

    const domain: SqlDomain = {
      ...body,
      tenant_id: tenantId,
      id: nanoid(),
      // TODO: generate keys
      dkim_public_key: "",
      dkim_private_key: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.insertInto("domains").values(domain).execute();

    this.setStatus(201);
    return domain;
  }

  @Put("{id}")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async putDomain(
    @Request() request: RequestWithContext,
    @Path() id: string,
    @Path() tenantId: string,
    @Body()
    body: Omit<SqlDomain, "id" | "tenant_id" | "created_at" | "updated_at">,
  ): Promise<SqlDomain> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDbFromEnv(env);

    const domain: SqlDomain = {
      ...body,
      tenant_id: tenantId,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await db.insertInto("domains").values(domain).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, created_at, tenant_id: tenantId, ...domainUpdate } = domain;
      await db
        .updateTable("domains")
        .set(domainUpdate)
        .where("id", "=", domain.id)
        .execute();
    }

    this.setStatus(200);
    return domain;
  }
}
