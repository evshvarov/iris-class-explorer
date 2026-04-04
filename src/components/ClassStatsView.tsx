import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClassStats, fetchEmptyRecords, type PersistentClassColumnStats } from "@/lib/api";
import { Loader2, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ClassStatsViewProps {
  className: string;
}

export default function ClassStatsView({ className }: ClassStatsViewProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["iris-class-stats", className],
    queryFn: () => fetchClassStats(className),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["iris-class-stats", className] });
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading stats…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm">
        <span className="text-destructive">Failed to load stats</span>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const sorted = [...(data.columns ?? [])].sort(
    (a, b) => b.populatedPercent - a.populatedPercent
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="text-xs text-muted-foreground font-mono">
          {data.totalRows} total rows · {data.columns?.length ?? 0} columns
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-7 text-xs"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Update Stats
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-3 max-w-2xl">
          {sorted.map((col) => (
            <div key={col.name}>
              <ColumnStatRow
                col={col}
                isExpanded={expandedColumn === col.name}
                onToggleEmpty={() =>
                  setExpandedColumn(expandedColumn === col.name ? null : col.name)
                }
              />
              {expandedColumn === col.name && col.emptyCount > 0 && (
                <EmptyRecordsPanel
                  className={className}
                  columnName={col.name}
                  onClose={() => setExpandedColumn(null)}
                />
              )}
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No column stats available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnStatRow({
  col,
  isExpanded,
  onToggleEmpty,
}: {
  col: PersistentClassColumnStats;
  isExpanded: boolean;
  onToggleEmpty: () => void;
}) {
  const pct = Math.round(col.populatedPercent * 100) / 100;
  const color =
    pct >= 90
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-foreground">{col.name}</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {col.type}
          </span>
        </div>
        <span className="font-mono text-xs font-semibold text-foreground">
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
        <span>{col.populatedCount} populated</span>
        {col.emptyCount > 0 ? (
          <button
            onClick={onToggleEmpty}
            className="flex items-center gap-0.5 text-destructive hover:underline cursor-pointer"
          >
            {col.emptyCount} empty
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <span>{col.emptyCount} empty</span>
        )}
      </div>
    </div>
  );
}

const EMPTY_PAGE_SIZE = 50;

function EmptyRecordsPanel({
  className,
  columnName,
  onClose,
}: {
  className: string;
  columnName: string;
  onClose: () => void;
}) {
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["iris-empty-records", className, columnName, offset],
    queryFn: () => fetchEmptyRecords(className, columnName, EMPTY_PAGE_SIZE, offset),
  });

  const columns = data?.items?.length ? Object.keys(data.items[0]) : [];

  const handleExportCsv = () => {
    if (!data?.items?.length) return;
    const cols = Object.keys(data.items[0]);
    const escape = (v: unknown) => {
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(","), ...data.items.map(r => cols.map(c => escape(r[c])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${className}_empty_${columnName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-1 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">
          Records with empty <span className="font-mono text-primary">{columnName}</span>
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleExportCsv} disabled={!data?.items?.length} className="h-6 px-1.5 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-xs">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive py-4 text-center">Failed to load empty records</div>
      )}

      {data && columns.length > 0 && (
        <>
          <div className="overflow-auto max-h-64 rounded border border-border">
            <table className="w-full min-w-max border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-1.5 text-left font-mono font-medium text-primary/80 whitespace-nowrap bg-muted border-b border-border"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[200px] truncate text-foreground"
                      >
                        {row[col] == null ? (
                          <span className="text-muted-foreground/50 italic">null</span>
                        ) : typeof row[col] === "object" ? (
                          JSON.stringify(row[col])
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              {data.count} records · {offset + 1}–{Math.min(offset + EMPTY_PAGE_SIZE, data.count)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - EMPTY_PAGE_SIZE))}
                className="h-6 px-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={offset + EMPTY_PAGE_SIZE >= data.count}
                onClick={() => setOffset(offset + EMPTY_PAGE_SIZE)}
                className="h-6 px-1.5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {data && columns.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">No empty records found</div>
      )}
    </div>
  );
}
