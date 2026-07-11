import { requireAnyPermission } from "@/lib/server-auth";
import TablerosHomePage from "@/modules/tableros/pages/home";

import {
  INDICADORES_PERMISSIONS,
  REPORTES_BI_PERMISSIONS,
  TABLEROS_PERMISSIONS,
} from "@/modules/tableros/constants";

export default async function TablerosPage() {
  await requireAnyPermission([
    TABLEROS_PERMISSIONS.ver,
    INDICADORES_PERMISSIONS.ver,
    REPORTES_BI_PERMISSIONS.ver,
    TABLEROS_PERMISSIONS.legadoVer,
  ]);

  return <TablerosHomePage />;
}
