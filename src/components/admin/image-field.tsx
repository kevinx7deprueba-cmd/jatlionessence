import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadStoreAsset, useAssetUrl } from "@/lib/assets";

export function ImageField({
  label,
  folder,
  value,
  onChange,
}: {
  label: string;
  folder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const preview = useAssetUrl(value || null);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            disabled={busy}
            onClick={() => ref.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {busy ? "Subiendo…" : "Subir imagen"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-full text-destructive"
              onClick={() => onChange("")}
            >
              <X className="mr-1 h-4 w-4" /> Quitar
            </Button>
          ) : null}
        </div>
      </div>
      <Input
        placeholder="o pega una URL https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            onChange(await uploadStoreAsset(file, folder));
            toast.success("Imagen subida");
          } catch {
            toast.error("No se pudo subir la imagen");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
