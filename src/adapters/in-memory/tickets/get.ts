import { Ticket } from "../../../types/Ticket";

export function get(ticketsStorage: Ticket[]) {
  return async (tenant_id: string, id: string): Promise<Ticket | null> => {
    return (
      ticketsStorage.find(
        (ticket) => ticket.tenant_id === tenant_id && ticket.id === id,
      ) || null
    );
  };
}
