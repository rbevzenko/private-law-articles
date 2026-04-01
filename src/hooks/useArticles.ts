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
  // Сначала узнаём общее количество
  const { count, error: countError } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  const total = count || 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  // Загружаем все страницы параллельно
  const fetches = Array.from({ length: pages }, (_, i) =>
    supabase
      .from("articles")
      .select("*")
      .order("year", { ascending: false })
      .order("title")
      .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
  );

  const results = await Promise.all(fetches);
  const allData: DbArticle[] = [];
  for (const { data, error } of results) {
    if (error) throw error;
    allData.push(...(data as DbArticle[]));
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
