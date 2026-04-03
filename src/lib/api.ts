let _baseUrl = "/iris-table-stats/api";

export function setApiBaseUrl(url: string) {
  _baseUrl = url;
}

export function getApiBaseUrl() {
  return _baseUrl;
}

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

export interface PersistentClassColumnStats {
  name: string;
  type: string;
  populatedCount: number;
  emptyCount: number;
  populatedPercent: number;
  emptyPercent: number;
}

export interface PersistentClassStatsResponse {
  namespace: string;
  className: string;
  totalRows: number;
  columns: PersistentClassColumnStats[];
}

export async function fetchClassStats(className: string): Promise<PersistentClassStatsResponse> {
  const res = await fetch(`${_baseUrl}/classes/${encodeURIComponent(className)}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export async function fetchClasses(
  limit = 200,
  offset = 0,
  pkg?: string,
  includeSystem = false,
  includeMapped = false,
): Promise<PersistentClassListResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (pkg) params.set("package", pkg);
  params.set("includeSystem", String(includeSystem));
  params.set("includeMapped", String(includeMapped));
  const res = await fetch(`${_baseUrl}/classes?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch classes: ${res.status}`);
  return res.json();
}

export async function fetchEmptyRecords(
  className: string,
  columnName: string,
  limit = 100,
  offset = 0,
): Promise<PersistentClassDataResponse> {
  const params = new URLSearchParams({ columnName, limit: String(limit), offset: String(offset) });
  const res = await fetch(`${_baseUrl}/classes/${encodeURIComponent(className)}/empty-records?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch empty records: ${res.status}`);
  return res.json();
}

export async function fetchClassData(className: string, limit = 100, offset = 0): Promise<PersistentClassDataResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${_baseUrl}/classes/${encodeURIComponent(className)}/data?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  return res.json();
}
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${_baseUrl}/classes/${encodeURIComponent(className)}/data?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  return res.json();
}
