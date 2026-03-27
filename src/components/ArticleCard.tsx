import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Article } from "@/data/articles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteArticle } from "@/hooks/useArticleMutations";
import EditArticleDialog from "@/components/EditArticleDialog";

interface ArticleCardProps {
  article: Article;
  style?: React.CSSProperties;
  canEdit?: boolean;
}

const ArticleCard = ({ article, style, canEdit = false }: ArticleCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteArticle = useDeleteArticle();

  const monthMap: Record<string, string> = {
    'январь': '1', 'февраль': '2', 'март': '3', 'апрель': '4',
    'май': '5', 'июнь': '6', 'июль': '7', 'август': '8',
    'сентябрь': '9', 'октябрь': '10', 'ноябрь': '11', 'декабрь': '12',
    'января': '1', 'февраля': '2', 'марта': '3', 'апреля': '4',
    'мая': '5', 'июня': '6', 'июля': '7', 'августа': '8',
    'сентября': '9', 'октября': '10', 'ноября': '11', 'декабря': '12',
  };

  const formatIssue = (issue: string) => {
    const lower = issue.toLowerCase().trim();
    const num = monthMap[lower];
    if (num) return `№ ${num}`;
    return issue.startsWith("№") ? issue : `№ ${issue}`;
  };

  const citation = [
    article.journal,
    article.year,
    article.volume && `Т. ${article.volume}`,
    article.issue && formatIssue(article.issue),
    article.pages && `С. ${article.pages}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <>
      <article
        style={style}
        className="group relative rounded-md border border-border bg-card p-6 transition-[box-shadow,transform] duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
      >
        {/* Action buttons */}
        {canEdit && (
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
              title="Редактировать"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              title="Удалить"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {article.topics.map((topic) => (
            <Badge
              key={topic}
              variant="secondary"
              className="font-body text-xs font-medium tracking-wide"
            >
              {topic}
            </Badge>
          ))}
        </div>

        <h3 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-foreground pr-16">
          {article.title}
        </h3>

        <p className="mb-2 font-body text-sm font-medium text-foreground/80">
          {article.authors.join(", ")}
        </p>

        <p className="mb-3 font-body text-sm text-muted-foreground">
          {citation}
        </p>

        {article.abstract && (
          <p className="font-body text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {article.abstract}
          </p>
        )}
      </article>

      <EditArticleDialog article={article} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статью?</AlertDialogTitle>
            <AlertDialogDescription>
              «{article.title}» будет удалена без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteArticle.mutate(article.id)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ArticleCard;
