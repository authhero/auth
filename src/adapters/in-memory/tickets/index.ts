import { create } from "./create";
import { TicketsAdapter } from "../../interfaces/Tickets";
import { Ticket } from "../../../types/Ticket";
import { get } from "./get";

export function createTicketsAdapter(): TicketsAdapter {
  const ticketsStorage: Ticket[] = [];

  return {
    create: create(ticketsStorage),
    get: get(ticketsStorage),
  };
}
