import { TOPICS } from "@/data/articles";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterPanelProps {
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  years: number[];
}

const FilterPanel = ({
  selectedTopic,
  onTopicChange,
  selectedYear,
  onYearChange,
  years,
}: FilterPanelProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedTopic} onValueChange={onTopicChange}>
        <SelectTrigger className="h-9 w-[220px] font-body text-sm bg-card">
          <SelectValue placeholder="Все темы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все темы</SelectItem>
          {TOPICS.map((topic) => (
            <SelectItem key={topic} value={topic}>
              {topic}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="h-9 w-[140px] font-body text-sm bg-card">
          <SelectValue placeholder="Все годы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все годы</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(selectedTopic !== "all" || selectedYear !== "all") && (
        <button
          onClick={() => {
            onTopicChange("all");
            onYearChange("all");
          }}
          className="font-body text-sm text-accent hover:text-accent/80 transition-colors active:scale-95"
        >
          Сбросить
        </button>
      )}
    </div>
  );
};

export default FilterPanel;
