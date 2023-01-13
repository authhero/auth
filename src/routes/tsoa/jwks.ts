import { RequestWithContext } from "../../types/RequestWithContext";
import { Controller, Get, Request, Route, Tags } from "@tsoa/runtime";
import { CERTIFICATE_EXPIRE_IN_SECONDS, client } from "../../constants";
import { JwksKeys } from "../../types/jwks";

@Route("")
@Tags("jwks")
export class JWKSRoutes extends Controller {
  @Get(".well-known/jwks.json")
  /**
   * An endpoint for converting an auth0 token to a publisher token using a redirect
   */
  public async getJWKS(
    @Request() request: RequestWithContext
  ): Promise<JwksKeys> {
    const { env } = request.ctx;

    const certificatesString = await env.CERTIFICATES.get(client.id);
    const keys = (certificatesString ? JSON.parse(certificatesString) : []).map(
      (cert: any) => {
        return { kid: cert.kid, ...cert.publicKey };
      }
    );

    this.setHeader("content-type", "application/json");
    this.setHeader(
      "cache-control",
      `public, max-age=${CERTIFICATE_EXPIRE_IN_SECONDS}, stale-while-revalidate=${CERTIFICATE_EXPIRE_IN_SECONDS}, stale-if-error=86400`
    );

    return { keys };
  }
}
