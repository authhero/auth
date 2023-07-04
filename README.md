# Cloudworker auth

This is work in progress and not yet ready for even testing.

The plan is to make a oauth2 compatible auth solution with support for the following login methods:

- Email/password
- Social (google, facebook, apple)
- Magic link
- Code

After having been burnt by several freemium model auth solutions that get too expensive once you start growing the user base I wanted a solution where you can get started with a hosted solution but alos easily can eject and host it yourself straight on Cloudflare.

It's based on the following tech stack

- Cloudflare workers (with tsoa)
- Durable objects (with trpc) for login logic and storage
- Cloudflare queues for events
- D1 sqlite database for admin API
- KV storage for logs
- Mailchannels for password reset and code/magic links

It contains a hosted UI for the login forms that can be easily styled or modified using liquid templates. Or you can roll your own UI and just use the the API.

## Auth0 compability

The goal is to keep the API compatible with the auth0 API so that all the client libraries from auth0 work. This way there's no need to maintain a separate set of client libraries and it makes the migration from auth0 very easy.

## Tokens

The service keeps a set of JWKS keys stored in KV storage that are used to validate tokens. The tokens are rotated once per day using a cron event, with the last two keys available.

The tokens are exposed at: `/.well-known/jwks.json`

## Getting started

- Change the account_id and the name in the wrangler TOML.
- Run `yarn` to install the dependencies
- Run `yarn dev` to start a debug session. This builds the paths and runs `wrangler dev`.

## Open login form

The test endpoint will initiate a login flow and redirect to the login form. This endpoint is only for demo purposes and should be removed in production.

```
https://cloudworker-auth.sesamy-dev.workers.dev/test
```

# Login methods

A user account can be created using email/password, code, magic links or using social accounts such as Google or Facebook.

## Social logins

Any oauth2 or openid-connect accounts should work just fine.

The flow for login in with an oauth2 account is as follows:

- The user navigates to the /authorize endpoint with a connection parameter matching the oauth2 provider.
- The user is redirected to the login form.
- Once the user signs in the user are redirected to the /callback endpoint

When an oauth2 flow is initiated a state is passed from the client. Once the user is redirected back to the callback endpoint after a successful login the state passed in the query string is compared to the persisted state. If it matches the code is resolved to an access token using the client secret.

The access token is used to query the profile endpoint and sync the user profile information.

# Data storage

Cloudflare provides different storage options that have different tradeoffs.

For real-time requests such as user authentication, it's important to have low latency and high throughput which makes KV storage and durable objects a good fit. KV storage has global replication and is eventually consistent which makes it a good fit for storing data that doesn't need to be consistent in real-time, such as encryption keys and other configurations. We for instance use KV storage to store the client configurations that are fetched on almost every request.

Durable objects are a good fit for storing user data and other data that needs to be consistent, which makes them a great fit for storing user data. They can also provide a small, readable wrapper around sensitive data making sure that there's no way to access the data without going through the API. We use durable objects to store user data and session state.

SQLite provides a way of querying data for the admin API. It's currently not replicated and doesn't scale the same way as KV storage and durable objects, but it's a good fit for the admin API.

# Entities

## SQL Entities

### Tenant

The tenant is the root entity that contains all the other entities. It contains all common information such as the name, the logo, the email templates and the client configurations.

### Auth Providers

The auth providers define the available ways of logging in to the tenant, such as Google or Facebook. They contain the configuration for the different login methods such as the client id and the client secret.

### Applications

The applications are the clients that can use the API. They contain the client id and the client secret that is used to authenticate the client. The applications are stored as snapshots in KV storage together with data from tenants as the `Client` entity.

### Users

The users contain a limited set of information such as the user id and email. The purpose of this entity is to provide a way for administrators to query users, but any real-time requests should use the durable objects entity.

### User Tenants

This entity is used to specify any permissions that a user has on a tenant.

## KV Entities

### Certificates

The certificates are stored in KV storage and are used to sign the tokens. They are rotated once per day and the last two certificates are kept in storage.

### Clients

The clients are stored in KV storage and contain the client id and the client secret. They are stored as snapshots together with the tenant data.

## Durable Objects Entities

### Users

The users are stored in durable objects and contain the user profile and the login methods. When a user is updated it sends a message to the user queue to sync the user data to the SQLite database.

# Linking accounts

Each user object is connected to one email, so for instance, there would be one common user object for a user that logged in with email/password, code and google. The user object will keep an array of the login methods and store separate profiles for syncing purposes.

# API Authentication

The auth service uses any oauth2 service for authentication of the API endpoint. If a user creates a tenant the user is granted admin privileges for this tenant.

# Client libraries

## @auth0/auth0-react

The auth0-react uses the universal login with PKCE flow:

- When the user logs in the client passes a state, a nonce and a code challenge to the /authorize endpoint using a CodeGrant flow.
- Once the user logged in it is redirected to the callback endpoint with the state and the code.
- The client validates that the state matches the one passed in the query string.
- The code is resolved to an access token and an id token using the /token endpoint
- The id token is validated using the JWKS keys and the nonce is validated.

## @auth0/auth0-nextjs

This library currently doesn't work due to a missing state cookie

The auth0-nextjs library uses the universal login with a Code Grant Flow.

- The client queries the open ID configuration endpoint (/.well-known/openid-configuration) to get information about the available endpoints.
- The browser is redirected to the universal auth login with a Code flow
- After a successful authentication the browser is redirected back to the nextjs callback url (/api/auth/callback)
- The nextjs api route calls the token endpoint (/token) to get a set of tokens. Nextjs generates a session cookie that is passed back to the client
