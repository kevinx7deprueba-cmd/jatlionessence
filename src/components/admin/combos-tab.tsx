import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, combosQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/store";
import { ImageField } from "./image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Line = { product_id: string; quantity: number };
type Draft = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  discount_percent: string;
  sort_order: string;
  is_active: boolean;
  lines: Line[];
};

const empty: Draft = {
  name: "",
  description: "",
  image_url: "",
  discount_percent: "20",
  sort_order: "0",
  is_active: true,
  lines: [],
};

export function CombosTab() {
  const qc = useQueryClient();
  const { data: combos = [] } = useQuery(combosQuery);
  const { data: products = [] } = useQuery(adminProductsQuery);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name.trim().slice(0, 120),
        description: d.description.trim().slice(0, 500),
        image_url: d.image_url.trim() || null,
        discount_percent: Math.min(Math.max(Number(d.discount_percent) || 0, 0), 90),
        sort_order: Number(d.sort_order) || 0,
        is_active: d.is_active,
      };
      let comboId = d.id;
      if (comboId) {
        const { error } = await supabase.from("combos").update(payload).eq("id", comboId);
        if (error) throw error;
        const { error: delErr } = await supabase
          .from("combo_items")
          .delete()
          .eq("combo_id", comboId);
        if (delErr) throw delErr;
      } else {
        const { data, error } = await supabase.from("combos").insert(payload).select("id").single();
        if (error) throw error;
        comboId = data.id;
      }
      const rows = d.lines
        .filter((l) => l.product_id)
        .map((l) => ({ combo_id: comboId!, product_id: l.product_id, quantity: l.quantity }));
      if (rows.length) {
        const { error } = await supabase.from("combo_items").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos"] });
      setOpen(false);
      toast.success("Combo guardado");
    },
    onError: () => toast.error("No se pudo guardar el combo"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos"] });
      toast.success("Combo eliminado");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  const priceOf = (lines: Line[]) =>
    lines.reduce((s, l) => {
      const p = products.find((x) => x.id === l.product_id);
      return s + (p ? Number(p.price) * l.quantity : 0);
    }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Crea packs con descuento propio. El descuento por “armar tu combo” se configura en la
          pestaña Configuración.
        </p>
        <Button
          className="h-11 shrink-0 gap-2 rounded-full"
          onClick={() => {
            setDraft(empty);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aún no hay combos creados.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {combos.map((c) => {
            const lines = (c.combo_items ?? []).map((ci) => ({
              product_id: ci.product_id,
              quantity: ci.quantity,
            }));
            const normal = priceOf(lines);
            return (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-xl">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {lines.length} producto(s) · -{c.discount_percent}%
                    </p>
                  </div>
                  {!c.is_active && <Badge variant="outline">Oculto</Badge>}
                </div>
                <p className="mt-2 text-sm">
                  {formatPrice(normal * (1 - Number(c.discount_percent) / 100))}{" "}
                  <span className="text-muted-foreground line-through">{formatPrice(normal)}</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setDraft({
                        id: c.id,
                        name: c.name,
                        description: c.description,
                        image_url: c.image_url ?? "",
                        discount_percent: String(c.discount_percent),
                        sort_order: String(c.sort_order),
                        is_active: c.is_active,
                        lines,
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => remove.mutate(c.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {draft.id ? "Editar combo" : "Nuevo combo"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="combo-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.name.trim().length < 2) {
                toast.error("Escribe el nombre del combo");
                return;
              }
              if (draft.lines.length === 0) {
                toast.error("Agrega al menos un producto");
                return;
              }
              save.mutate(draft);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nombre</Label>
              <Input
                id="c-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Descripción</Label>
              <Textarea
                id="c-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-disc">Descuento %</Label>
                <Input
                  id="c-disc"
                  type="number"
                  min="0"
                  max="90"
                  value={draft.discount_percent}
                  onChange={(e) => setDraft({ ...draft, discount_percent: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-order">Orden</Label>
                <Input
                  id="c-order"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                />
              </div>
            </div>
            <ImageField
              label="Imagen del combo"
              folder="combos"
              value={draft.image_url}
              onChange={(image_url) => setDraft({ ...draft, image_url })}
            />

            <div className="space-y-2">
              <Label>Productos del combo</Label>
              {draft.lines.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                    value={l.product_id}
                    onChange={(e) => {
                      const lines = [...draft.lines];
                      lines[i] = { ...l, product_id: e.target.value };
                      setDraft({ ...draft, lines });
                    }}
                  >
                    <option value="">Elegir producto…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatPrice(Number(p.price))}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    value={l.quantity}
                    onChange={(e) => {
                      const lines = [...draft.lines];
                      lines[i] = { ...l, quantity: Math.max(1, Number(e.target.value) || 1) };
                      setDraft({ ...draft, lines });
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() =>
                      setDraft({ ...draft, lines: draft.lines.filter((_, x) => x !== i) })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full"
                onClick={() =>
                  setDraft({ ...draft, lines: [...draft.lines, { product_id: "", quantity: 1 }] })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Agregar producto
              </Button>
              <p className="text-sm text-muted-foreground">
                Precio normal {formatPrice(priceOf(draft.lines))} · Con descuento{" "}
                {formatPrice(
                  priceOf(draft.lines) * (1 - (Number(draft.discount_percent) || 0) / 100),
                )}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <p className="text-sm">Visible en la tienda</p>
              <Switch
                checked={draft.is_active}
                onCheckedChange={(is_active) => setDraft({ ...draft, is_active })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="combo-form" className="rounded-full">
              Guardar combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
