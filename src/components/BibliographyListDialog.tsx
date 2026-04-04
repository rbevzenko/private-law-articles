import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListOrdered, Copy, Check, ArrowUpDown } from "lucide-react";
import type { Article } from "@/data/articles";

type SortMode = "alpha" | "year-asc" | "year-desc";

function formatGostCitation(a: Article): string {
  const authors = a.authors.length > 0 && a.authors[0] !== "Автор не указан"
    ? a.authors.join(", ")
    : "";

  const title = a.title;
  const journal = a.journal;
  const year = a.year;
  const issue = a.issue ? `№ ${a.issue}` : "";

  // ГОСТ format: Автор(ы). Название статьи // Название издания. Год. № выпуска.
  const parts: string[] = [];
  if (authors) parts.push(authors);
  
  let citation = parts.length > 0 ? `${parts.join("")}. ${title}` : title;
  citation += ` // ${journal}. ${year}.`;
  if (issue) citation += ` ${issue}.`;

  return citation;
}

interface Props {
  articles: Article[];
}

export default function BibliographyListDialog({ articles }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [copied, setCopied] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...articles];
    switch (sortMode) {
      case "alpha":
        return arr.sort((a, b) => {
          const aKey = a.authors[0] !== "Автор не указан" ? a.authors[0] : a.title;
          const bKey = b.authors[0] !== "Автор не указан" ? b.authors[0] : b.title;
          return aKey.localeCompare(bKey, "ru");
        });
      case "year-asc":
        return arr.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "ru"));
      case "year-desc":
        return arr.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "ru"));
    }
  }, [articles, sortMode]);

  const citations = useMemo(() => sorted.map((a, i) => `${i + 1}. ${formatGostCitation(a)}`), [sorted]);
  const fullText = citations.join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cycleSortMode = () => {
    setSortMode((m) => (m === "alpha" ? "year-asc" : m === "year-asc" ? "year-desc" : "alpha"));
  };

  const sortLabel: Record<SortMode, string> = {
    alpha: "А → Я",
    "year-asc": "Год ↑",
    "year-desc": "Год ↓",
  };

  if (articles.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <ListOrdered className="h-3.5 w-3.5" />
          Сформировать список
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Список литературы ({articles.length})</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cycleSortMode} className="gap-1.5 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortLabel[sortMode]}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Скопировано" : "Копировать"}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 mt-2">
          <ol className="space-y-2 font-body text-sm text-foreground list-none pl-0">
            {citations.map((c, i) => (
              <li key={sorted[i].id} className="leading-relaxed">
                {c}
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
