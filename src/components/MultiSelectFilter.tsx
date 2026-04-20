import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectFilterProps {
  selected: string[];
  onChange: (values: string[]) => void;
  options: string[];
  placeholder: string;
  searchPlaceholder?: string;
  width?: string;
  popoverWidth?: string;
}

const MultiSelectFilter = ({
  selected,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Поиск...",
  width = "w-[220px]",
  popoverWidth,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${placeholder.replace(/^Все\s*/i, "").replace(/^Все\s*/i, "")}: ${selected.length}`;

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <button
          className={`h-9 ${width} inline-flex items-center justify-between rounded-md border border-input bg-card px-3 font-body text-sm hover:bg-accent/50 transition-colors`}
        >
          <span
            className={`truncate ${selected.length === 0 ? "text-muted-foreground" : "text-foreground"}`}
          >
            {label}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={`${popoverWidth || "w-[280px]"} p-1`} align="start">
        <div className="px-2 py-1.5">
          <input
            autoFocus
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-base sm:text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item}
              onClick={() => toggle(item)}
              className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <div
                className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                  selected.includes(item)
                    ? "bg-primary border-primary"
                    : "border-input"
                }`}
              >
                {selected.includes(item) && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <span className="truncate" title={item}>{item}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground text-center">
              Ничего не найдено
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilter;
