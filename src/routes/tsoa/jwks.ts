import { RequestWithContext } from "../../types/RequestWithContext";
import { Controller, Get, Request, Route, Tags } from "@tsoa/runtime";
import {
  CERTIFICATE_EXPIRE_IN_SECONDS,
  contentTypes,
  headers,
} from "../../constants";
import { JwksKeys } from "../../types/jwks";

export interface OpenIDCongiruration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  device_authorization_endpoint: string;
  userinfo_endpoint: string;
  mfa_challenge_endpoint: string;
  jwks_uri: string;
  registration_endpoint: string;
  revocation_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  code_challenge_methods_supported: string[];
  response_modes_supported: string[];
  subject_types_supported: string[],
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  request_uri_parameter_supported: boolean;
  request_parameter_supported: boolean;
  token_endpoint_auth_signing_alg_values_supported: string[];
}

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

    const certificatesString = await env.CERTIFICATES.get("default");
    const keys = (certificatesString ? JSON.parse(certificatesString) : []).map(
      (cert: any) => {
        return { kid: cert.kid, ...cert.publicKey };
      }
    );

    this.setHeader(headers.contentType, contentTypes.json);
    this.setHeader(headers.accessControlAllowOrigin, "*");
    this.setHeader(headers.accessControlAllowMethod, "GET");
    this.setHeader(
      headers.cacheControl,
      `public, max-age=${CERTIFICATE_EXPIRE_IN_SECONDS}, stale-while-revalidate=${CERTIFICATE_EXPIRE_IN_SECONDS}, stale-if-error=86400`
    );

    return { keys };
  }

  @Get(".well-known/openid-configuration")
  /**
   * An endpoint for converting an auth0 token to a publisher token using a redirect
   */
  public async getOpenIDConfigration(
    @Request() request: RequestWithContext
  ): Promise<OpenIDCongiruration> {
    const baseUrl = `${request.ctx.protocol}//${request.ctx.hostname}`;

    return {
      "issuer": baseUrl,
      "authorization_endpoint": `${baseUrl}/authorize`,
      "token_endpoint": `${baseUrl}/oauth/token`,
      "device_authorization_endpoint": `${baseUrl}/oauth/device/code`,
      "userinfo_endpoint": `${baseUrl}/userinfo`,
      "mfa_challenge_endpoint": `${baseUrl}/mfa/challenge`,
      "jwks_uri": `${baseUrl}/.well-known/jwks.json`,
      "registration_endpoint": `${baseUrl}/oidc/register`,
      "revocation_endpoint": `${baseUrl}/oauth/revoke`,
      "scopes_supported": [
        "openid",
        "profile",
        "offline_access",
        "name",
        "given_name",
        "family_name",
        "nickname",
        "email",
        "email_verified",
        "picture",
        "created_at",
        "identities",
        "phone",
        "address"
      ],
      "response_types_supported": [
        "code",
        "token",
        "id_token",
        "code token",
        "code id_token",
        "token id_token",
        "code token id_token"
      ],
      "code_challenge_methods_supported": [
        "S256",
        "plain"
      ],
      "response_modes_supported": [
        "query",
        "fragment",
        "form_post"
      ],
      "subject_types_supported": [
        "public"
      ],
      "id_token_signing_alg_values_supported": [
        "HS256",
        "RS256"
      ],
      "token_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "private_key_jwt"
      ],
      "claims_supported": [
        "aud",
        "auth_time",
        "created_at",
        "email",
        "email_verified",
        "exp",
        "family_name",
        "given_name",
        "iat",
        "identities",
        "iss",
        "name",
        "nickname",
        "phone_number",
        "picture",
        "sub"
      ],
      "request_uri_parameter_supported": false,
      "request_parameter_supported": false,
      "token_endpoint_auth_signing_alg_values_supported": [
        "RS256",
        "RS384",
        "PS256"
      ]
    }
  }
}
