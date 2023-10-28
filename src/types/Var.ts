export type Var = {
  vendorId: string;
  startAt: number;
  user: {
    sub: string;
    permissions: string[];
  };
};
