export interface Application {
  id: string;
  name: string;
  tenantId: string;
  allowedWebOrigins: string;
  allowedCallbackUrls: string;
  allowedLogoutUrls: string;
  emailValidation: "enabled" | "disabled" | "enforced";
  // twoFactorAuthentication: "enabled" | "disabled" | "enforced";
  // enableSignup: boolean;
  clientSecret: string;
  created_at: string;
  modified_at: string;
}
