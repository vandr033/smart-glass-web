import { requirePermission } from "@/lib/server-auth";
import MeasurementsHomePage from "@/modules/measurements/pages/home";

export default async function MeasurementsRoutePage() {
  await requirePermission("mediciones.ver");

  return <MeasurementsHomePage />;
}
