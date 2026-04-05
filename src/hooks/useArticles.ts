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
const FETCH_TIMEOUT = 60_000; // 60 секунд — достаточно для больших баз
const PER_BATCH_TIMEOUT = 15_000; // 15 секунд на один батч

async function fetchAllArticles(): Promise<DbArticle[]> {
  let allData: DbArticle[] = [];
  let from = 0;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_BATCH_TIMEOUT);

    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("year", { ascending: false })
        .order("title")
        .range(from, from + PAGE_SIZE - 1)
        .abortSignal(controller.signal);

      clearTimeout(timer);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = allData.concat(data as DbArticle[]);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    } catch (err) {
      clearTimeout(timer);
      // Если уже загрузили часть данных — вернём их, а не крашим всё
      if (allData.length > 0) {
        console.warn(`[useArticles] Partial load: got ${allData.length} articles, batch at ${from} failed`, err);
        return allData;
      }
      throw err;
    }
  }

  return allData;
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
