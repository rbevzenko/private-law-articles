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

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async (): Promise<DbArticle[]> => {
      // Fetch all articles (bypass 1000 row default limit)
      let allData: DbArticle[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("year", { ascending: false })
          .order("title")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data as DbArticle[]);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });
}

export function useArticleTopics() {
  return useQuery({
    queryKey: ["article-topics"],
    queryFn: async (): Promise<string[]> => {
      const allTopics = new Set<string>();
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("articles")
          .select("topics")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach((row: any) => {
          (row.topics || []).forEach((t: string) => allTopics.add(t));
        });
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return Array.from(allTopics).sort();
    },
  });
}

export function useArticleJournals() {
  return useQuery({
    queryKey: ["article-journals"],
    queryFn: async (): Promise<string[]> => {
      const journals = new Set<string>();
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("articles")
          .select("journal")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        data.forEach((row: any) => journals.add(row.journal));
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return Array.from(journals).sort();
    },
  });
}
