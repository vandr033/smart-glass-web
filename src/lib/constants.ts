const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const backendBase = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

// Route frontend traffic through Next so auth cookies stay on the app domain in production.
const authBaseUrl = `${appBaseUrl}/api/auth`;
const apiBaseUrl = `${appBaseUrl}/api`;

export const APP_CONFIG = {
  appBaseUrl,
  authBaseUrl,
  backendBaseUrl: backendBase,
  name: "Smart Glass Bolivia ERP",
  description:
    "ERP industrial para operaciones comerciales, compras, produccion e inventario.",
  apiBaseUrl,
  apiTimeoutMs: 10000,
} as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 10,
} as const;

export const QUERY_KEYS = {
  authSession: ["auth", "session"] as const,
  authorization: ["authorization", "me"] as const,
  currentUser: ["me"] as const,
  health: ["health"] as const,
  modules: ["modules"] as const,
  permissionCatalog: ["permissions", "catalog"] as const,
  profile: ["profile"] as const,
  settings: ["settings"] as const,
  systemSettings: ["system-settings"] as const,
  notifications: ["notifications"] as const,
  invitationPreview: (token: string) => ["invitations", "preview", token] as const,
  invitations: ["invitations"] as const,
  activityLogUsers: ["activity-logs", "users"] as const,
  auditLogUsers: ["audit-logs", "users"] as const,
  roleDetails: (roleId: string) => ["roles", "detail", roleId] as const,
  roleOptions: ["roles", "options"] as const,
  userOptions: ["users", "options"] as const,
  users: ["users"] as const,
  userDetails: (userId: string) => ["users", "detail", userId] as const,
  roles: ["roles"] as const,
  permissions: ["permissions"] as const,
} as const;
