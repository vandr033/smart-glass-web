export interface EnabledModule {
  description: string | null;
  icon: string | null;
  key: string;
  label: string;
  requiredPermission: string | null;
  route: string;
  sortOrder: number;
}
