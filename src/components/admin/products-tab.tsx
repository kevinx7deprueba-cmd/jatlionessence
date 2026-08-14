import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAssetUrl } from "@/lib/assets";
import { adminProductsQuery, categoriesQuery } from "@/lib/queries";
import { formatPrice, type Category, type Product } from "@/lib/store";
import { ImageField } from "./image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  category: string;
  image_url: string;
  stock: string;
  is_available: boolean;
  featured: boolean;
  is_new: boolean;
  is_offer: boolean;
  is_active: boolean;
};

const empty = (category: string): Draft => ({
  name: "",
  description: "",
  price: "",
  compare_at_price: "0",
  category,
  image_url: "",
  stock: "0",
  is_available: true,
  featured: false,
  is_new: false,
  is_offer: false,
  is_active: true,
});

function Row({
  product,
  categories,
  onEdit,
  onDelete,
}: {
  product: Product;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const img = useAssetUrl(product.image_url);
  const cat = categories.find((c) => c.slug === product.category)?.name ?? "Sin categoría";
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
        {img ? <img src={img} alt={product.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate font-display text-lg">{product.name}</h3>
          {!product.is_active && <Badge variant="outline">Oculto</Badge>}
          <Badge variant="outline">
            {product.is_available !== false && product.stock > 0 ? "🟢 Disponible" : "🔴 Agotado"}
          </Badge>
          {product.is_new && <Badge className="bg-gold text-ink">Nuevo</Badge>}
          {product.is_offer && <Badge variant="destructive">Oferta</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{cat}</p>
        <p className="text-sm">
          {formatPrice(Number(product.price))} · Stock {product.stock}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ProductsTab() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(adminProductsQuery);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const first = categories[0]?.slug ?? "fragancias-mujer";
  const [draft, setDraft] = useState<Draft>(empty(first));

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name.trim().slice(0, 120),
        description: d.description.trim().slice(0, 800),
        price: Number(d.price) || 0,
        compare_at_price: Number(d.compare_at_price) || 0,
        category: d.category,
        image_url: d.image_url.trim() || null,
        stock: Number(d.stock) || 0,
        is_available: d.is_available,
        featured: d.featured,
        is_new: d.is_new,
        is_offer: d.is_offer,
        is_active: d.is_active,
      };
      const { error } = d.id
        ? await supabase.from("products").update(payload).eq("id", d.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      toast.success("Producto guardado");
    },
    onError: () => toast.error("No se pudo guardar el producto"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto eliminado");
    },
    onError: () => toast.error("No se pudo eliminar (puede estar en un pedido o combo)"),
  });

  const q = search.trim().toLowerCase();
  const visibles = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 max-w-sm"
        />
        <Button
          className="h-11 gap-2 rounded-full"
          onClick={() => {
            setDraft(empty(first));
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibles.map((p) => (
          <Row
            key={p.id}
            product={p}
            categories={categories}
            onEdit={() => {
              setDraft({
                id: p.id,
                name: p.name,
                description: p.description,
                price: String(p.price),
                compare_at_price: String(p.compare_at_price ?? 0),
                category: p.category,
                image_url: p.image_url ?? "",
                stock: String(p.stock),
                is_available: p.is_available !== false,
                featured: p.featured,
                is_new: p.is_new,
                is_offer: p.is_offer,
                is_active: p.is_active,
              });
              setOpen(true);
            }}
            onDelete={() => remove.mutate(p.id)}
          />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {draft.id ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="product-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.name.trim().length < 2) {
                toast.error("Escribe el nombre");
                return;
              }
              save.mutate(draft);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nombre</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Descripción</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Precio Bs</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-compare">Antes Bs</Label>
                <Input
                  id="p-compare"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.compare_at_price}
                  onChange={(e) => setDraft({ ...draft, compare_at_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={draft.category}
                onValueChange={(category) => setDraft({ ...draft, category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-categoria">Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ImageField
              label="Imagen del producto"
              folder="productos"
              value={draft.image_url}
              onChange={(image_url) => setDraft({ ...draft, image_url })}
            />
            {(
              [
                ["is_available", "🟢 Disponibilidad (desactiva para marcar AGOTADO)"],
                ["is_active", "Visible en la tienda"],
                ["is_new", "Etiqueta “Nuevo”"],
                ["is_offer", "Etiqueta “Oferta”"],
                ["featured", "Destacado en inicio"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <p className="text-sm">{label}</p>
                <Switch
                  checked={draft[key]}
                  onCheckedChange={(v) => setDraft({ ...draft, [key]: v })}
                />
              </div>
            ))}
          </form>
          <DialogFooter>
            <Button type="submit" form="product-form" className="rounded-full">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
