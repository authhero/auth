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
import { Member } from "../../types/sql";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";

@Route("tenants/{tenant_id}/members")
@Tags("members")
export class MembersController extends Controller {
  @Get("")
  @Security("oauth2managementApi", [""])
  public async listMembers(
    @Request() request: RequestWithContext,
    @Path() tenant_id: string,
    @Header("range") rangeRequest?: string,
  ): Promise<Member[]> {
    const { ctx } = request;

    const db = getDbFromEnv(ctx.env);
    const query = db
      .selectFrom("members")
      .where("members.tenant_id", "=", tenant_id);

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
    @Path() id: string,
    @Path() tenant_id: string,
  ): Promise<Member | string> {
    const { ctx } = request;

    const db = getDbFromEnv(ctx.env);
    const member = await db
      .selectFrom("members")
      .where("members.id", "=", id)
      .where("members.tenant_id", "=", tenant_id)
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
    @Path() id: string,
    @Path() tenant_id: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDbFromEnv(env);
    await db
      .deleteFrom("members")
      .where("members.tenant_id", "=", tenant_id)
      .where("members.id", "=", id)
      .execute();

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2managementApi", [""])
  public async patchMember(
    @Request() request: RequestWithContext,
    @Path() id: string,
    @Path() tenant_id: string,
    @Body()
    body: Partial<
      Omit<Member, "id" | "tenant_id" | "created_at" | "updated_at">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDbFromEnv(env);
    const member = {
      ...body,
      tenant_id,
      updated_at: new Date().toISOString(),
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
    @Path() tenant_id: string,
    @Body()
    body: Omit<Member, "id" | "tenant_id" | "created_at" | "updated_at">,
  ): Promise<Member> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDbFromEnv(env);

    const member: Member = {
      ...body,
      tenant_id: tenant_id,
      id: nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    @Path() tenant_id: string,
    @Path() id: string,
    @Body()
    body: Omit<Member, "id" | "tenant_id" | "created_at" | "updated_at">,
  ): Promise<Member> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDbFromEnv(env);

    const member: Member = {
      ...body,
      tenant_id: tenant_id,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await db.insertInto("members").values(member).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, created_at, tenant_id: tenant_id, ...memberUpdate } = member;
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
