import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Portal del Cliente | Vidriera Sebitas ERP",
};

export default function PortalClienteRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
