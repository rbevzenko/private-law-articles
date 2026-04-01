import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterPanelProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  years: number[];
  topics: string[];
  journals?: string[];
  selectedJournal?: string;
  onJournalChange?: (journal: string) => void;
  issues?: string[];
  selectedIssue?: string;
  onIssueChange?: (issue: string) => void;
  authors?: string[];
  selectedAuthor?: string;
  onAuthorChange?: (author: string) => void;
}

const FilterPanel = ({
  selectedTopics,
  onTopicsChange,
  selectedYear,
  onYearChange,
  years,
  topics,
  journals,
  selectedJournal = "all",
  onJournalChange,
  issues,
  selectedIssue = "all",
  onIssueChange,
  authors,
  selectedAuthor = "all",
  onAuthorChange,
}: FilterPanelProps) => {
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const hasFilters = selectedTopics.length > 0 || selectedYear !== "all" || selectedJournal !== "all" || selectedIssue !== "all" || selectedAuthor !== "all";

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      onTopicsChange(selectedTopics.filter((t) => t !== topic));
    } else {
      onTopicsChange([...selectedTopics, topic]);
    }
  };

  const topicsLabel = selectedTopics.length === 0
    ? "Все темы"
    : selectedTopics.length === 1
    ? selectedTopics[0]
    : `Темы: ${selectedTopics.length}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover open={topicsOpen} onOpenChange={(open) => { setTopicsOpen(open); if (!open) setTopicSearch(""); }}>
        <PopoverTrigger asChild>
          <button className="h-9 w-[220px] inline-flex items-center justify-between rounded-md border border-input bg-card px-3 font-body text-sm hover:bg-accent/50 transition-colors">
            <span className={selectedTopics.length === 0 ? "text-muted-foreground" : "text-foreground"}>
              {topicsLabel}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-1" align="start">
          <div className="px-2 py-1.5">
            <input
              autoFocus
              placeholder="Поиск темы..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {topics
              .filter((t) => t.toLowerCase().includes(topicSearch.toLowerCase()))
              .map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${selectedTopics.includes(topic) ? "bg-primary border-primary" : "border-input"}`}>
                    {selectedTopics.includes(topic) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {topic}
                </button>
              ))}
            {topics.filter((t) => t.toLowerCase().includes(topicSearch.toLowerCase())).length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground text-center">Ничего не найдено</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {journals && journals.length > 1 && onJournalChange && (
        <Select value={selectedJournal} onValueChange={onJournalChange}>
          <SelectTrigger className="h-9 w-[260px] font-body text-sm bg-card">
            <SelectValue placeholder="Все журналы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все журналы</SelectItem>
            {journals.map((j) => (
              <SelectItem key={j} value={j}>
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="h-9 w-[140px] font-body text-sm bg-card">
          <SelectValue placeholder="Все годы" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          <SelectItem value="all">Все годы</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {authors && authors.length > 0 && onAuthorChange && (
        <Select value={selectedAuthor} onValueChange={onAuthorChange}>
          <SelectTrigger className="h-9 w-[260px] font-body text-sm bg-card">
            <SelectValue placeholder="Все авторы" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">Все авторы</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {issues && issues.length > 0 && onIssueChange && (
        <Select value={selectedIssue} onValueChange={onIssueChange}>
          <SelectTrigger className="h-9 w-[140px] font-body text-sm bg-card">
            <SelectValue placeholder="Все номера" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">Все номера</SelectItem>
            {issues.map((iss) => (
              <SelectItem key={iss} value={iss}>
                {iss}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <button
          onClick={() => {
            onTopicsChange([]);
            onYearChange("all");
            onJournalChange?.("all");
            onAuthorChange?.("all");
            onIssueChange?.("all");
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
