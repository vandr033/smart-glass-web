export interface AuthorizationSummary {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  roles: string[];
  userId: string;
}

export interface SidebarItem {
  icon: string;
  label: string;
  permission?: string;
  route: string;
}
