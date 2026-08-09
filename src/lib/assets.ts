import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PREFIX = "storage:";

export const isStorageRef = (value?: string | null) => Boolean(value?.startsWith(PREFIX));
export const toStorageRef = (path: string) => `${PREFIX}${path}`;

/** Resolves a stored image value (public URL or `storage:<path>` in the private "tienda" bucket). */
export function useAssetUrl(value?: string | null) {
  const [url, setUrl] = useState<string | null>(
    value && !isStorageRef(value) ? value : null,
  );

  useEffect(() => {
    let active = true;
    if (!value) {
      setUrl(null);
      return;
    }
    if (!isStorageRef(value)) {
      setUrl(value);
      return;
    }
    const path = value.slice(PREFIX.length);
    supabase.storage
      .from("tienda")
      .createSignedUrl(path, 60 * 60 * 24)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  return url;
}

export async function uploadStoreAsset(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("tienda").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return toStorageRef(path);
}

export async function uploadReceipt(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("comprobantes").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
