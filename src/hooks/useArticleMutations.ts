import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["article-topics"] });
      qc.invalidateQueries({ queryKey: ["article-journals"] });
      toast.success("Статья удалена");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface UpdateArticleInput {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  issue?: string | null;
  section?: string | null;
  topics: string[];
  url?: string | null;
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateArticleInput) => {
      const { error } = await supabase.from("articles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["article-topics"] });
      qc.invalidateQueries({ queryKey: ["article-journals"] });
      toast.success("Статья обновлена");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
