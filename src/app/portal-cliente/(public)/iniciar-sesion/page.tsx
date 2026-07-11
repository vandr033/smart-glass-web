import { Suspense } from "react";

import { PortalLoginForm } from "@/modules/client-portal/auth-forms";

export default function PortalLoginPage() {
  return (
    <Suspense>
      <PortalLoginForm />
    </Suspense>
  );
}
