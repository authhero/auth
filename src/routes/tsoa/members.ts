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
import { Member } from "../../types/sql";
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";

@Route("tenants/{tenantId}/members")
@Tags("members")
export class MembersController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listMembers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") rangeRequest?: string,
  ): Promise<Member[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const query = db
      .selectFrom("members")
      .where("members.tenant_id", "=", tenantId);

    const { data, range } = await executeQuery(query, rangeRequest);

    if (range) {
      this.setHeader(headers.contentRange, range);
    }

    return data;
  }

  @Get("{id}")
  @Security("oauth2managementApi", [""])
  public async getMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Member | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const member = await db
      .selectFrom("members")
      .where("members.id", "=", id)
      .where("members.tenant_id", "=", tenantId)
      .selectAll()
      .executeTakeFirst();

    if (!member) {
      this.setStatus(404);
      return "Not found";
    }

    return member;
  }

  @Delete("{id}")
  @Security("oauth2managementApi", [""])
  public async deleteMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);
    await db
      .deleteFrom("members")
      .where("members.tenant_id", "=", tenantId)
      .where("members.id", "=", id)
      .execute();

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async patchMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<Member, "id" | "tenantId" | "created_at" | "modified_at">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);
    const member = {
      ...body,
      tenantId,
      modified_at: new Date().toISOString(),
    };

    const results = await db
      .updateTable("members")
      .set(member)
      .where("id", "=", id)
      .execute();

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async postMember(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Member, "id" | "tenantId" | "created_at" | "modified_at">,
  ): Promise<Member> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const member: Member = {
      ...body,
      tenant_id: tenantId,
      id: nanoid(),
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };

    await db.insertInto("members").values(member).execute();

    this.setStatus(201);
    return member;
  }

  @Put("{id}")
  @Security("oauth2managementApi", [""])
  @SuccessResponse(201, "Created")
  public async putMember(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("id") id: string,
    @Body()
    body: Omit<Member, "id" | "tenantId" | "created_at" | "modified_at">,
  ): Promise<Member> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const member: Member = {
      ...body,
      tenant_id: tenantId,
      id,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };

    try {
      await db.insertInto("members").values(member).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, created_at, tenant_id: tenantId, ...memberUpdate } = member;
      await db
        .updateTable("members")
        .set(memberUpdate)
        .where("id", "=", member.id)
        .execute();
    }

    this.setStatus(200);
    return member;
  }
}
