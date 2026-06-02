import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCreateArticle } from "@/hooks/useArticleMutations";
import { useArticles, useArticleTopics, useArticleJournals } from "@/hooks/useArticles";
import ComboboxInput from "@/components/ComboboxInput";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateArticleDialog = ({ open, onOpenChange }: Props) => {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [journal, setJournal] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [issue, setIssue] = useState("");
  const [url, setUrl] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");

  const create = useCreateArticle();
  const { data: allArticles } = useArticles();
  const { data: allTopics } = useArticleTopics();
  const { data: allJournals } = useArticleJournals();

  const authorSuggestions = useMemo(() => {
    if (!allArticles) return [];
    const set = new Set<string>();
    allArticles.forEach((a) => a.authors.forEach((au) => { if (au && au !== "Автор не указан") set.add(au); }));
    return Array.from(set).sort();
  }, [allArticles]);
  const reset = () => {
    setTitle(""); setAuthors(""); setJournal(""); setYear(String(new Date().getFullYear()));
    setIssue(""); setUrl(""); setTopics([]); setNewTopic("");
  };

  const handleAddTopic = () => {
    const t = newTopic.trim();
    if (t && !topics.includes(t)) setTopics([...topics, t]);
    setNewTopic("");
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTopic(); }
  };

  const handleSave = () => {
    create.mutate(
      {
        title: title.trim(),
        authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
        journal: journal.trim(),
        year: Number(year),
        issue: issue.trim() || '',
        url: url.trim() || null,
        topics,
      },
      { onSuccess: () => { reset(); onOpenChange(false); } }
    );
  };

  const canSave = title.trim() && journal.trim() && year;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новая статья</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="create-title">Название</Label>
            <Input id="create-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="create-authors">Авторы (через запятую)</Label>
            <ComboboxInput id="create-authors" value={authors} onChange={setAuthors} suggestions={authorSuggestions} placeholder="Начните вводить имя автора…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="create-journal">Издание</Label>
              <ComboboxInput id="create-journal" value={journal} onChange={setJournal} suggestions={allJournals || []} placeholder="Начните вводить название…" />
            </div>
            <div>
              <Label htmlFor="create-year">Год</Label>
              <Input id="create-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="create-issue">Выпуск</Label>
            <Input id="create-issue" value={issue} onChange={(e) => setIssue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="create-url">URL статьи</Label>
            <Input id="create-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Ключевые слова</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2 min-h-[32px]">
              {topics.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => setTopics(topics.filter((x) => x !== t))}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <ComboboxInput
                value={newTopic}
                onChange={setNewTopic}
                suggestions={(allTopics || []).filter((t) => !topics.includes(t))}
                placeholder="Добавить ключевое слово…"
                onKeyDown={handleTopicKeyDown}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTopic} disabled={!newTopic.trim()}>
                +
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave} disabled={!canSave || create.isPending}>
            {create.isPending ? "Создание..." : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateArticleDialog;
