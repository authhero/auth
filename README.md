# tsoa-worker-template

A template for creating a tsoa project on cloudflare workers

The template generates routes for the tsoa-controllers.

It exposes the following endpoints in addition to the generated routes:

- /spec. The swagger.json document
- /doc. A swagger-ui for testing the routes

## Getting started

- Change the account_id and the name in the wrangler toml.
- Run `yarn` to install the dependencies
- Run `yarn dev` to start a debug session. This builds the paths and runs `wrangler dev`.
