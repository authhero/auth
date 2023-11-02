import { Ticket } from "../../types/Ticket";

export interface TicketsAdapter {
  create: (ticket: Ticket) => Promise<void>;
  get: (tenant_id: string, id: string) => Promise<Ticket | null>;
}
