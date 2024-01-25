export type Var = {
  vendorId: string;
  startAt: number;
  email: string;
  userId: string;
  tenantId: string;
  log: string;
  logType: string;
  client_id: string;
  description: string;
  user: {
    sub: string;
    azp: string;
    permissions: string[];
  };
};
