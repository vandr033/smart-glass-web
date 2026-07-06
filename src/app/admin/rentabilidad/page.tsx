import { requirePermission } from "@/lib/server-auth";
import RentabilidadHomePage from "@/modules/project-profitability/pages/home";

export default async function RentabilidadPage() {
  await requirePermission("rentabilidad.ver");

  return <RentabilidadHomePage />;
}
