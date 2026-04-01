import { useState } from "react";
import { useApiConfig, DEFAULT_BASE_URL } from "@/lib/api-config";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Check, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ServerSettings() {
  const { baseUrl, setBaseUrl, resetBaseUrl, isDefault } = useApiConfig();
  const [draft, setDraft] = useState(baseUrl);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const apply = () => {
    setBaseUrl(draft);
    queryClient.invalidateQueries();
    setOpen(false);
  };

  const reset = () => {
    resetBaseUrl();
    setDraft(DEFAULT_BASE_URL);
    queryClient.invalidateQueries();
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setDraft(baseUrl); }}>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Settings className={`h-4 w-4 ${!isDefault ? "text-primary" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-foreground">API Server</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Set the base URL for the IRIS API endpoint
            </p>
          </div>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={DEFAULT_BASE_URL}
            className="font-mono text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={apply} className="h-7 text-xs gap-1.5 flex-1">
              <Check className="h-3 w-3" /> Apply
            </Button>
            {!isDefault && (
              <Button size="sm" variant="outline" onClick={reset} className="h-7 text-xs gap-1.5">
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            )}
          </div>
          {!isDefault && (
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              Current: {baseUrl}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
