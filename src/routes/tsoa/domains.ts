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
import { updateTenantClientsInKV } from "../../hooks/update-client";
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
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<SqlDomain[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const domains = await db
      .selectFrom("domains")
      .where("domains.tenantId", "=", tenantId)
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

    return domains;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getDomain(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<SqlDomain | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const domain = await db
      .selectFrom("domains")
      .where("domains.id", "=", id)
      .where("domains.tenantId", "=", tenantId)
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
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);
    await db
      .deleteFrom("domains")
      .where("domains.tenantId", "=", tenantId)
      .where("domains.id", "=", id)
      .execute();

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async patchDomain(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<SqlDomain, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);
    const domain = {
      ...body,
      tenantId,
      modifiedAt: new Date().toISOString(),
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
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<SqlDomain, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<SqlDomain> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const domain: SqlDomain = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
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
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<SqlDomain, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<SqlDomain> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const domain: SqlDomain = {
      ...body,
      tenantId,
      id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    try {
      await db.insertInto("domains").values(domain).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, createdAt, tenantId, ...domainUpdate } = domain;
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
