import { z } from "zod";

export const totalsSchema = z.object({
  start: z.number(),
  limit: z.number(),
  length: z.number(),
});

export interface Totals {
  start: number;
  limit: number;
  length: number;
}
