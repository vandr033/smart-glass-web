import { badgeBaseClassName } from "@/modules/commercial/ui";
import type { ClientStatus, ClientType } from "@/types";

import {
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
} from "./constants";

const statusClassNames: Record<ClientStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  BLOCKED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-stone-200 text-stone-700",
};

const typeClassNames: Record<ClientType, string> = {
  COMPANY: "bg-blue-100 text-blue-900",
  INDIVIDUAL: "bg-amber-100 text-amber-800",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`${badgeBaseClassName} ${statusClassNames[status]}`}>
      {CLIENT_STATUS_LABELS[status]}
    </span>
  );
}

export function ClientTypeBadge({ clientType }: { clientType: ClientType }) {
  return (
    <span className={`${badgeBaseClassName} ${typeClassNames[clientType]}`}>
      {CLIENT_TYPE_LABELS[clientType]}
    </span>
  );
}
