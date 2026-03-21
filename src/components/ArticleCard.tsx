import { Article } from "@/data/articles";
import { Badge } from "@/components/ui/badge";

interface ArticleCardProps {
  article: Article;
  style?: React.CSSProperties;
}

const ArticleCard = ({ article, style }: ArticleCardProps) => {
  const citation = [
    article.journal,
    article.year,
    article.volume && `Т. ${article.volume}`,
    article.issue && `№ ${article.issue}`,
    article.pages && `С. ${article.pages}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <article
      style={style}
      className="group rounded-md border border-border bg-card p-6 transition-[box-shadow,transform] duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
    >
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

      <h3 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-foreground">
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
  );
};

export default ArticleCard;
