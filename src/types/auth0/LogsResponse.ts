export enum LogTypes {
  SUCCESS_API_OPERATION = "sapi",
  //
  SUCCESS_SILENT_AUTH = "ssa",
  FAILED_SILENT_AUTH = "fsa",
  //
  // we don't have this in the logs yet
  // SUCCESS_SIGNUP = "ss",
  // we don't have this in the logs yet
  // FAILED_SIGNUP = "fs",
  //
  SUCCESS_LOGIN = "s",
  FAILED_LOGIN_INCORRECT_PASSWORD = "fp",
  // we don't have this in the logs yet
  // FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu",
  //
  SUCCESS_LOGOUT = "slo",
  //
  SUCCESS_CROSS_ORIGIN_AUTHENTICATION = "scoa",
  FAILED_CROSS_ORIGIN_AUTHENTICATION = "fcoa",
  // not implemented
  NOT_IMPLEMENTED_1 = "seccft",
  NOT_IMPLEMENTED_2 = "cls",
}
export type LogType = `${LogTypes}`;

export interface LogsResponseBase {
  type: LogType;
  date: string;
  description?: string;
  ip: string;
  user_agent: string;
  details?: any;
  auth0_client?: {
    name: string;
    version: string;
    env?: object;
  };
  isMobile?: boolean;
}

// i'm thinking there might be another base type... for when from the browser vs mgmt api!
interface BrowserLogsResponseBase extends LogsResponseBase {
  user_id: string;
  user_name: string;
  // do not have this field yet in SQL
  connection?: string;
  connection_id: string;
  client_id: string;
  client_name: string;
}

export interface SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant
  extends BrowserLogsResponseBase {
  type: "seccft";
  audience?: string;
  // notice how this can be both in auth0! interesting
  scope?: string[] | string;
  strategy?: string;
  strategy_type?: string;
  hostname: string;
}

export interface SuccessCrossOriginAuthentication
  extends BrowserLogsResponseBase {
  type: "scoa";
  hostname: string;
}
// interesting this doesn't extend the browser one... auth0 seems a bit random with what fields it provides
export interface FailedCrossOriginAuthentication extends LogsResponseBase {
  type: "fcoa";
  hostname: string;
  connection_id: string;
}

export interface SuccessApiOperation extends LogsResponseBase {
  type: "sapi";
  client_id: string;
  client_name: string;
}

export interface FailedLoginIncorrectPassword extends BrowserLogsResponseBase {
  type: "fp";
  strategy: string;
  strategy_type: string;
}

export interface CodeLinkSent extends BrowserLogsResponseBase {
  type: "cls";
  strategy: string;
  strategy_type: string;
}

export interface FailedSilentAuth extends LogsResponseBase {
  type: "fsa";
  hostname: string;
  audience: string;
  scope: string[];
  client_id: string;
  client_name: string;
}

export interface SuccessLogout extends BrowserLogsResponseBase {
  type: "slo";
  hostname: string;
}

export interface SuccessLogin extends BrowserLogsResponseBase {
  type: "s";
  strategy: string;
  strategy_type: string;
  hostname: string;
}

export interface SuccessSilentAuth extends LogsResponseBase {
  type: "ssa";
  hostname: string;
  client_id: string;
  client_name: string;
  session_connection: string;
  user_id: string;
  user_name: string;
}

// lol the naming here... essentially want all fields except the id
export type LogsResponseBaseBase =
  | SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant
  | SuccessCrossOriginAuthentication
  | SuccessApiOperation
  | FailedLoginIncorrectPassword
  | FailedCrossOriginAuthentication
  | CodeLinkSent
  | FailedSilentAuth
  | SuccessLogout
  | SuccessLogin
  | SuccessSilentAuth;

export type LogsResponse = LogsResponseBaseBase & {
  log_id: string;
  _id: string;
};

const logs: LogsResponse[] = [
  {
    date: "2024-02-08T11:59:27.270Z",
    type: "seccft",
    description: "",
    connection_id: "",
    client_id: "G1F2A0J6ySsTcALiwqgpFQvDNRRdinqV",
    client_name: "Dan's Auth0 mgmt API inspection",
    ip: "84.78.241.244",
    user_agent: "Other 0.0.0 / Other 0.0.0",
    hostname: "sesamy-dev.eu.auth0.com",
    user_id: "",
    user_name: "",
    audience: "https://sesamy-dev.eu.auth0.com/api/v2/",
    scope:
      "read:users update:users create:users read:clients read:connections read:logs read:logs_users",
    auth0_client: {
      name: "node-auth0",
      version: "3.7.0",
      env: {
        node: "20.8.0",
      },
    },
    log_id: "90020240208115927400121000000000000001223372070392782845",
    _id: "90020240208115927400121000000000000001223372070392782845",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:37:03.255Z",
    type: "scoa",
    connection: "email",
    connection_id: "con_TI7p6dEHf551Q9t6",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "139.47.117.198",
    user_agent: "Chrome 120.0.0 / Linux 0.0.0",
    details: {
      prompts: [
        {
          name: "coverify",
          session: true,
          stats: {
            loginsCount: 1,
          },
          connection: "email",
          timers: {
            rules: 670,
          },
          elapsedTime: null,
        },
      ],
      completedAt: 1707392223251,
      elapsedTime: null,
      stats: {
        loginsCount: 1,
      },
    },
    hostname: "auth.sesamy.dev",
    user_id: "email|65c4bca2b6c3ddf424cef5d5",
    user_name: "ewa+888@sesamy.com",
    auth0_client: {
      name: "auth0.js",
      version: "9.24.1",
    },
    log_id: "90020240208113703292362000000000000001223372070390295308",
    _id: "90020240208113703292362000000000000001223372070390295308",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:37:03.010Z",
    type: "sapi",
    description: "Update a User",
    client_id: "zfhj4l8TXfzsSipBWbYsEGMB3hpFRq7t",
    client_name: "",
    ip: "52.57.230.214",
    user_agent: "Other 0.0.0 / Other 0.0.0",
    details: {
      request: {
        method: "patch",
        path: "/api/v2/users/email%7C65c4bca2b6c3ddf424cef5d5",
        query: {},
        userAgent: "node-superagent/1.8.5",
        body: {
          app_metadata: {
            geo: {
              country_code: "ES",
              country_code3: "ESP",
              country_name: "Spain",
              city_name: "Barcelona",
              latitude: 41.4231,
              longitude: 2.188,
              time_zone: "Europe/Madrid",
              continent_code: "EU",
              subdivision_code: "CT",
              subdivision_name: "Catalonia",
            },
          },
        },
        channel: "api",
        ip: "52.57.230.214",
        auth: {
          user: {},
          strategy: "jwt",
          credentials: {
            scopes: ["read:users", "update:users"],
          },
        },
      },
      response: {
        statusCode: 200,
        body: {
          created_at: "2024-02-08T11:37:02.337Z",
          email: "ewa+888@sesamy.com",
          email_verified: true,
          identities: [
            {
              user_id: "65c4bca2b6c3ddf424cef5d5",
              provider: "email",
              connection: "email",
              isSocial: false,
            },
          ],
          name: "ewa+888@sesamy.com",
          nickname: "ewa+888",
          picture:
            "https://s.gravatar.com/avatar/d59126709a562c1b882551c8099079e9?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Few.png",
          updated_at: "2024-02-08T11:37:02.999Z",
          user_id: "email|65c4bca2b6c3ddf424cef5d5",
          app_metadata: {
            geo: {
              country_code: "ES",
              country_code3: "ESP",
              country_name: "Spain",
              city_name: "Barcelona",
              latitude: 41.4231,
              longitude: 2.188,
              time_zone: "Europe/Madrid",
              continent_code: "EU",
              subdivision_code: "CT",
              subdivision_name: "Catalonia",
            },
          },
          last_ip: "139.47.117.198",
          last_login: "2024-02-08T11:37:02.330Z",
          logins_count: 1,
        },
      },
    },
    log_id: "90020240208113703067870000000000000001223372070390294887",
    _id: "90020240208113703067870000000000000001223372070390294887",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:36:27.687Z",
    type: "fp",
    description: "Wrong email or verification code.",
    connection: "email",
    connection_id: "con_TI7p6dEHf551Q9t6",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "139.47.117.198",
    user_agent: "Chrome 120.0.0 / Linux 0.0.0",
    details: {
      error: {
        message: "Wrong email or verification code.",
      },
      authentication_methods: ["email"],
    },
    user_id: "email|65c4bca2b6c3ddf424cef5d5",
    user_name: "ewa+888@sesamy.com",
    strategy: "email",
    strategy_type: "passwordless",
    log_id: "90020240208113627759377000000000000001223372070390231232",
    _id: "90020240208113627759377000000000000001223372070390231232",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:36:27.691Z",
    type: "fcoa",
    description: "Wrong email or verification code.",
    connection_id: "",
    ip: "139.47.117.198",
    user_agent: "Chrome 120.0.0 / Linux 0.0.0",
    details: {
      body: {
        client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
        username: "ewa+888@sesamy.com",
        otp: "835416",
        realm: "email",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
      },
      qs: {},
      connection: "email",
      error: {
        message: "Wrong email or verification code.",
        oauthError: "Wrong email or verification code.",
        type: "access_denied",
        uri: null,
      },
    },
    hostname: "auth.sesamy.dev",
    auth0_client: {
      name: "auth0.js",
      version: "9.24.1",
    },
    log_id: "90020240208113627712533000000000000001223372070390231155",
    _id: "90020240208113627712533000000000000001223372070390231155",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:36:02.586Z",
    type: "cls",
    description: "ewa+888@sesamy.com",
    connection: "email",
    connection_id: "con_TI7p6dEHf551Q9t6",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "139.47.117.198",
    user_agent: "Chrome 120.0.0 / Linux 0.0.0",
    details: {
      link: "https://auth.sesamy.dev/passwordless/verify_redirect?scope=openid%20profile%20email&response_type=token%20id_token&redirect_uri=https%3A%2F%2Flogin2.sesamy.dev%2Fcallback&state=redirect_uri%3Dhttps%253A%252F%252Ftoken.sesamy.dev%252Fcallback%26client_id%3Dsesamy%26state%3DeyJjbGllbnRfaWQiOiJzZXNhbXkiLCJzdGF0ZSI6IlgzaFBSRlpmWXkxVFltOHlTMjVVVFZWTmZsZ3dXazlIYlZacGFYWm9RVWx6TmxOSWQwNHdPV3gzU1E9PSIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vYWNjb3VudC5zZXNhbXkuZGV2LyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJub25jZSI6IlJ6ZFpOMGxKUldkVWNITkdVeTFzVUhSdGJqaDFhSGhzV0c5UU1FVjRjMnRGWDFSc1FUQkVlblIzY1E9PSIsInJlc3BvbnNlX3R5cGUiOiJjb2RlIiwicmVzcG9uc2VfbW9kZSI6InF1ZXJ5IiwiY29kZV9jaGFsbGVuZ2VfbWV0aG9kIjoiUzI1NiIsImNvZGVfY2hhbGxlbmdlIjoiMFpGZm5WWXowR2JTWVVQcFVSYUFuanJLY3ZHTTl0R190Nkw4QzZjc0VKayIsInZlbmRvcklkIjoic2VzYW15In0&nonce=.64CB2yaaB9iKuz_Y0y4kJ~rDgBncx9N&verification_code=******&connection=email&client_id=0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW&email=ewa%2B888%40sesamy.com",
      body: {
        client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
        connection: "email",
        send: "code",
        email: "ewa+888@sesamy.com",
        authParams: {
          response_type: "token id_token",
          redirect_uri: "https://login2.sesamy.dev/callback",
          scope: "openid profile email",
          state:
            "redirect_uri=https%3A%2F%2Ftoken.sesamy.dev%2Fcallback&client_id=sesamy&state=eyJjbGllbnRfaWQiOiJzZXNhbXkiLCJzdGF0ZSI6IlgzaFBSRlpmWXkxVFltOHlTMjVVVFZWTmZsZ3dXazlIYlZacGFYWm9RVWx6TmxOSWQwNHdPV3gzU1E9PSIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vYWNjb3VudC5zZXNhbXkuZGV2LyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJub25jZSI6IlJ6ZFpOMGxKUldkVWNITkdVeTFzVUhSdGJqaDFhSGhzV0c5UU1FVjRjMnRGWDFSc1FUQkVlblIzY1E9PSIsInJlc3BvbnNlX3R5cGUiOiJjb2RlIiwicmVzcG9uc2VfbW9kZSI6InF1ZXJ5IiwiY29kZV9jaGFsbGVuZ2VfbWV0aG9kIjoiUzI1NiIsImNvZGVfY2hhbGxlbmdlIjoiMFpGZm5WWXowR2JTWVVQcFVSYUFuanJLY3ZHTTl0R190Nkw4QzZjc0VKayIsInZlbmRvcklkIjoic2VzYW15In0",
          nonce: ".64CB2yaaB9iKuz_Y0y4kJ~rDgBncx9N",
        },
        is_signup: true,
        tenant: "sesamy-dev",
        request_language: "en-GB,en-US;q=0.9,en;q=0.8",
      },
      authentication_methods: ["email"],
    },
    user_id: "",
    user_name: "ewa+888@sesamy.com",
    strategy: "email",
    strategy_type: "passwordless",
    log_id: "90020240208113602649078000000000000001223372070390185731",
    _id: "90020240208113602649078000000000000001223372070390185731",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:35:58.561Z",
    type: "fsa",
    description: "Login required",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "139.47.117.198",
    user_agent: "Chrome 120.0.0 / Linux 0.0.0",
    details: {
      body: {},
      qs: {
        client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
        response_type: "token id_token",
        redirect_uri: "https://login2.sesamy.dev/callback",
        scope: "openid profile email",
        state: "~w~FTBMH.xbCTNg4DZYtDmY2op6JLfLT",
        nonce: "ZQHSeIf3IsyZ7-hVvoKukaT6q1x6lrP1",
        response_mode: "web_message",
        prompt: "none",
        auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yNC4xIn0=",
      },
      connection: null,
      error: {
        message: "Login required",
        oauthError: "login_required",
        type: "oauth-authorization",
      },
      riskAssessment: null,
    },
    hostname: "auth.sesamy.dev",
    audience: "https://sesamy.com",
    scope: ["openid", "profile", "email"],
    auth0_client: {
      name: "auth0.js",
      version: "9.24.1",
    },
    log_id: "90020240208113558588328000000000000001223372070390177973",
    _id: "90020240208113558588328000000000000001223372070390177973",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:35:57.394Z",
    type: "slo",
    connection: "email",
    connection_id: "con_TI7p6dEHf551Q9t6",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "139.47.117.198",
    user_agent: "Chrome 120.0.0 / Linux 0.0.0",
    details: {
      return_to:
        "https://token.sesamy.dev/logout-callback?redirect_uri=https%3A%2F%2Faccount.sesamy.dev&client_id=sesamy",
      allowed_logout_url: [
        "http://localhost:8080",
        "http://localhost:8000",
        "http://localhost:8080/close",
        "http://localhost:3000",
        "http://localhost:3000/close",
        "http://localhost:3001",
        "http://localhost:3001/close",
        "https://myvault.vercel.app",
        "https://myvault.vercel.app/close",
        "https://checkout-sesamy.vercel.app",
        "https://checkout.sesamy.dev",
        "https://checkout.sesamy.dev/close",
        "https://checkout.dev.sesamy.cloud",
        "https://checkout.dev.sesamy.cloud/close",
        "https://checkout-*-sesamy.vercel.app",
        "https://sesamy-checkout-*-sesamy.vercel.app",
        "https://*.sesamy.dev",
        "https://commerce-*-sesamy.vercel.app",
        "https://dev-admin-dashboard-*-sesamy.vercel.app",
        "https://admin-dashboard-*-sesamy.vercel.app",
        "https://dev-admin-dashboard-sesamy.vercel.app",
        "https://*.vercel.sesamy.dev",
        "http://localhost:3000/da",
        "http://localhost:3000/sv",
        "https://*.vercel.sesamy.dev/da",
        "https://*.vercel.sesamy.dev/sv",
        "https://*.vercel.sesamy.dev/se",
        "https://*.vercel.sesamy.dev/dk",
        "https://commerce.sesamy.dev/da",
        "https://commerce.sesamy.dev/sv",
        "https://ngrok.dev.sesamy.cloud",
        "https://ngrok.dev.sesamy.cloud/close",
        "https://commerce.dev.sesamy.cloud",
        "https://commerce.dev.sesamy.cloud/da",
        "https://commerce.dev.sesamy.cloud/sv",
        "https://login.sesamy.dev/sv",
        "https://login.sesamy.dev/en",
        "https://login.sesamy.dev/da",
        "https://token.sesamy.dev/logout-callback",
        "http://localhost:8787/logout-callback",
        "https://checkout.dev.sesamy/*",
        "http://localhost:3000/api/signup",
        "https://127.0.0.1:3000",
        "http://local.sesamy.com:3000",
        "http://local.sesamy.com:3000/api/auth/callback",
        "https://local.sesamy.dev:3000",
        "https://local.sesamy.dev:3000/api/auth/callback",
        "https://host.docker.internal:3000/",
        "https://host.docker.internal:3000/api/auth/callback",
        "https://portal.sesamy.dev",
        "https://login2.sesamy.dev/link",
        "https://login2.sesamy.dev/sv/link",
        "https://login2.sesamy.dev/",
        "https://login2.sesamy.dev/sv/",
        "https://*.vercel.sesamy.dev/link",
        "https://*.vercel.sesamy.dev/sv/link",
        "http://localhost:3000/link",
        "http://localhost:3000/sv/link",
        "https://*.ngrok-free.app",
      ],
    },
    hostname: "auth.sesamy.dev",
    user_id: "email|65c4b9ffb6c3ddf42426a179",
    user_name: "ewa+999@sesamy.com",
    log_id: "90020240208113557443430000000000000001223372070390175898",
    _id: "90020240208113557443430000000000000001223372070390175898",
    isMobile: false,
  },
  {
    date: "2024-02-08T11:27:50.387Z",
    type: "s",
    connection: "google-oauth2",
    connection_id: "con_GLOKecZVpyI66e4M",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "79.117.180.97",
    user_agent: "Chrome 121.0.0 / Mac OS X 10.15.7",
    details: {
      prompts: [
        {
          name: "federated-authenticate",
          initiatedAt: 1707391668372,
          completedAt: 1707391669356,
          connection: "google-oauth2",
          connection_id: "con_GLOKecZVpyI66e4M",
          strategy: "google-oauth2",
          identity: "116939795296624035719",
          stats: {
            loginsCount: 12,
          },
          elapsedTime: 984,
        },
        {
          name: "login",
          flow: "universal-login",
          initiatedAt: 1707391668360,
          completedAt: 1707391669379,
          user_id: "google-oauth2|116939795296624035719",
          user_name: "guillermo@sesamy.com",
          timers: {
            rules: 826,
          },
          elapsedTime: 1019,
        },
      ],
      initiatedAt: 1707391668345,
      completedAt: 1707391670385,
      elapsedTime: 2040,
      session_id: "x_Z4L-2lhG0aLWRj8hjnEyRXjKoIiTp6",
      stats: {
        loginsCount: 12,
      },
    },
    hostname: "auth.sesamy.dev",
    user_id: "google-oauth2|116939795296624035719",
    user_name: "guillermo@sesamy.com",
    strategy: "google-oauth2",
    strategy_type: "social",
    log_id: "90020240208112750439547000000000000001223372070389262628",
    _id: "90020240208112750439547000000000000001223372070389262628",
    isMobile: false,
  },
  {
    date: "2024-02-08T10:33:22.122Z",
    type: "ssa",
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
    client_name: "Sesamy",
    ip: "90.160.207.97",
    user_agent: "Chrome 121.0.0 / Linux 0.0.0",
    details: {
      prompts: [],
      completedAt: 1707388402115,
      elapsedTime: null,
    },
    hostname: "auth.sesamy.dev",
    session_connection: "email",
    user_id: "auth0|65b7cd3139029699d18a5e41",
    user_name: "dan+456@sesamy.com",
    auth0_client: {
      name: "auth0.js",
      version: "9.24.1",
    },
    log_id: "90020240208103322189208000000000000001223372070383009959",
    _id: "90020240208103322189208000000000000001223372070383009959",
    isMobile: false,
  },
];
