import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Plus, Minus, Trash2, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, categoryLabel, formatPrice, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JATLION Essence — Perfumería y cuidado personal" },
      {
        name: "description",
        content:
          "Haz tu pedido en línea: fragancias para hombre y mujer, cuerpo y baño, rostro, nutrición y bienestar, cabello y accesorios.",
      },
      { property: "og:title", content: "JATLION Essence — Perfumería y cuidado personal" },
      {
        property: "og:description",
        content: "Fragancias, cuidado de la piel, bienestar y accesorios con entrega a domicilio.",
      },
    ],
  }),
  component: Storefront,
});

type CartLine = { product: Product; quantity: number };

function Storefront() {
  const [category, setCategory] = useState<string>("todos");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [sending, setSending] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

  const visible = useMemo(
    () => (category === "todos" ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  const total = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const count = cart.reduce((sum, l) => sum + l.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === product.id);
      if (found) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} agregado al pedido`);
  };

  const changeQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Tu pedido está vacío");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("Escribe tu nombre completo");
      return;
    }
    if (form.phone.trim().length < 6) {
      toast.error("Escribe un teléfono válido");
      return;
    }

    setSending(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: form.name.trim().slice(0, 100),
          phone: form.phone.trim().slice(0, 30),
          address: form.address.trim().slice(0, 300),
          notes: form.notes.trim().slice(0, 500),
          total,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.map((l) => ({
          order_id: order.id,
          product_id: l.product.id,
          product_name: l.product.name,
          unit_price: l.product.price,
          quantity: l.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      setCart([]);
      setForm({ name: "", phone: "", address: "", notes: "" });
      setCartOpen(false);
      toast.success("¡Pedido enviado! Te contactaremos muy pronto.");
    } catch (err) {
      console.error(err);
      toast.error("No pudimos enviar tu pedido. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-xl tracking-[0.3em] text-foreground">
            JATLION
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#catalogo" className="transition-colors hover:text-foreground">
              Catálogo
            </a>
            <a href="#categorias" className="transition-colors hover:text-foreground">
              Categorías
            </a>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Administrar
            </Link>
          </nav>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="default" size="sm" className="gap-2 rounded-full px-5">
                <ShoppingBag className="h-4 w-4" />
                Pedido {count > 0 && <span className="ml-1">({count})</span>}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl font-light">Tu pedido</SheetTitle>
                <SheetDescription>
                  Confirma tus datos y te contactamos para coordinar la entrega.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                {cart.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Todavía no agregaste productos.
                  </p>
                )}
                {cart.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(Number(line.product.price))} c/u
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => changeQty(line.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{line.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => changeQty(line.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="ml-auto h-7 w-7 text-muted-foreground"
                          onClick={() => changeQty(line.product.id, -line.quantity)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(Number(line.product.price) * line.quantity)}
                    </p>
                  </div>
                ))}

                <form onSubmit={submitOrder} className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-y border-border py-3">
                    <span className="eyebrow">Total</span>
                    <span className="font-display text-2xl">{formatPrice(total)}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      maxLength={100}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                    <Input
                      id="phone"
                      maxLength={30}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Dirección de entrega</Label>
                    <Input
                      id="address"
                      maxLength={300}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      maxLength={500}
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-full" disabled={sending}>
                    {sending ? "Enviando…" : "Enviar pedido"}
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        <section className="surface-hero border-b border-border/60">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="eyebrow">Perfumería & cuidado personal</p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
                JATLION Essence
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Fragancias, piel, cabello y bienestar seleccionados con criterio. Elige tus
                favoritos y haz tu pedido en un minuto.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href="#catalogo">Ver catálogo</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <a href="#categorias">Explorar categorías</a>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Productos originales
                </span>
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Entrega a domicilio
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Pago al recibir
                </span>
              </div>
            </div>
            <img
              src={heroImage}
              alt="Frascos de perfume sobre tela de seda en tonos arena"
              width={1600}
              height={1104}
              className="rounded-sm object-cover shadow-lift"
            />
          </div>
        </section>

        <section id="categorias" className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">Categorías</p>
          <h2 className="mt-2 font-display text-4xl">Todo lo que necesitas</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  setCategory(c.slug);
                  document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group rounded-sm border border-border bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                <p className="font-display text-xl">{c.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="catalogo" className="mx-auto max-w-6xl px-5 pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Catálogo</p>
              <h2 className="mt-2 font-display text-4xl">Nuestros productos</h2>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <FilterChip active={category === "todos"} onClick={() => setCategory("todos")}>
              Todos
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
              >
                {c.label}
              </FilterChip>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && <p className="text-sm text-muted-foreground">Cargando productos…</p>}
            {!isLoading && visible.length === 0 && (
              <div className="col-span-full rounded-sm border border-dashed border-border bg-secondary/40 p-12 text-center">
                <p className="font-display text-2xl">Aún no hay productos en esta categoría</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Inicia sesión en el panel de administración para agregar tus productos y precios.
                </p>
                <Button asChild variant="outline" className="mt-5 rounded-full">
                  <Link to="/auth">Ir al panel</Link>
                </Button>
              </div>
            )}
            {visible.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card shadow-soft transition-transform hover:-translate-y-1"
              >
                <div className="aspect-4/3 overflow-hidden bg-secondary">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-3xl text-muted-foreground">
                      JATLION
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <Badge variant="secondary" className="w-fit rounded-full text-[10px]">
                    {categoryLabel(p.category)}
                  </Badge>
                  <h3 className="mt-3 font-display text-2xl leading-tight">{p.name}</h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl">{formatPrice(Number(p.price))}</span>
                    <Button size="sm" className="rounded-full" onClick={() => addToCart(p)}>
                      Agregar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-secondary/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-10 text-center text-sm text-muted-foreground">
          <p className="font-display text-2xl tracking-[0.25em] text-foreground">JATLION ESSENCE</p>
          <p>Pedidos en línea · Entrega a domicilio</p>
          <Link to="/auth" className="text-xs underline underline-offset-4">
            Acceso administrador
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
