import { Controller } from "@tsoa/runtime";

export function controllerFixture(): Controller {
  const headers: { [key: string]: any } = {};
  let _status: number | undefined;

  return {
    setHeader: (key: string, value: string | string[] | undefined) => {
      headers[key] = value;
    },
    getHeader: (key: string) => headers[key],
    setStatus: (status: number) => {
      _status = status;
    },
    getStatus: () => _status,
  } as unknown as Controller;
}
