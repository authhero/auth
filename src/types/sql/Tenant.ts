import { z } from "zod";
import { baseEntitySchema } from "../BaseEntity";

export const tenantInsertSchema = z.object({
  name: z.string(),
  audience: z.string(),
  sender_email: z.string().email(),
  sender_name: z.string(),
  support_url: z.string().url().optional(),
  logo: z.string().url().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  language: z.string().optional(),
});

export const tenantSchema = tenantInsertSchema.extend(baseEntitySchema.shape);

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
  supportEmail?: string | null;
  supportUrl?: string | null;
  name: string;
  showGreyishBackground?: boolean;
  termsAndConditionsUrl?: string | null;
  companyName?: string;
  checkoutHideSocial?: boolean;
  siteUrl?: string | null;
  invoiceInfo?: {
    selfHandlesVat: boolean;
    invoiceAddress: {
      country: string;
      zipCode: string;
      city: string;
      street: string;
    };
    taxId: string;
  };
  manageSubscriptionsUrl?: string;
};
