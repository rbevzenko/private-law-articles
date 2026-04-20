import MultiSelectFilter from "@/components/MultiSelectFilter";

interface FilterPanelProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  selectedYears: string[];
  onYearsChange: (years: string[]) => void;
  years: number[];
  topics: string[];
  journals?: string[];
  selectedJournals?: string[];
  onJournalsChange?: (journals: string[]) => void;
  issues?: string[];
  selectedIssues?: string[];
  onIssuesChange?: (issues: string[]) => void;
  authors?: string[];
  selectedAuthors?: string[];
  onAuthorsChange?: (authors: string[]) => void;
  onClearSearch?: () => void;
}

const FilterPanel = ({
  selectedTopics,
  onTopicsChange,
  selectedYears,
  onYearsChange,
  years,
  topics,
  journals,
  selectedJournals = [],
  onJournalsChange,
  issues,
  selectedIssues = [],
  onIssuesChange,
  authors,
  selectedAuthors = [],
  onAuthorsChange,
  onClearSearch,
}: FilterPanelProps) => {

  return (
    <div className="flex flex-wrap items-center gap-3">
      <MultiSelectFilter
        selected={selectedTopics}
        onChange={onTopicsChange}
        options={topics}
        placeholder="Все темы"
        searchPlaceholder="Поиск темы..."
        width="w-[220px]"
      />

      {journals && journals.length > 1 && onJournalsChange && (
        <MultiSelectFilter
          selected={selectedJournals}
          onChange={onJournalsChange}
          options={journals}
          placeholder="Все издания"
          searchPlaceholder="Поиск издания..."
          width="w-[260px]"
          popoverWidth="w-[450px]"
        />
      )}

      <MultiSelectFilter
        selected={selectedYears}
        onChange={onYearsChange}
        options={years.map(String)}
        placeholder="Все годы"
        searchPlaceholder="Поиск года..."
        width="w-[160px]"
      />

      {authors && authors.length > 0 && onAuthorsChange && (
        <MultiSelectFilter
          selected={selectedAuthors}
          onChange={onAuthorsChange}
          options={authors}
          placeholder="Все авторы"
          searchPlaceholder="Поиск автора..."
          width="w-[260px]"
        />
      )}

      {issues && issues.length > 0 && onIssuesChange && (
        <MultiSelectFilter
          selected={selectedIssues}
          onChange={onIssuesChange}
          options={issues}
          placeholder="Все номера"
          searchPlaceholder="Поиск номера..."
          width="w-[160px]"
        />
      )}

      <button
        onClick={() => {
          onTopicsChange([]);
          onYearsChange([]);
          onJournalsChange?.([]);
          onAuthorsChange?.([]);
          onIssuesChange?.([]);
          onClearSearch?.();
        }}
        className="font-body text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors active:scale-95"
      >
        Очистить
      </button>
    </div>
  );
};

export default FilterPanel;
