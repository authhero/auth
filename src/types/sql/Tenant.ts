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
  showGreyishBackground?: boolean;
  termsAndConditionsUrl?: string;
};
