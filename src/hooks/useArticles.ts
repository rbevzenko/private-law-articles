import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  issue: string | null;
  section: string | null;
  topics: string[];
  url: string | null;
  source_url: string | null;
  created_at: string;
}

const PAGE_SIZE = 1000;
const STALE_TIME = 5 * 60 * 1000; // 5 минут

async function fetchAllArticles(): Promise<DbArticle[]> {
  // Загружаем первую страницу
  const { data: firstPage, error: firstError } = await supabase
    .from("articles")
    .select("*")
    .order("year", { ascending: false })
    .order("title")
    .range(0, PAGE_SIZE - 1);

  if (firstError) throw firstError;
  if (!firstPage || firstPage.length < PAGE_SIZE) return (firstPage || []) as DbArticle[];

  // Если первая страница полная — параллельно загружаем остальные (макс. 19 страниц = 20 000 статей)
  const MAX_EXTRA_PAGES = 19;
  const results = await Promise.all(
    Array.from({ length: MAX_EXTRA_PAGES }, (_, i) =>
      supabase
        .from("articles")
        .select("*")
        .order("year", { ascending: false })
        .order("title")
        .range((i + 1) * PAGE_SIZE, (i + 2) * PAGE_SIZE - 1)
    )
  );

  const allData: DbArticle[] = [...(firstPage as DbArticle[])];
  for (const { data, error } of results) {
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...(data as DbArticle[]));
    if (data.length < PAGE_SIZE) break;
  }
  return allData;
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchAllArticles,
    staleTime: STALE_TIME,
  });
}

// Переиспользует кэш useArticles — отдельных запросов не делает
export function useArticleTopics() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchAllArticles,
    staleTime: STALE_TIME,
    select: (articles: DbArticle[]) => {
      const topics = new Set<string>();
      articles.forEach((a) => (a.topics || []).forEach((t) => topics.add(t)));
      return Array.from(topics).sort();
    },
  });
}

// Переиспользует кэш useArticles — отдельных запросов не делает
export function useArticleJournals() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchAllArticles,
    staleTime: STALE_TIME,
    select: (articles: DbArticle[]) => {
      const journals = new Set<string>();
      articles.forEach((a) => journals.add(a.journal));
      return Array.from(journals).sort();
    },
  });
}
