import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClasses, type PersistentClassInfo } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Database, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ClassListProps {
  onSelect: (cls: PersistentClassInfo) => void;
  selected?: string;
}

export default function ClassList({ onSelect, selected }: ClassListProps) {
  const [search, setSearch] = useState("");
  const [includeSystem, setIncludeSystem] = useState(false);
  const [includeMapped, setIncludeMapped] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["iris-classes", includeSystem, includeMapped],
    queryFn: () => fetchClasses(500, 0, undefined, includeSystem, includeMapped),
  });

  const filtered = data?.items?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <h2 className="mb-3 text-sm font-semibold tracking-wider uppercase text-muted-foreground">
          Classes
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeSystem"
              checked={includeSystem}
              onCheckedChange={(v) => setIncludeSystem(v === true)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="includeSystem" className="text-[11px] text-muted-foreground cursor-pointer">
              System classes
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeMapped"
              checked={includeMapped}
              onCheckedChange={(v) => setIncludeMapped(v === true)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="includeMapped" className="text-[11px] text-muted-foreground cursor-pointer">
              Mapped classes
            </Label>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-destructive">
            Failed to load classes
          </div>
        )}
        <div className="p-1">
          {filtered.map((cls) => (
            <button
              key={cls.name}
              onClick={() => onSelect(cls)}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors group ${
                selected === cls.name
                  ? "bg-primary/15 text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className={`h-3.5 w-3.5 shrink-0 ${
                  selected === cls.name ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                }`} />
                <span className="truncate font-mono text-xs">{cls.name}</span>
              </div>
              {cls.sqlTableName && (
                <span className="ml-5.5 block text-[10px] text-muted-foreground truncate">
                  {cls.sqlSchemaName}.{cls.sqlTableName}
                </span>
              )}
            </button>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No classes found
            </div>
          )}
        </div>
      </ScrollArea>

      {data && (
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          {filtered.length} of {data.items?.length ?? 0} classes
        </div>
      )}
    </div>
  );
}
