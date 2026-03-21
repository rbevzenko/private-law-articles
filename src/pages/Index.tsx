import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { articles } from "@/data/articles";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import ArticleCard from "@/components/ArticleCard";

const Index = () => {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [year, setYear] = useState("all");

  const years = useMemo(
    () => [...new Set(articles.map((a) => a.year))].sort((a, b) => b - a),
    []
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles.filter((a) => {
      if (topic !== "all" && !a.topics.includes(topic)) return false;
      if (year !== "all" && a.year !== Number(year)) return false;
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !a.authors.some((au) => au.toLowerCase().includes(q)) &&
        !a.journal.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, topic, year]);

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
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-10">
        <div
          className="animate-fade-up max-w-2xl"
        >
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Библиографический каталог статей по частному праву
          </h2>
          <p className="mt-4 font-body text-lg text-muted-foreground leading-relaxed max-w-xl">
            Систематизированное собрание научных публикаций по&nbsp;основным институтам частного права — от&nbsp;обязательственного до&nbsp;международного частного.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 sm:px-8 pb-6">
        <div
          className="animate-fade-up space-y-4"
          style={{ animationDelay: "100ms" }}
        >
          <SearchBar value={search} onChange={setSearch} />
          <FilterPanel
            selectedTopic={topic}
            onTopicChange={setTopic}
            selectedYear={year}
            onYearChange={setYear}
            years={years}
          />
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 sm:px-8 pb-16">
        <p className="mb-4 font-body text-sm text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "публикация"
            : filtered.length < 5
            ? "публикации"
            : "публикаций"}
        </p>

        {filtered.length === 0 ? (
          <div className="py-16 text-center animate-fade-in">
            <p className="font-body text-muted-foreground">
              Ничего не найдено. Попробуйте изменить критерии поиска.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                style={{ animationDelay: `${150 + i * 70}ms` }}
              />
            ))}
          </div>
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
