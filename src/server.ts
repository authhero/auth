import { Env } from "./types/Env";
import app from "./app";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import createAdapters from "./adapters/kysely";
import createR2Adapter from "./adapters/r2";
import { PlanetScaleDialect } from "kysely-planetscale";
import { getDb } from "./services/db";
import { vendorSettingsSchema } from "./types";
import sendEmail from "./services/email";

const DEFAULT_SESAMY_VENDOR = {
  name: "sesamy",
  logoUrl: `https://assets.sesamy.com/static/images/email/sesamy-logo.png`,
  style: {
    primaryColor: "#7D68F4",
    buttonTextColor: "#7D68F4",
    primaryHoverColor: "#7D68F4",
  },
  loginBackgroundImage: "",
  checkoutHideSocial: false,
  supportEmail: "support@sesamy.com",
  supportUrl: "https://support.sesamy.com",
  siteUrl: "https://sesamy.com",
  termsAndConditionsUrl: "https://store.sesamy.com/pages/terms-of-service",
  manageSubscriptionsUrl: "https://account.sesamy.com/manage-subscriptions",
};

const server = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const dialect = new PlanetScaleDialect({
      host: env.DATABASE_HOST,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD,
      fetch: (opts, init) =>
        fetch(new Request(opts, { ...init, cache: undefined })),
    });
    const db = getDb(dialect);

    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        data: {
          ...createAdapters(db),
          ...createR2Adapter(env),
        },
        sendEmail,
        fetchVendorSettings: async (vendor_id?: string) => {
          if (!vendor_id) {
            return DEFAULT_SESAMY_VENDOR;
          }

          try {
            const vendorSettingsRes = await fetch(
              `https://api.sesamy.dev/profile/vendors/${vendor_id}/style`,
            );

            const vendorSettingsRaw = await vendorSettingsRes.json();

            const vendorSettings =
              vendorSettingsSchema.parse(vendorSettingsRaw);

            return vendorSettings;
          } catch (e) {
            console.error(e);
            return DEFAULT_SESAMY_VENDOR;
          }
        },
      },
      ctx,
    );
  },
};

export default server;
