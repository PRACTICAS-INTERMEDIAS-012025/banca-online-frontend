import { ROLES_DB_IDS } from "./consts";

export const loginRoleRedirectMappings = {
  [ROLES_DB_IDS.ADMIN]: "/admin/inicio",
  [ROLES_DB_IDS.CASHIER]: "/cajero/inicio",
  [ROLES_DB_IDS.CLIENT]: "/dashboard/inicio",
};
