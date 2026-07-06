import type { EnabledModule } from "./modules";

export interface CurrentUserPayload {
  enabledModules: EnabledModule[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  roles: string[];
  user: {
    avatar: string | null;
    email: string;
    id: string;
    isActive: boolean;
    name: string;
  };
}
