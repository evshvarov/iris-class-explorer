import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClassStats, type PersistentClassColumnStats } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface ClassStatsViewProps {
  className: string;
}

export default function ClassStatsView({ className }: ClassStatsViewProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            <ColumnStatRow key={col.name} col={col} />
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

function ColumnStatRow({ col }: { col: PersistentClassColumnStats }) {
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
        <span>{col.emptyCount} empty</span>
      </div>
    </div>
  );
}
