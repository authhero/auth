export interface AdminUser {
  id: string;
  email?: string;
  tenantId: string;
  createdAt: string;
  modifiedAt: string;
  name?: string;
  role?: string;
  status?: string;
  picture?: string;
  locale?: string;
}
