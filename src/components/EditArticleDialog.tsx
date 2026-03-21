import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateArticle, UpdateArticleInput } from "@/hooks/useArticleMutations";
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
  const [topics, setTopics] = useState(article.topics.join(", "));

  const update = useUpdateArticle();

  const handleSave = () => {
    const payload: UpdateArticleInput = {
      id: article.id,
      title: title.trim(),
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      journal: journal.trim(),
      year: Number(year),
      issue: issue.trim() || null,
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
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
            <Input id="edit-authors" value={authors} onChange={(e) => setAuthors(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-journal">Журнал</Label>
              <Input id="edit-journal" value={journal} onChange={(e) => setJournal(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-year">Год</Label>
              <Input id="edit-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-issue">Выпуск</Label>
              <Input id="edit-issue" value={issue} onChange={(e) => setIssue(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-topics">Темы (через запятую)</Label>
              <Input id="edit-topics" value={topics} onChange={(e) => setTopics(e.target.value)} />
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
