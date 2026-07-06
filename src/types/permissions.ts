export interface PermissionCatalogItem {
  description: string;
  key: string;
  label: string;
}

export interface PermissionCatalogGroup {
  key: string;
  label: string;
  permissions: PermissionCatalogItem[];
}
