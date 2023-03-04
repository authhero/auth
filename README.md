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
- D1 sqlite database for admin api
- KV storage for logs
- Mailchannels for passoword reset and code/magic links

It contains a hosted UI for the login forms that can be easily styled or modified using liquid templates. Or you can roll your own UI and just use the the API.

## Auth0 compability

The goal is to keep the API compatible with the auth0 api so that all the client libraries from auth0 works. This way there's no need to maintain a separate set of client libraries and it makes the migration from auth0 very easy.

## Tokens

The service keeps a set of JWKS keys stored in KV storage that are used to validate tokens. The tokens are rotated once per day using a cron event, with the last two keys available.

The tokens are exposed at: `/.well-known/jwks.json`

## Getting started

- Change the account_id and the name in the wrangler TOML.
- Run `yarn` to install the dependencies
- Run `yarn dev` to start a debug session. This builds the paths and runs `wrangler dev`.

## Open login form

```
https://cloudworker-auth.sesamy-dev.workers.dev/authorize?client_id=default&redirect_uri=https://cloudworker-auth.sesamy-dev.workers.dev/info&scope=profile%20email%20openid&state=1234&response_type=implicit&username=test@example.com
```

# Login methods

A user account can be created using email/password, code, magiclinks or using social accounts such as Google or Facebook.

## Social logins

Any oauth2 or openid-connect accounts should work just fine.

The flow for login in with an oauth2 account is as follows:

- The user navigates to the /authorize endpoint with a connection parameter matching the oauth2 provider.
- The user is redirected to the login form.
- Once the user signs in the user are redirected to the /callback endpoint

When an oauth2 flow is initiated a state is passed from the client. Once the user is redirected back to the callback endpoint after a successful login the state passed in the query string is compared to the persisted state. If it matches the code is resolved to an access token using the client secret.

The access token is used to query the profile endpoint and sync the user profile information.

# Clients

A client is for now a completely separate authentication service, similar to the tenants in auth0.

# Linking accounts

Each user object is connected to one email, so for instance, there would be one common user object for a user that logged in with email/password, code and google. The user object will keep an array of the login methods and store separate profiles for syncing purposes.

# Limitations

- Currently, there is only support for one client

# TODO-list

– [x] Exposing JWKS-keys

– [x] Register / Login with email and password

– [x] Using bcrypt for password

– [x] Support passwordless with email (code)

– [ ] Password reset flows

– [x] Sync users to D1 database for queries

– [ ] Logs per user

– [ ] Rate-limits

– [ ] Social logins

– [ ] Support passwordless with email (magic link)

– [ ] 2-factor auth

– [ ] Refresh tokens flow

– [ ] Client Credentials flow

– [ ] PKCE

- [ ] Silent authentication
