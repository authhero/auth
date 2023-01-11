# Cloudworker auth

This is work in progress and not yet ready for even testing.

The plan is to make a oauth2 compatible auth solution with support for the following login methods:

- Email/password
- Social (google, facebook, apple)
- Magic link
- Code

After having been burnt by several freemium model auth solutions that get too expensive once you start growing the user base I wanted a solution where you easily can eject and host it straight on Cloudflare.

It's based on the following tech stack

- Cloudflare workers (with tsoa)
- Durable objects and KV for storage
- Mailchannels for passoword reset and code/magic links

It's API only, so bring your own UI :)

## Tokens

The service keeps a set of JWKS keys stored in KV storage that are used to validate tokens. The tokens are rotated once per day using a cron event, with the last two keys available.

The tokens are exposed at: `/.well-known/jwks.json`

## Getting started

- Change the account_id and the name in the wrangler TOML.
- Run `yarn` to install the dependencies
- Run `yarn dev` to start a debug session. This builds the paths and runs `wrangler dev`.

## Limitations

- Currently, there is only support for one client

## TODO-list

– [x] Exposing JWKS-keys

– [x] Register / Login with email and password

– [x] Using bcrypt for password

– [x] Support passwordless with email (code)

– [ ] Password reset flows

– [ ] Sync users to D1 database for queries

– [ ] Logs per user

– [ ] Rate-limits

– [ ] Social logins

– [ ] Support passwordless with email (magic link)

– [ ] 2-factor auth

– [ ] Refresh tokens flow

– [ ] Client Credentials flow

– [ ] PKCE

- [ ] Silent authentication
