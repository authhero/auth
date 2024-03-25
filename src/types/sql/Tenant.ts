export interface Tenant {
  id: string;
  name: string;
  audience: string;
  sender_email: string;
  sender_name: string;
  support_url?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}

// we really do not want to be doing this BUT until we have this info in auth2... unduplicated... then we need these
type StyleType = {
  primaryColor: string;
  buttonTextColor: string;
  primaryHoverColor: string;
};

export type VendorSettings = {
  logoUrl: string;
  loginBackgroundImage?: string;
  style: StyleType;
  supportEmail: string;
  supportUrl: string;
  name: string;
  // this is a hack pending putting Sesamy styles as a vendor style
  showGreyishBackground?: boolean;
  termsAndConditionsUrl?: string;
};
