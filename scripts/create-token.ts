import { getAdminToken } from "../integration-test/helpers/token";

getAdminToken().then((token) => console.log(`Token: ${token}`));
