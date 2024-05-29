import { VendorSettings } from "../../src/types";

export const FOKUS_VENDOR_SETTINGS: VendorSettings = {
  name: "Fokus",
  logoUrl:
    "https://cdn.fokus.se/app/uploads/fokus/2022/05/12214931/fokus-logo.svg",
  style: {
    primaryColor: "#D62802",
    buttonTextColor: "#ffffff",
    primaryHoverColor: "#FD3307",
  },
  loginBackgroundImage:
    "https://cdn.fokus.se/app/uploads/fokus/2021/04/06160810/egenannons-digital.jpg",
  checkoutHideSocial: false,
  supportEmail: null,
  supportUrl: null,
  siteUrl: null,
  termsAndConditionsUrl: null,
};

export const BREAKIT_VENDOR_SETTINGS: VendorSettings = {
  name: "Breaking Media AB",
  companyName: "Breaking Media AB",
  logoUrl: "https://assets.sesamy.com/logos/breakit.svg",
  style: {
    primaryColor: "#045747",
    buttonTextColor: "#ffffff",
    primaryHoverColor: "#056855",
  },
  loginBackgroundImage:
    "https://assets.sesamy.com/static/vendors/breakit/breakit_bg.jpg",
  checkoutHideSocial: false,
  supportEmail: "premium@breakit.se",
  supportUrl: "https://www.breakit.se/kontakta-oss",
  siteUrl: "https://www.breakit.se/",
  termsAndConditionsUrl: "https://www.breakit.se/anvandarvillkor",
};

export const KVARTAL_VENDOR_SETTINGS: VendorSettings = {
  name: "Kvartal",
  companyName: "Kvartal",
  logoUrl: "https://checkout.sesamy.com/images/kvartal-logo.svg",
  style: {
    primaryColor: "#4F3985",
    buttonTextColor: "#ffffff",
    primaryHoverColor: "#5F44A0",
  },
  loginBackgroundImage:
    "https://assets.sesamy.com/vendors/kvartal/kvartal-bg.jpg",
  checkoutHideSocial: true,
  supportEmail: "support@kvartal.se",
  supportUrl: "https://kvartal.se/kundtjanst",
  siteUrl: "https://kvartal.se",
  termsAndConditionsUrl: "https://kvartal.se/kopvillkor/",
};

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
