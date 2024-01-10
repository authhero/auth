import { getAdminToken } from "../test/integration/helpers/token";

getAdminToken().then((token) => console.log(`Token: ${token}`));
