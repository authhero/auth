/**
 * Durable object to create a consistent storage
 */
export class User implements DurableObject {
  state: DurableObjectState;
  codeData?: string;

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      this.codeData = await this.state.storage.get<string>("codeData");
      // After initialization, future reads do not need to access storage.
    });
  }

  async fetch(request: Request) {
    switch (request.method) {
      case "GET":
        return new Response(this.codeData);
      case "DELETE":
        delete this.codeData;
        await this.state.storage.deleteAll();
        return new Response(null, { status: 204 });
      case "PUT":
        const body = await request.text();
        this.codeData = body;
        await this.state.storage.put("codeData", this.codeData);
        return new Response(null, { status: 204 });
      default:
        return new Response("Invalid method", {
          status: 405,
        });
    }
  }
}
