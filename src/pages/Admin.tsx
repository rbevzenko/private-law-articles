import { useState, useRef, useEffect } from "react";
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
  { id: "zakonzh", name: "Закон", color: "bg-violet-100 text-violet-800" },
] as const;

type ScrapeMode = "new" | "all";

const toFlag = (code: string) =>
  [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");

const getCountryName = (code: string) => {
  if (code === "??") return "Неизвестно";
  try {
    return new Intl.DisplayNames(["ru"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [scraping, setScraping] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<{ total: number; inserted: number; skipped: number; timedOut?: boolean } | null>(null);
  const [pendingArticles, setPendingArticles] = useState<any[] | null>(null);
  const [mode, setMode] = useState<ScrapeMode>("new");
  const [createOpen, setCreateOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [undoPreview, setUndoPreview] = useState<{ date: string; count: number; journals: string } | null>(null);
  const [undoing, setUndoing] = useState(false);

  const handleUndoPreview = async () => {
    const { data: last } = await supabase
      .from("articles")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!last) return;
    const maxDay = last.created_at.slice(0, 10);
    const { data: rows } = await supabase
      .from("articles")
      .select("journal")
      .gte("created_at", `${maxDay}T00:00:00.000Z`)
      .lte("created_at", `${maxDay}T23:59:59.999Z`);
    if (!rows) return;
    const journals = [...new Set(rows.map((r: any) => r.journal))].join(", ");
    const [y, m, d] = maxDay.split("-");
    setUndoPreview({ date: `${d}.${m}.${y}`, count: rows.length, journals });
  };

  const handleUndoConfirm = async () => {
    if (!undoPreview) return;
    setUndoing(true);
    const { data: last } = await supabase
      .from("articles")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (last) {
      const maxDay = last.created_at.slice(0, 10);
      await supabase
        .from("articles")
        .delete()
        .gte("created_at", `${maxDay}T00:00:00.000Z`)
        .lte("created_at", `${maxDay}T23:59:59.999Z`);
    }
    toast({ title: "Удалено", description: `Удалено ${undoPreview.count} статей за ${undoPreview.date}` });
    setUndoPreview(null);
    setUndoing(false);
  };

  const [visitStats, setVisitStats] = useState<{ today: number; week: number; month: number; year: number } | null>(null);
  const [countryStats, setCountryStats] = useState<{ country: string; cnt: number }[] | null>(null);

  useEffect(() => {
    supabase.rpc("get_visit_stats").then(({ data }) => { if (data) setVisitStats(data); });
    supabase.rpc("get_country_stats").then(({ data }) => { if (data) setCountryStats(data); });
  }, []);

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
        issue: item.issue != null ? String(item.issue).trim() : '',
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
          .upsert(batch, { onConflict: "title,journal,year,issue", ignoreDuplicates: true })
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
    setPendingArticles(null);
    setResults(null);
    setLogs([`Режим: ${mode === "new" ? "только новые номера" : "все номера"}. Сканирую...`]);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-journal", {
        body: { journal: journalId, mode, preview: true },
      });

      if (error) {
        let msg = error.message;
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) msg = body.error;
          else if (body?.message) msg = body.message;
        } catch {}
        throw new Error(msg);
      }

      if (data.success && data.preview) {
        setLogs(data.logs || []);
        setPendingArticles(data.articles || []);
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

  const handleConfirmImport = async () => {
    if (!pendingArticles?.length) return;
    setConfirming(true);
    const BATCH = 50;
    let inserted = 0, skipped = 0, errors = 0;
    try {
      for (let i = 0; i < pendingArticles.length; i += BATCH) {
        const batch = pendingArticles.slice(i, i + BATCH);
        const { data, error } = await supabase
          .from("articles")
          .upsert(batch, { onConflict: "title,journal,year,issue", ignoreDuplicates: true })
          .select("id");
        if (error) { errors += batch.length; }
        else {
          inserted += data?.length ?? 0;
          skipped += batch.length - (data?.length ?? 0);
        }
      }
      setResults({ total: pendingArticles.length, inserted, skipped });
      setPendingArticles(null);
      toast({ title: "Импорт завершён", description: `Добавлено: ${inserted}, пропущено дублей: ${skipped}` });
    } catch (err: any) {
      toast({ title: "Ошибка импорта", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
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

          {/* Visit stats */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Уникальные посетители</h3>
            {visitStats ? (
              <div className="grid grid-cols-4 gap-4 text-center">
                {([
                  { label: "Сегодня", value: visitStats.today },
                  { label: "Неделя", value: visitStats.week },
                  { label: "Месяц", value: visitStats.month },
                  { label: "Год", value: visitStats.year },
                ] as const).map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-2xl font-bold text-primary">{value.toLocaleString("ru-RU")}</div>
                    <div className="text-xs text-muted-foreground font-body mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </Card>

          {/* Country stats */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">География посетителей</h3>
            {countryStats ? (
              countryStats.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">Данных пока нет</p>
              ) : (
                <div className="space-y-2">
                  {countryStats.map(({ country, cnt }) => {
                    const max = countryStats[0].cnt;
                    return (
                      <div key={country} className="flex items-center gap-3">
                        <span className="text-xl w-7 shrink-0 text-center">
                          {country === "??" ? "🌍" : toFlag(country)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-body text-sm text-foreground truncate">
                              {getCountryName(country)}
                            </span>
                            <span className="font-body text-sm font-medium text-primary ml-2 shrink-0">
                              {cnt}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60 transition-all"
                              style={{ width: `${Math.round((cnt / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </Card>

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

          {pendingArticles && (
            <Card className="p-5 border-blue-200 bg-blue-50/50">
              <h3 className="font-semibold text-blue-800 mb-1">
                Найдено {pendingArticles.length} статей — подтвердите добавление
              </h3>
              <p className="text-xs text-blue-600 font-body mb-3">
                Проверьте список и нажмите «Добавить в базу» для импорта.
              </p>
              <div className="max-h-72 overflow-y-auto rounded border border-blue-200 bg-white mb-4">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-blue-50 border-b border-blue-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-blue-800 font-body">Название</th>
                      <th className="text-left px-3 py-2 font-medium text-blue-800 font-body w-16">Год</th>
                      <th className="text-left px-3 py-2 font-medium text-blue-800 font-body w-20">Выпуск</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingArticles.map((a, i) => (
                      <tr key={i} className="border-b border-blue-100 last:border-0">
                        <td className="px-3 py-1.5 font-body text-foreground leading-snug">{a.title}</td>
                        <td className="px-3 py-1.5 font-body text-muted-foreground">{a.year}</td>
                        <td className="px-3 py-1.5 font-body text-muted-foreground">{a.issue || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleConfirmImport} disabled={confirming}>
                  {confirming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Добавляю...</> : `Добавить в базу (${pendingArticles.length})`}
                </Button>
                <Button variant="outline" onClick={() => setPendingArticles(null)} disabled={confirming}>
                  Отменить
                </Button>
              </div>
            </Card>
          )}

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

          {/* Undo last import */}
          <Card className="p-5">
            <h3 className="font-semibold mb-1">Отменить последнее добавление</h3>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Удаляет все статьи, добавленные в последний день пополнения базы.
            </p>
            {!undoPreview ? (
              <Button variant="outline" onClick={handleUndoPreview} className="border-red-200 text-red-700 hover:bg-red-50">
                Показать что будет удалено
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-body text-red-800">
                  <span className="font-medium">{undoPreview.date}.</span> Будет удалено{" "}
                  <span className="font-medium">{undoPreview.count}</span> статей из{" "}
                  {undoPreview.journals}
                </div>
                <div className="flex gap-3">
                  <Button variant="destructive" onClick={handleUndoConfirm} disabled={undoing}>
                    {undoing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Удаляю...</> : "Удалить"}
                  </Button>
                  <Button variant="outline" onClick={() => setUndoPreview(null)} disabled={undoing}>
                    Отменить
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <CreateArticleDialog open={createOpen} onOpenChange={setCreateOpen} />
      </main>
    </div>
  );
};

export default Admin;
