# Authhero Auth

This is a work in progress and still evolving.

The plan is to make an oauth2 compatible auth solution with support for the following login methods:

- Email/password
- Social (Google, Facebook, Apple)
- Magic link
- Code

After having been burnt by several freemium model auth solutions that get too expensive once you start growing the user base I wanted a solution where you can get started with a hosted solution but also easily can eject and host it yourself straight.

This service can be hosted on-premise in your own cloud or on a serverless platform such as Cloudflare workers. It uses adapters for different storage providers, but by default it uses SQL storage such as Postgres, MySql or SQLite.

It's based on the following tech stack

- Typescript with the hono router
- MailChannels or Mailgun for password reset and code/magic links

It contains a hosted UI for the login forms that can be easily styled or modified using liquid templates. Or you can roll your own UI and just use the API.

## Auth0 compatibility

The goal is to keep the API compatible with the auth0 API so that all the client libraries from auth0 work and any exising intergrations with the management API keeps working. This way there's no need to maintain a separate set of client libraries and it makes the migration from auth0 very easy.

## Tokens

The service keeps a set of JWKS keys stored that are used to validate tokens. The tokens are rotated once per day using a cron event, with the last two keys available.

The tokens are exposed at: `/.well-known/jwks.json`

## Getting started

The easiest way to get started is to run a server locally with bun. This will start a server with a Sqlite database.

```bash
yarn
bun scritps/init-sqlite.ts
bun dev
```

Open the browser at `http://localhost:3000/docs` and you should see the swagger documentation. You can authenticate using the username `admin` and the password `admin`.

## Open login form

The test endpoint will initiate a login flow and redirect to the login form. This endpoint is only for demo purposes and should be removed in production.

```

https://authhe.ro/test

```

# Login methods

A user account can be created using email/password, code, magic links or using social accounts such as Google or Facebook.

## Social logins

Any oauth2 or OIDC accounts should work just fine.

The flow for login in with an oauth2 account is as follows:

- The user navigates to the /authorize endpoint with a connection parameter matching the oauth2 provider.
- The user is redirected to the login form.
- Once the user signs in the user is redirected to the /callback endpoint

When an oauth2 flow is initiated a state is passed from the client. Once the user is redirected back to the callback endpoint after a successful login the state passed in the query string is compared to the persisted state. If it matches the code is resolved to an access token using the client secret.

The access token is used to query the profile endpoint and sync the user profile information.

# Client libraries

## @auth0/auth0-react

The auth0-react uses the universal login with PKCE flow:

- When the user logs in the client passes a state, a nonce and a code challenge to the /authorize endpoint using a CodeGrant flow.
- Once the user is logged in it is redirected to the callback endpoint with the state and the code.
- The client validates that the state matches the one passed in the query string.
- The code is resolved to an access token and an id_token using the /token endpoint
- The id token is validated using the JWKS keys and the nonce is validated.

## @auth0/auth0-nextjs

The `auth0-nextjs` library uses the universal login with a Code Grant Flow.

- The client queries the open ID configuration endpoint (`/.well-known/openid-configuration`) to get information about the available endpoints.
- The browser is redirected to the universal auth login with a Code flow
- After successful authentication, the browser is redirected back to the Nextjs callback URL (`/api/auth/callback`)
- The Nextjs API route calls the token endpoint (/token) to get a set of tokens. Nextjs generates a session cookie that is passed back to the client

# API authentication

The management API can use any oauth2-compatible auth server that exposes public jwks-keys. You can either use a separate auth0 tenant or use one of the tenants created as part of this service. It should also work with for instance cognito from AWS.
