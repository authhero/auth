import { Controller } from "@tsoa/runtime";

export function mockedController(): Controller {
  const headers = {};
  let _status: number | undefined;

  return {
    setHeader: (key: string, value: string | string[] | undefined) => {
      headers[key] = value;
    },
    getHeader: (key: string) => headers[key],
    setStatus: (status: number) => {
      _status = status;
    },
  } as unknown as Controller;
}
