import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Database, ArrowLeft, RefreshCw, FolderDown, Plus, Upload, Download } from "lucide-react";
import { Link } from "react-router-dom";
import CreateArticleDialog from "@/components/CreateArticleDialog";
import { useToast } from "@/hooks/use-toast";

const JOURNALS = [
  { id: "mvgp", name: "Вестник гражданского права", color: "bg-emerald-100 text-emerald-800" },
  { id: "privlaw", name: "Цивилистика", color: "bg-blue-100 text-blue-800" },
  { id: "zakon", name: "Вестник экономического правосудия (ранее Вестник ВАС РФ)", color: "bg-amber-100 text-amber-800" },
] as const;

type ScrapeMode = "new" | "all";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [scraping, setScraping] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<{ total: number; inserted: number; skipped: number; timedOut?: boolean } | null>(null);
  const [mode, setMode] = useState<ScrapeMode>("new");
  const [createOpen, setCreateOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number; errors: number } | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportResult(null);
    setImporting(true);

    try {
      const text = await file.text();
      const raw: any[] = JSON.parse(text);

      if (!Array.isArray(raw)) throw new Error("JSON должен быть массивом объектов");

      const rows = raw.map((item) => ({
        title: String(item.title ?? "").trim(),
        authors: item.author
          ? [String(item.author).trim()]
          : Array.isArray(item.authors)
          ? item.authors.map(String)
          : [],
        journal: String(item.journal ?? "").trim(),
        year: Number(item.year),
        issue: item.issue != null ? String(item.issue).trim() : null,
        section: item.section ? String(item.section).trim() : null,
        topics: Array.isArray(item.topics) ? item.topics.map(String) : [],
        url: item.url ? String(item.url).trim() : null,
        source_url: item.source_url ? String(item.source_url).trim() : null,
      })).filter((r) => r.title && r.journal && r.year);

      const BATCH = 50;
      let inserted = 0;
      let skipped = 0;
      let errors = 0;

      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { data, error } = await supabase
          .from("articles")
          .upsert(batch, { onConflict: "title,journal,year", ignoreDuplicates: true })
          .select("id");

        if (error) {
          errors += batch.length;
        } else {
          inserted += data?.length ?? 0;
          skipped += batch.length - (data?.length ?? 0);
        }
      }

      setImportResult({ inserted, skipped, errors });
      toast({
        title: "Импорт завершён",
        description: `Добавлено: ${inserted}, пропущено дублей: ${skipped}`,
      });
    } catch (err: any) {
      toast({ title: "Ошибка импорта", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const PAGE = 1000;
      let all: object[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("journal")
          .order("year")
          .order("title")
          .range(from, from + PAGE - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `articles-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Экспорт завершён", description: `Скачано ${all.length} статей` });
    } catch (err: any) {
      toast({ title: "Ошибка экспорта", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleScrape = async (journalId: string) => {
    setScraping(journalId);
    setLogs([`Режим: ${mode === "new" ? "только новые номера" : "все номера"}. Начинаю...`]);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-journal", {
        body: { journal: journalId, mode },
      });

      if (error) throw new Error(error.message);

      if (data.success) {
        setLogs(data.logs || []);
        setResults({
          total: data.total_found,
          inserted: data.inserted,
          skipped: data.skipped,
          timedOut: data.timed_out,
        });
        toast({
          title: data.timed_out ? "Частично завершено" : "Сканирование завершено",
          description: data.timed_out
            ? `Добавлено ${data.inserted} статей. Запустите ещё раз для оставшихся номеров.`
            : `Найдено ${data.total_found} статей, добавлено ${data.inserted}`,
        });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Ошибка: ${err.message}`]);
      toast({ title: "Ошибка сканирования", description: err.message, variant: "destructive" });
    } finally {
      setScraping(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4 sm:px-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Database className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight text-primary">
            Управление каталогом
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 py-8 max-w-3xl">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Управление статьями</h2>
              <p className="text-muted-foreground font-body">
                Сканируйте издания или добавьте статью вручную.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              Добавить статью
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-body text-muted-foreground">Режим:</label>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setMode("new")}
                disabled={!!scraping}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-body transition-colors ${
                  mode === "new"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Только новые
              </button>
              <button
                onClick={() => setMode("all")}
                disabled={!!scraping}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-body transition-colors border-l border-border ${
                  mode === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderDown className="h-3.5 w-3.5" />
                Все номера
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {JOURNALS.map((journal) => (
              <Card key={journal.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${journal.color} mb-2`}>
                      {journal.name}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleScrape(journal.id)}
                    disabled={!!scraping}
                    size="sm"
                    className="shrink-0"
                  >
                    {scraping === journal.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сканирую...
                      </>
                    ) : (
                      "Сканировать"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {results && (
            <Card className={`p-5 ${results.timedOut ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"}`}>
              <h3 className={`font-semibold mb-2 ${results.timedOut ? "text-amber-800" : "text-green-800"}`}>
                {results.timedOut ? "Частично завершено — запустите ещё раз" : "Результат"}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-700">{results.total}</div>
                  <div className="text-xs text-green-600 font-body">Найдено</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{results.inserted}</div>
                  <div className="text-xs text-green-600 font-body">Добавлено</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-700">{results.skipped}</div>
                  <div className="text-xs text-amber-600 font-body">Пропущено</div>
                </div>
              </div>
            </Card>
          )}

          {logs.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Лог операций</h3>
              <div className="bg-muted rounded-md p-3 max-h-64 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">
                    {log}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {/* JSON Import */}
          <Card className="p-5">
            <h3 className="font-semibold mb-1">Импорт из JSON</h3>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Загрузите JSON-файл со статьями. Дубли (по названию + изданию + году) пропускаются автоматически.
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJsonImport}
                className="hidden"
                id="json-upload"
              />
              <Button
                asChild
                variant="outline"
                disabled={importing}
                className="cursor-pointer"
              >
                <label htmlFor="json-upload" className="cursor-pointer flex items-center gap-2">
                  {importing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Импортирую...</>
                  ) : (
                    <><Upload className="h-4 w-4" />Выбрать файл</>
                  )}
                </label>
              </Button>
              {importFileName && !importing && (
                <span className="text-sm text-muted-foreground font-body truncate max-w-[200px]">
                  {importFileName}
                </span>
              )}
            </div>

            {importResult && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-border pt-4">
                <div>
                  <div className="text-2xl font-bold text-green-700">{importResult.inserted}</div>
                  <div className="text-xs text-green-600 font-body">Добавлено</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-700">{importResult.skipped}</div>
                  <div className="text-xs text-amber-600 font-body">Пропущено</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700">{importResult.errors}</div>
                  <div className="text-xs text-red-600 font-body">Ошибок</div>
                </div>
              </div>
            )}
          </Card>

          {/* JSON Export */}
          <Card className="p-5">
            <h3 className="font-semibold mb-1">Экспорт в JSON</h3>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Скачать всю базу статей одним файлом.
            </p>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Экспортирую...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" />Скачать JSON</>
              )}
            </Button>
          </Card>
        </div>

        <CreateArticleDialog open={createOpen} onOpenChange={setCreateOpen} />
      </main>
    </div>
  );
};

export default Admin;
