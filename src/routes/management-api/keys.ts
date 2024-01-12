import {
  Controller,
  Get,
  Header,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { z } from "zod";
import { SigningKey } from "../../types";
import { create } from "../../services/rsa-key";
import { HTTPException } from "hono/http-exception";

const LogsFilterSchema = z.object({
  userId: z.string(),
});

const DAY = 1000 * 60 * 60 * 24;

@Route("api/v2/keys/signing")
@Tags("keys")
@Security("oauth2managementApi", [""])
export class KeysController extends Controller {
  @Get("")
  public async list(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
  ): Promise<SigningKey[]> {
    const { ctx } = request;
    const { env } = ctx;

    const keys = await env.data.keys.list();

    return keys.map((key) => ({
      kid: key.kid,
      cert: key.public_key,
      revoked_at: key.revoked_at,
      revoked: !!key.revoked_at,
      fingerprint: "fingerprint",
      thumbprint: "thumbprint",
    }));
  }

  @Get("{kid}")
  public async get(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path() kid: string,
  ): Promise<SigningKey> {
    const { ctx } = request;
    const { env } = ctx;

    const keys = await env.data.keys.list();
    const key = keys.find((k) => k.kid === kid);
    if (!key) {
      throw new HTTPException(404, { message: "Key not found" });
    }

    return {
      kid: key.kid,
      cert: key.public_key,
      revoked_at: key.revoked_at,
      revoked: !!key.revoked_at,
      fingerprint: "fingerprint",
      thumbprint: "thumbprint",
    };
  }

  @Post("rotate")
  @SuccessResponse(201, "Created")
  public async rotate(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
  ): Promise<string> {
    const { ctx } = request;
    const { env } = ctx;

    const keys = await env.data.keys.list();
    for await (const key of keys) {
      await env.data.keys.revoke(key.kid, new Date(Date.now() + DAY));
    }

    const newCertificate = await create();
    await env.data.keys.create(newCertificate);

    this.setStatus(201);
    return "OK";
  }

  @Put("{kid}/revoke")
  @SuccessResponse(201, "Created")
  public async revoke(
    @Request() request: RequestWithContext,
    @Header() tenant_id: string,
    @Path() kid: string,
  ): Promise<string> {
    const { ctx } = request;
    const { env } = ctx;

    const revoked = await env.data.keys.revoke(kid, new Date(Date.now()));
    if (!revoked) {
      throw new HTTPException(404, { message: "Key not found" });
    }

    const newCertificate = await create();
    await env.data.keys.create(newCertificate);

    this.setStatus(201);
    return "OK";
  }
}
