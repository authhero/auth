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

@Route("tenants/{tenantId}/members")
@Tags("members")
export class MembersController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listMembers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<Member[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const members = await db
      .selectFrom("members")
      .where("members.tenantId", "=", tenantId)
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

    return members;
  }

  @Get("{id}")
  @Security("oauth2", [])
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
      .where("members.tenantId", "=", tenantId)
      .selectAll()
      .executeTakeFirst();

    if (!member) {
      this.setStatus(404);
      return "Not found";
    }

    return member;
  }

  @Delete("{id}")
  @Security("oauth2", [])
  public async deleteMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);
    await db
      .deleteFrom("members")
      .where("members.tenantId", "=", tenantId)
      .where("members.id", "=", id)
      .execute();

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2", [])
  public async patchMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<Omit<Member, "id" | "tenantId" | "createdAt" | "modifiedAt">>,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);
    const member = {
      ...body,
      tenantId,
      modifiedAt: new Date().toISOString(),
    };

    const results = await db
      .updateTable("members")
      .set(member)
      .where("id", "=", id)
      .execute();

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postMember(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<Member, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<Member> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const member: Member = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("members").values(member).execute();

    this.setStatus(201);
    return member;
  }

  @Put("{id}")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async putMember(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("id") id: string,
    @Body()
    body: Omit<Member, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<Member> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const member: Member = {
      ...body,
      tenantId,
      id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    try {
      await db.insertInto("members").values(member).execute();
    } catch (err: any) {
      if (!err.message.includes("AlreadyExists")) {
        throw err;
      }

      const { id, createdAt, tenantId, ...memberUpdate } = member;
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
