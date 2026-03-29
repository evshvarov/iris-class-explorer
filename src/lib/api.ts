const BASE_URL = "https://iris-table-stats.sandbox.developer.intersystems.com/iris-table-stats/api";

export interface PersistentClassInfo {
  name: string;
  description: string;
  sqlSchemaName: string;
  sqlTableName: string;
}

export interface PersistentClassListResponse {
  namespace: string;
  items: PersistentClassInfo[];
  count: number;
  limit: number;
  offset: number;
}

export interface PersistentClassDataResponse {
  namespace: string;
  className: string;
  items: Record<string, unknown>[];
  count: number;
  limit: number;
  offset: number;
}

export async function fetchClasses(limit = 200, offset = 0, pkg?: string): Promise<PersistentClassListResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (pkg) params.set("package", pkg);
  const res = await fetch(`${BASE_URL}/classes?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch classes: ${res.status}`);
  return res.json();
}

export async function fetchClassData(className: string, limit = 100, offset = 0): Promise<PersistentClassDataResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${BASE_URL}/classes/${encodeURIComponent(className)}/data?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  return res.json();
}
