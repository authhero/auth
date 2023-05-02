export interface User {
  id: string;
  email: string;
  tenantId: string;
  createdAt: string;
  modifiedAt: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
}
