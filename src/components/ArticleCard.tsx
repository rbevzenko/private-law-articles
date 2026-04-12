import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Article } from "@/data/articles";
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
    article.issue && formatIssue(article.issue),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <>
      <article
        style={style}
        className="group relative rounded border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/8 hover:translate-y-[-1px] active:scale-[0.99] border-l-[3px] border-l-transparent hover:border-l-primary"
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

        {article.topics.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1">
            {article.topics.map((topic) => (
              <span
                key={topic}
                className="inline-block px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary/70 bg-primary/8 rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        <h3 className="mb-1.5 font-headline text-base font-semibold leading-snug text-foreground pr-14">
          {article.title}
        </h3>

        <p className="mb-1 font-body text-sm font-medium text-foreground/75">
          {article.authors.join(", ")}
        </p>

        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          {citation}
        </p>

        {article.section && (
          <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {article.section}
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
