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

export const vendorSettingsSchema = z.object({
  logoUrl: z.string(),
  loginBackgroundImage: z.string().optional(),
  style: z.object({
    primaryColor: z.string(),
    buttonTextColor: z.string(),
    primaryHoverColor: z.string(),
  }),
  supportEmail: z.string().nullable(),
  supportUrl: z.string().nullable(),
  name: z.string(),
  showGreyishBackground: z.boolean().optional(),
  termsAndConditionsUrl: z.string().nullable(),
  companyName: z.string().optional(),
  checkoutHideSocial: z.boolean().optional(),
  siteUrl: z.string().nullable(),
  invoiceInfo: z
    .object({
      selfHandlesVat: z.boolean(),
      invoiceAddress: z.object({
        country: z.string(),
        zipCode: z.string(),
        city: z.string(),
        street: z.string(),
      }),
      taxId: z.string(),
    })
    .optional(),
  manageSubscriptionsUrl: z.string().optional(),
});

export type VendorSettings = z.infer<typeof vendorSettingsSchema>;
