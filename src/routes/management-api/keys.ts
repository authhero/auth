import {
  Controller,
  Get,
  Header,
  Request,
  Route,
  Security,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { z } from "zod";
import { SigningKey } from "../../types";

export const LogsFilterSchema = z.object({
  userId: z.string(),
});

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
      created_at: key.created_at,
      revoked_at: key.revoked_at,
      revoked: !!key.revoked_at,
      fingerprint: "fingerprint",
      thumbprint: "thumbprint",
    }));
  }
}
