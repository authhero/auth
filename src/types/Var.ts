export type Var = {
  vendorId: string;
  startAt: number;
  email: string;
  userId: string;
  log: string;
  user: {
    sub: string;
    permissions: string[];
  };
};
