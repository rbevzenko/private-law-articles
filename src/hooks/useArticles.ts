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
const FETCH_TIMEOUT = 10_000; // 10 секунд

async function fetchAllArticles(): Promise<DbArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    let allData: DbArticle[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("year", { ascending: false })
        .order("title")
        .range(from, from + PAGE_SIZE - 1)
        .abortSignal(controller.signal);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = allData.concat(data as DbArticle[]);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return allData;
  } finally {
    clearTimeout(timer);
  }
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchAllArticles,
    staleTime: STALE_TIME,
    retry: 0,
  });
}

// Переиспользует кэш useArticles — отдельных запросов не делает
export function useArticleTopics() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchAllArticles,
    staleTime: STALE_TIME,
    retry: 0,
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
    retry: 0,
    select: (articles: DbArticle[]) => {
      const journals = new Set<string>();
      articles.forEach((a) => journals.add(a.journal));
      return Array.from(journals).sort();
    },
  });
}
