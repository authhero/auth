import { VendorSettings, vendorSettingsSchema, Env } from "../types";

// there is no Sesamy vendor settings... we have this on login2 as a fallback and I think there's
// some interaction with "dark mode"
// But I don't want to have a Sesamy vendor on auth2
export const SESAMY_VENDOR_SETTINGS: VendorSettings = {
  name: "sesamy",
  logoUrl: `https://assets.sesamy.com/static/images/email/sesamy-logo.png`,
  style: {
    primaryColor: "#7D68F4",
    buttonTextColor: "#FFFFFF",
    primaryHoverColor: "#A091F2",
  },
  loginBackgroundImage: "",
  checkoutHideSocial: false,
  supportEmail: "support@sesamy.com",
  supportUrl: "https://support.sesamy.com",
  siteUrl: "https://sesamy.com",
  termsAndConditionsUrl: "https://store.sesamy.com/pages/terms-of-service",
  manageSubscriptionsUrl: "https://account.sesamy.com/manage-subscriptions",
};

export async function fetchVendorSettings(
  env: Env,
  client_id?: string,
  vendor_id?: string,
) {
  if (!vendor_id && !client_id) {
    return SESAMY_VENDOR_SETTINGS;
  }

  const vendorId = vendor_id || client_id;

  try {
    const vendorSettingsRes = await fetch(
      `${env.API_URL}/profile/vendors/${vendorId}/style`,
    );

    const vendorSettingsRaw = await vendorSettingsRes.json();

    const vendorSettings = vendorSettingsSchema.parse(vendorSettingsRaw);

    return vendorSettings;
  } catch (e) {
    console.error(e);
    return SESAMY_VENDOR_SETTINGS;
  }
}
