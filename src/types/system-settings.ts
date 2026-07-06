import type { LogJsonValue } from "./logs";

export interface SystemSettingRecord {
  createdAt: string;
  description: string | null;
  id: string;
  key: string;
  updatedAt: string;
  valueJson: LogJsonValue;
}
