import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUpdateArticle, UpdateArticleInput } from "@/hooks/useArticleMutations";
import { useArticles, useArticleTopics, useArticleJournals } from "@/hooks/useArticles";
import ComboboxInput from "@/components/ComboboxInput";
import type { Article } from "@/data/articles";

interface Props {
  article: Article;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditArticleDialog = ({ article, open, onOpenChange }: Props) => {
  const [title, setTitle] = useState(article.title);
  const [authors, setAuthors] = useState(article.authors.join(", "));
  const [journal, setJournal] = useState(article.journal);
  const [year, setYear] = useState(String(article.year));
  const [issue, setIssue] = useState(article.issue || "");
  const [topics, setTopics] = useState<string[]>(article.topics);
  const [newTopic, setNewTopic] = useState("");

  // Re-sync state when article changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(article.title);
      setAuthors(article.authors.join(", "));
      setJournal(article.journal);
      setYear(String(article.year));
      setIssue(article.issue || "");
      setTopics([...article.topics]);
      setNewTopic("");
    }
  }, [open, article]);

  const update = useUpdateArticle();
  const { data: allArticles } = useArticles();
  const { data: allTopics } = useArticleTopics();
  const { data: allJournals } = useArticleJournals();

  const authorSuggestions = useMemo(() => {
    if (!allArticles) return [];
    const set = new Set<string>();
    allArticles.forEach((a) => a.authors.forEach((au) => { if (au && au !== "Автор не указан") set.add(au); }));
    return Array.from(set).sort();
  }, [allArticles]);

  const handleAddTopic = () => {
    const t = newTopic.trim();
    if (t && !topics.includes(t)) {
      setTopics([...topics, t]);
    }
    setNewTopic("");
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleSave = () => {
    const payload: UpdateArticleInput = {
      id: article.id,
      title: title.trim(),
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      journal: journal.trim(),
      year: Number(year),
      issue: issue.trim() || null,
      topics,
    };
    update.mutate(payload, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать статью</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="edit-title">Название</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-authors">Авторы (через запятую)</Label>
            <ComboboxInput id="edit-authors" value={authors} onChange={setAuthors} suggestions={authorSuggestions} placeholder="Начните вводить имя автора…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-journal">Издание</Label>
              <ComboboxInput id="edit-journal" value={journal} onChange={setJournal} suggestions={allJournals || []} placeholder="Начните вводить название…" />
            </div>
            <div>
              <Label htmlFor="edit-year">Год</Label>
              <Input id="edit-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-issue">Выпуск</Label>
            <Input id="edit-issue" value={issue} onChange={(e) => setIssue(e.target.value)} />
          </div>
          <div>
            <Label>Ключевые слова</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2 min-h-[32px]">
              {topics.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(t)}
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
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditArticleDialog;
