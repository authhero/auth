import { generateRoutes, generateSpec } from "tsoa";
import { readFile, writeFile } from "fs/promises";

(async () => {
  const specOptions = {
    noImplicitAdditionalProperties: "throw-on-extras",
    entryFile: "./src/server.ts",
    basePath: "/",
    specVersion: 3,
    outputDirectory: "./build",
    controllerPathGlobs: [
      "src/routes/tsoa/*.ts",
      "src/routes/management-api/*.ts",
    ],
    securityDefinitions: {
      oauth2managementApi: {
        type: "oauth2",
        description: "This API uses OAuth 2 with the implicit flow",
        flows: {
          implicit: {
            authorizationUrl:
              process.env.NODE_ENV === "production"
                ? "https://token.sesamy.com/authorize"
                : "https://token.sesamy.dev/authorize",
            scopes: {
              openid: "Basic user information",
              email: "User email",
              profile: "User profile information",
            },
          },
        },
      },
      oauth2: {
        type: "oauth2",
        description: "This API uses OAuth 2 with the implicit flow",
        flows: {
          implicit: {
            authorizationUrl:
              process.env.NODE_ENV === "production"
                ? "https://token.sesamy.com/authorize"
                : "https://token.sesamy.dev/authorize",
            scopes: {
              openid: "Basic user information",
              email: "User email",
              profile: "User profile information",
            },
          },
        },
      },
    },
  };

  const routeOptions = {
    noImplicitAdditionalProperties: "throw-on-extras",
    entryFile: "./src/server.ts",
    routesDir: "./build",
    controllerPathGlobs: [
      "src/routes/tsoa/*.ts",
      "src/routes/management-api/*.ts",
    ],
    authenticationModule: "./src/authentication.ts",
    middlewareTemplate: "node_modules/tsoa-hono/hono-router.hbs",
  };

  await generateSpec(specOptions);

  await generateRoutes(routeOptions);

  // Add support for x-www-form-urlencoded content. Currently not supported in tsoa
  const swaggerPath = `${specOptions.outputDirectory}/swagger.json`;
  const specFile = await readFile(swaggerPath);
  const spec = JSON.parse(specFile.toString());

  const tokenContent = spec.paths["/oauth/token"].post.requestBody.content;
  tokenContent["application/x-www-form-urlencoded"] =
    tokenContent["application/json"];

  await writeFile(swaggerPath, JSON.stringify(spec, null, 2));
})();
