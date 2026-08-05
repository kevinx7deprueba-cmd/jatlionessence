import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, categoryLabel, formatPrice, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración | JATLION Essence" },
      { name: "description", content: "Administra productos, precios y pedidos." },
      { property: "og:title", content: "Panel de administración | JATLION Essence" },
      { property: "og:description", content: "Gestión de catálogo y pedidos de JATLION Essence." },
    ],
  }),
  component: AdminPage,
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  stock: string;
  featured: boolean;
  is_active: boolean;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  category: CATEGORIES[0]!.slug,
  image_url: "",
  stock: "0",
  featured: false,
  is_active: true,
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const saveProduct = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name.trim().slice(0, 120),
        description: d.description.trim().slice(0, 800),
        price: Number(d.price) || 0,
        category: d.category,
        image_url: d.image_url.trim() || null,
        stock: Number(d.stock) || 0,
        featured: d.featured,
        is_active: d.is_active,
      };
      if (d.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setDraft(emptyDraft);
      toast.success("Producto guardado");
    },
    onError: () => toast.error("No se pudo guardar el producto"),
  });

  const removeProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto eliminado");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Pedido actualizado");
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-display text-3xl">Sin permisos de administrador</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta cuenta no tiene acceso al panel. Ingresa con la cuenta administradora.
        </p>
        <Button onClick={signOut} variant="outline" className="rounded-full">
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div>
            <p className="eyebrow">Panel</p>
            <Link to="/" className="font-display text-lg tracking-[0.2em]">
              JATLION
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Ver tienda</Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <Tabs defaultValue="productos">
          <TabsList>
            <TabsTrigger value="productos">Productos ({products.length})</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="pt-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="font-display text-3xl">Catálogo</h1>
              <Button
                className="gap-2 rounded-full"
                onClick={() => {
                  setDraft(emptyDraft);
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Nuevo producto
              </Button>
            </div>

            {products.length === 0 && (
              <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Aún no tienes productos. Agrega el primero con el botón de arriba.
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex gap-4 rounded-sm border border-border bg-card p-4 shadow-soft"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-display text-xl">{p.name}</h2>
                      {!p.is_active && (
                        <Badge variant="outline" className="text-[10px]">
                          Oculto
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{categoryLabel(p.category)}</p>
                    <p className="mt-1 text-sm">
                      {formatPrice(Number(p.price))} · Stock {p.stock}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => {
                        setDraft({
                          id: p.id,
                          name: p.name,
                          description: p.description,
                          price: String(p.price),
                          category: p.category,
                          image_url: p.image_url ?? "",
                          stock: String(p.stock),
                          featured: p.featured,
                          is_active: p.is_active,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeProduct.mutate(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pedidos" className="pt-6">
            <h1 className="mb-6 font-display text-3xl">Pedidos</h1>
            {orders.length === 0 && (
              <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Todavía no hay pedidos.
              </p>
            )}
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="rounded-sm border border-border bg-card p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl">{o.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {o.phone} · {o.address || "Sin dirección"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("es-BO")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xl">{formatPrice(Number(o.total))}</span>
                      <Select
                        value={o.status}
                        onValueChange={(status) => updateStatus.mutate({ id: o.id, status })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                    {(o.order_items ?? []).map(
                      (item: {
                        id: string;
                        product_name: string;
                        quantity: number;
                        unit_price: number;
                      }) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.quantity} × {item.product_name}
                          </span>
                          <span className="text-muted-foreground">
                            {formatPrice(Number(item.unit_price) * item.quantity)}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                  {o.notes && <p className="mt-3 text-sm text-muted-foreground">📝 {o.notes}</p>}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-light">
              {draft.id ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>Completa la información y el precio.</DialogDescription>
          </DialogHeader>

          <form
            id="product-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.name.trim().length < 2) {
                toast.error("Escribe el nombre del producto");
                return;
              }
              saveProduct.mutate(draft);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nombre</Label>
              <Input
                id="p-name"
                maxLength={120}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Descripción</Label>
              <Textarea
                id="p-desc"
                rows={3}
                maxLength={800}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Precio (Bs)</Label>
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
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-image">URL de la imagen (opcional)</Label>
              <Input
                id="p-image"
                placeholder="https://…"
                value={draft.image_url}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-sm border border-border p-3">
              <div>
                <p className="text-sm font-medium">Visible en la tienda</p>
                <p className="text-xs text-muted-foreground">Desactiva para ocultarlo</p>
              </div>
              <Switch
                checked={draft.is_active}
                onCheckedChange={(is_active) => setDraft({ ...draft, is_active })}
              />
            </div>
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
