# Cloudworker auth

This is oauth2 compatible auth solution with support for the following login methods:

- Email/password
- Social (google, facebook, apple)
- Magic link
- Code

It's based on the following tech stack

- Cloudflare workers (with tsoa)
- Durable objects, KV and R2 for storage
- Queues for storing logs to R2
- Mailchannels for passoword reset and code/magic links

It's API only, so bring your own UI :)

## Tokens

The service keeps a set of JWKS keys stored in KV storage that are used to validate tokens. The tokens are rotated once per day using a cron event, with the last two keys available.

The tokens are exposed at: `/.well-known/jwks.json`

## Getting started

- Change the account_id and the name in the wrangler TOML.
- Run `yarn` to install the dependencies
- Run `yarn dev` to start a debug session. This builds the paths and runs `wrangler dev`.

## Building blocks
