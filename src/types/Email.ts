export type Email = {
  to: string;
  code: string;
  magicLink?: string;
  state?: string;
};
