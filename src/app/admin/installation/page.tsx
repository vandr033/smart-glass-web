import { requirePermission } from "@/lib/server-auth";
import InstallationHomePage from "@/modules/installation/pages/home";

export default async function InstallationRoutePage() {
  await requirePermission("installations.view");

  return <InstallationHomePage />;
}
