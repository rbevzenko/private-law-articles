import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2, Search } from "lucide-react";
import { useArticles, type DbArticle } from "@/hooks/useArticles";
import { useDeleteArticle } from "@/hooks/useArticleMutations";
import EditArticleDialog from "@/components/EditArticleDialog";

const RESULTS_LIMIT = 100;

const normalize = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/[«»"'.,;:!?()\-–—]/g, "").replace(/\s+/g, " ").trim();

const ManageArticlesSection = () => {
  const { data: articles, isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();
  const [query, setQuery] = useState("");
  const [dupesOnly, setDupesOnly] = useState(false);
  const [editing, setEditing] = useState<DbArticle | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const duplicateIds = useMemo(() => {
    if (!articles) return new Set<string>();
    const groups = new Map<string, DbArticle[]>();
    for (const a of articles) {
      const key = `${normalize(a.title)}|${normalize(a.journal)}|${a.year}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }
    const ids = new Set<string>();
    for (const group of groups.values()) {
      if (group.length > 1) group.forEach((a) => ids.add(a.id));
    }
    return ids;
  }, [articles]);

  const filtered = useMemo(() => {
    if (!articles) return [];
    let list = articles;
    if (dupesOnly) list = list.filter((a) => duplicateIds.has(a.id));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.authors || []).some((au) => (au || "").toLowerCase().includes(q)) ||
          (a.journal || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [articles, query, dupesOnly, duplicateIds]);

  const shown = filtered.slice(0, RESULTS_LIMIT);

  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-1">Управление статьями</h3>
      <p className="text-sm text-muted-foreground font-body mb-4">
        Поиск, редактирование ключевых слов и удаление статей (в т.ч. дублей).
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, автору, изданию…"
            className="pl-9"
          />
        </div>
        <Button
          variant={dupesOnly ? "default" : "outline"}
          onClick={() => setDupesOnly((v) => !v)}
          className="shrink-0"
        >
          {dupesOnly ? "Показаны только дубли" : "Показать только дубли"}
          {duplicateIds.size > 0 && (
            <Badge variant="secondary" className="ml-2">{duplicateIds.size}</Badge>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body py-4 text-center">
          {query || dupesOnly ? "Ничего не найдено" : "Введите запрос или включите фильтр дублей"}
        </p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {shown.map((a) => (
            <div key={a.id} className="border border-border rounded-md p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground leading-snug">{a.title}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {(a.authors || []).join(", ") || "Автор не указан"} · {a.journal || "Издание не указано"} · {a.year}
                    {a.issue ? `, №${a.issue}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(a.topics || []).length === 0 ? (
                      <span className="text-xs text-amber-600 font-body">нет ключевых слов</span>
                    ) : (
                      a.topics.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDeleteId(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {confirmDeleteId === a.id && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <span className="text-xs text-red-800 font-body flex-1">Удалить эту статью безвозвратно?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleteArticle.isPending}
                    onClick={() => deleteArticle.mutate(a.id, { onSettled: () => setConfirmDeleteId(null) })}
                  >
                    Удалить
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                    Отмена
                  </Button>
                </div>
              )}
            </div>
          ))}
          {filtered.length > RESULTS_LIMIT && (
            <p className="text-xs text-muted-foreground font-body text-center pt-2">
              Показано {RESULTS_LIMIT} из {filtered.length} — уточните запрос
            </p>
          )}
        </div>
      )}

      <EditArticleDialog article={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </Card>
  );
};

export default ManageArticlesSection;
