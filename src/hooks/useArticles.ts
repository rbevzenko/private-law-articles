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
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("year", { ascending: false })
        .order("title");

      if (error) throw error;
      return (data as DbArticle[]) || [];
    },
  });
}

export function useArticleTopics() {
  return useQuery({
    queryKey: ["article-topics"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("topics");

      if (error) throw error;

      const allTopics = new Set<string>();
      (data || []).forEach((row: any) => {
        (row.topics || []).forEach((t: string) => allTopics.add(t));
      });

      return Array.from(allTopics).sort();
    },
  });
}

export function useArticleJournals() {
  return useQuery({
    queryKey: ["article-journals"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("journal");

      if (error) throw error;

      const journals = new Set<string>();
      (data || []).forEach((row: any) => journals.add(row.journal));

      return Array.from(journals).sort();
    },
  });
}
