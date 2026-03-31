import { useQuery } from "@tanstack/react-query";
import { fetchClassData, type PersistentClassInfo } from "@/lib/api";
import { Database, ChevronLeft, ChevronRight, Loader2, BarChart3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ClassStatsView from "./ClassStatsView";

interface ClassDataViewProps {
  classInfo: PersistentClassInfo;
}

const PAGE_SIZE = 50;

export default function ClassDataView({ classInfo }: ClassDataViewProps) {
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState<"data" | "stats">("data");

  const { data, isLoading, error } = useQuery({
    queryKey: ["iris-class-data", classInfo.name, offset],
    queryFn: () => fetchClassData(classInfo.name, PAGE_SIZE, offset),
    enabled: tab === "data",
  });

  const columns = data?.items?.length ? Object.keys(data.items[0]) : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold font-mono text-foreground">
                {classInfo.name}
              </h1>
              {classInfo.sqlTableName && (
                <p className="text-xs text-muted-foreground">
                  {classInfo.sqlSchemaName}.{classInfo.sqlTableName}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
            <Button
              variant={tab === "data" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab("data")}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <Table2 className="h-3.5 w-3.5" /> Data
            </Button>
            <Button
              variant={tab === "stats" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab("stats")}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Stats
            </Button>
          </div>
        </div>
        {classInfo.description && (
          <p className="mt-2 text-sm text-muted-foreground">{classInfo.description}</p>
        )}
      </div>

      {/* Stats tab */}
      {tab === "stats" && (
        <ClassStatsView className={classInfo.name} />
      )}

      {/* Data tab */}
      {tab === "data" && (
        <>
          {isLoading && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading data…
            </div>
          )}

          {error && (
            <div className="flex flex-1 items-center justify-center text-destructive text-sm">
              Failed to load data for this class
            </div>
          )}

          {data && columns.length > 0 && (
            <div className="flex-1 overflow-auto relative">
              <table className="w-full min-w-max border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left font-mono text-xs font-medium text-primary/80 whitespace-nowrap bg-card border-b border-border"
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
                          className="px-4 py-2 font-mono text-xs whitespace-nowrap max-w-[300px] truncate text-foreground"
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
          )}

          {data && columns.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              No data in this class
            </div>
          )}

          {/* Footer pagination */}
          {data && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                {data.count} rows total · showing {offset + 1}–{Math.min(offset + PAGE_SIZE, data.count)}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= data.count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
