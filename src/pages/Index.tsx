import { useMemo, useState, useCallback } from "react";
import { BookOpen, Settings, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useArticles, useArticleTopics } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import { articles as staticArticles, TOPICS } from "@/data/articles";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import type { Article } from "@/data/articles";

const PAGE_SIZE = 50;

const Index = () => {
  const [search, setSearch] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [year, setYear] = useState("all");
  const [journal, setJournal] = useState("all");
  const [issue, setIssue] = useState("all");
  const [author, setAuthor] = useState("all");
  const [page, setPage] = useState(1);

  const { data: dbArticles, isLoading, isError, error } = useArticles();
  const { data: dbTopics } = useArticleTopics();
  const { user, signOut } = useAuth();

  // Merge DB articles with static ones, preferring DB
  const allArticles: Article[] = useMemo(() => {
    const normalizeJournal = (j: string) =>
      j === "Практика разрешения коммерческих споров"
        ? "Практика рассмотрения коммерческих споров"
        : j;

    if (dbArticles && dbArticles.length > 0) {
      return dbArticles.map((a) => ({
        id: a.id,
        title: a.title,
        authors: a.authors,
        journal: normalizeJournal(a.journal),
        year: a.year,
        issue: a.issue || undefined,
        topics: a.topics,
      }));
    }
    return staticArticles;
  }, [dbArticles]);

  const allTopics = useMemo(
    () => dbTopics && dbTopics.length > 0 ? dbTopics : [...TOPICS],
    [dbTopics]
  );

  const journals = useMemo(
    () => [...new Set(allArticles.map((a) => a.journal))].sort(),
    [allArticles]
  );

  const years = useMemo(
    () => [...new Set(allArticles.map((a) => a.year))].sort((a, b) => b - a),
    [allArticles]
  );

  const authors = useMemo(
    () => [...new Set(allArticles.flatMap((a) => a.authors).filter((a) => a && a !== "Автор не указан"))].sort(),
    [allArticles]
  );

  const issues = useMemo(() => {
    const relevant = allArticles.filter((a) => {
      if (journal !== "all" && a.journal !== journal) return false;
      if (year !== "all" && a.year !== Number(year)) return false;
      return !!a.issue;
    });
    return [...new Set(relevant.map((a) => a.issue!))].sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [allArticles, journal, year]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allArticles.filter((a) => {
      if (selectedTopics.length > 0 && !selectedTopics.some((t) => a.topics.includes(t))) return false;
      if (year !== "all" && a.year !== Number(year)) return false;
      if (journal !== "all" && a.journal !== journal) return false;
      if (issue !== "all" && a.issue !== issue) return false;
      if (author !== "all" && !a.authors.includes(author)) return false;
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !a.authors.some((au) => au.toLowerCase().includes(q)) &&
        !a.journal.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, selectedTopics, year, journal, issue, author, allArticles]);

  // Reset page when filters change
  const handleTopicsChange = useCallback((v: string[]) => { setSelectedTopics(v); setPage(1); }, []);
  const handleYearChange = useCallback((v: string) => { setYear(v); setPage(1); }, []);
  const handleJournalChange = useCallback((v: string) => { setJournal(v); setIssue("all"); setPage(1); }, []);
  const handleIssueChange = useCallback((v: string) => { setIssue(v); setPage(1); }, []);
  const handleAuthorChange = useCallback((v: string) => { setAuthor(v); setPage(1); }, []);
  const handleYearChangeWithIssueReset = useCallback((v: string) => { setYear(v); setIssue("all"); setPage(1); }, []);
  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedArticles = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4 sm:px-8">
          <BookOpen className="h-6 w-6 text-primary shrink-0" />
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Частное право
          </h1>
          <span className="hidden sm:inline font-body text-sm text-muted-foreground ml-1">
            — библиография
          </span>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/admin"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Управление каталогом"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  title="Выйти"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Войти"
              >
                <LogIn className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-10">
        <div className="animate-fade-up max-w-3xl">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Библиографический каталог научных публикаций по&nbsp;частному праву
          </h2>
          <p className="mt-2 font-body text-base text-muted-foreground leading-relaxed sm:text-lg">
            Систематизированный каталог научных публикаций по&nbsp;основным институтам частного права в&nbsp;периодических изданиях и&nbsp;сборниках статей, составленный Романом Бевзенко
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 sm:px-8 pb-6">
        <div
          className="animate-fade-up space-y-4"
          style={{ animationDelay: "100ms" }}
        >
          <SearchBar value={search} onChange={handleSearchChange} />
          <FilterPanel
            selectedTopics={selectedTopics}
            onTopicsChange={handleTopicsChange}
            selectedYear={year}
            onYearChange={handleYearChangeWithIssueReset}
            years={years}
            topics={allTopics}
            journals={journals}
            selectedJournal={journal}
            onJournalChange={handleJournalChange}
            issues={issues}
            selectedIssue={issue}
            onIssueChange={handleIssueChange}
            authors={authors}
            selectedAuthor={author}
            onAuthorChange={handleAuthorChange}
          />
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 sm:px-8 pb-16">
        {isLoading ? (
          <div className="py-16 text-center">
            <p className="font-body text-muted-foreground animate-pulse">
              Загрузка каталога...
            </p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-2">
            <p className="font-body text-destructive font-medium">Ошибка загрузки каталога</p>
            <p className="font-body text-sm text-muted-foreground">{(error as Error)?.message || "Неизвестная ошибка"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-body text-sm text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "публикация"
                  : filtered.length < 5
                  ? "публикации"
                  : "публикаций"}
                {totalPages > 1 && (
                  <span className="ml-2">
                    · стр. {safePage} из {totalPages}
                  </span>
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={safePage <= 1}
                    className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Предыдущая страница"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={safePage >= totalPages}
                    className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Следующая страница"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center animate-fade-in">
                <p className="font-body text-muted-foreground">
                  Ничего не найдено. Попробуйте изменить критерии поиска.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {paginatedArticles.map((article, i) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      canEdit={!!user}
                      style={{ animationDelay: `${Math.min(80 + i * 20, 400)}ms` }}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center flex-wrap gap-1">
                    <button
                      onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      disabled={safePage <= 1}
                      className="px-3 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Назад
                    </button>
                    {(() => {
                      const pages: (number | "...")[] = [];
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (safePage > 3) pages.push("...");
                        for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
                        if (safePage < totalPages - 2) pages.push("...");
                        pages.push(totalPages);
                      }
                      return pages.map((p, i) =>
                        p === "..." ? (
                          <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-muted-foreground">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className={`min-w-[36px] px-2 py-1.5 rounded-md border text-sm transition-colors ${
                              p === safePage
                                ? "border-primary bg-primary text-primary-foreground font-medium"
                                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      );
                    })()}
                    <button
                      onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      disabled={safePage >= totalPages}
                      className="px-3 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Вперёд →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 sm:px-8">
          <p className="font-body text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Каталог статей по частному праву
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
