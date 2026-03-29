import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  id?: string;
}

const ComboboxInput = ({ value, onChange, suggestions, placeholder, id, onKeyDown }: ComboboxInputProps) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setFiltered(suggestions.slice(0, 50));
    } else {
      const lower = value.toLowerCase();
      setFiltered(suggestions.filter((s) => s.toLowerCase().includes(lower)).slice(0, 50));
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md text-sm">
          {filtered.map((item) => (
            <li
              key={item}
              className="cursor-pointer rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={(e) => { e.preventDefault(); onChange(item); setOpen(false); }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ComboboxInput;
