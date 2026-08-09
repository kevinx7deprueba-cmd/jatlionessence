import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Destination, Product, StoreSettings } from "./store";

export const settingsQuery = queryOptions({
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings | null> => {
    const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as StoreSettings | null;
  },
  staleTime: 60_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Category[];
  },
  staleTime: 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

export const destinationsQuery = queryOptions({
  queryKey: ["destinations"],
  queryFn: async (): Promise<Destination[]> => {
    const { data, error } = await supabase
      .from("shipping_destinations")
      .select("*")
      .order("department", { ascending: true })
      .order("destination", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Destination[];
  },
});
