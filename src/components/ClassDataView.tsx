import { useQuery } from "@tanstack/react-query";
import { fetchClassData, type PersistentClassInfo } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ClassDataViewProps {
  classInfo: PersistentClassInfo;
}

const PAGE_SIZE = 50;

export default function ClassDataView({ classInfo }: ClassDataViewProps) {
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["iris-class-data", classInfo.name, offset],
    queryFn: () => fetchClassData(classInfo.name, PAGE_SIZE, offset),
  });

  const columns = data?.items?.length
    ? Object.keys(data.items[0])
    : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
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
        {classInfo.description && (
          <p className="mt-2 text-sm text-muted-foreground">{classInfo.description}</p>
        )}
      </div>

      {/* Content */}
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
        <ScrollArea className="flex-1">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead
                      key={col}
                      className="font-mono text-xs text-primary/80 whitespace-nowrap bg-muted/30 border-b border-border"
                    >
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((row, i) => (
                  <TableRow key={i} className="border-border hover:bg-muted/40">
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className="font-mono text-xs whitespace-nowrap max-w-[300px] truncate"
                      >
                        {row[col] == null ? (
                          <span className="text-muted-foreground/50 italic">null</span>
                        ) : typeof row[col] === "object" ? (
                          JSON.stringify(row[col])
                        ) : (
                          String(row[col])
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
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
    </div>
  );
}
