import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Database, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const JOURNALS = [
  { id: "mvgp", name: "Вестник гражданского права", color: "bg-emerald-100 text-emerald-800" },
  { id: "privlaw", name: "Цивилистика", color: "bg-blue-100 text-blue-800" },
  { id: "zakon", name: "Вестник экономического правосудия", color: "bg-amber-100 text-amber-800" },
] as const;

const Admin = () => {
  const { toast } = useToast();
  const [scraping, setScraping] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<{ total: number; inserted: number; skipped: number } | null>(null);
  const [limit, setLimit] = useState(5);

  const handleScrape = async (journalId: string) => {
    setScraping(journalId);
    setLogs([`Начинаю сканирование (до ${limit} номеров)...`]);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-journal", {
        body: { journal: journalId, limit },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setLogs(data.logs || []);
        setResults({
          total: data.total_found,
          inserted: data.inserted,
          skipped: data.skipped,
        });
        toast({
          title: "Сканирование завершено",
          description: `Найдено ${data.total_found} статей, добавлено ${data.inserted}`,
        });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Ошибка: ${err.message}`]);
      toast({
        title: "Ошибка сканирования",
        description: err.message,
        variant: "destructive",
      });
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Сканирование журналов</h2>
            <p className="text-muted-foreground font-body">
              Выберите журнал для автоматического сбора статей. Программа зайдёт на сайт журнала,
              найдёт все статьи и добавит их в каталог.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-body text-muted-foreground">Номеров за раз:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 px-3 rounded-md border border-border bg-card text-sm font-body"
              disabled={!!scraping}
            >
              {[3, 5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
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
            <Card className="p-5 border-green-200 bg-green-50/50">
              <h3 className="font-semibold text-green-800 mb-2">Результат</h3>
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
              <h3 className="font-semibold mb-3">Журнал операций</h3>
              <div className="bg-muted rounded-md p-3 max-h-64 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">
                    {log}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
