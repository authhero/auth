import { Ticket } from "../../../types/Ticket";

export function create(ticektsStorage: Ticket[]) {
  return async (ticket: Ticket): Promise<void> => {
    ticektsStorage.push(ticket);
  };
}
