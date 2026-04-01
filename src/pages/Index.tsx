import { useState, useEffect } from "react";
import ClassList from "@/components/ClassList";
import ClassDataView from "@/components/ClassDataView";
import ServerSettings from "@/components/ServerSettings";
import type { PersistentClassInfo } from "@/lib/api";
import { setApiBaseUrl } from "@/lib/api";
import { useApiConfig } from "@/lib/api-config";
import { Database } from "lucide-react";

export default function Index() {
  const [selected, setSelected] = useState<PersistentClassInfo | null>(null);
  const { baseUrl } = useApiConfig();

  useEffect(() => {
    setApiBaseUrl(baseUrl);
  }, [baseUrl]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              IRIS <span className="text-primary">Explorer</span>
            </span>
          </div>
          <ServerSettings />
        </div>
        <ClassList onSelect={setSelected} selected={selected?.name} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <ClassDataView key={selected.name} classInfo={selected} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Database className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                Select a class to view its data
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
