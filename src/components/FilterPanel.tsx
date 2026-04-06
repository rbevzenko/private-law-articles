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
}: FilterPanelProps) => {
  const hasFilters =
    selectedTopics.length > 0 ||
    selectedYears.length > 0 ||
    selectedJournals.length > 0 ||
    selectedIssues.length > 0 ||
    selectedAuthors.length > 0;

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

      {hasFilters && (
        <button
          onClick={() => {
            onTopicsChange([]);
            onYearsChange([]);
            onJournalsChange?.([]);
            onAuthorsChange?.([]);
            onIssuesChange?.([]);
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
