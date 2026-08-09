import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/site/store-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssetUrl } from "@/lib/assets";
import { useCart } from "@/lib/cart";
import { categoriesQuery } from "@/lib/queries";
import { formatPrice, type Product } from "@/lib/store";

export const Route = createFileRoute("/producto/$id")({
  head: () => ({
    meta: [
      { title: "Producto | JATLION Essence" },
      { name: "description", content: "Detalle del producto en JATLION Essence." },
      { property: "og:title", content: "Producto | JATLION Essence" },
      { property: "og:description", content: "Detalle del producto en JATLION Essence." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { data: categories = [] } = useQuery(categoriesQuery);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Product | null;
    },
  });

  const image = useAssetUrl(product?.image_url ?? null);
  const agotado = !product || product.stock <= 0;
  const categoryName = categories.find((c) => c.slug === product?.category)?.name ?? product?.category;

  if (isLoading) {
    return (
      <StoreLayout>
        <p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="px-5 py-24 text-center">
          <h1 className="font-display text-3xl">Producto no disponible</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/catalogo">Volver al catálogo</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-5 py-6">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Catálogo
        </Link>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
            {image ? (
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center font-display text-5xl text-muted-foreground">
                JE
              </div>
            )}
            {agotado && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <span className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold tracking-widest">
                  AGOTADO
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">{categoryName}</p>
            <h1 className="mt-1 font-display text-4xl leading-tight">{product.name}</h1>
            <div className="mt-2 flex gap-2">
              {product.is_new && <Badge className="bg-ink text-ink-foreground">Nuevo</Badge>}
              {product.is_offer && <Badge className="bg-gold text-ink">Oferta</Badge>}
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl">{formatPrice(Number(product.price))}</span>
              {Number(product.compare_at_price) > Number(product.price) ? (
                <span className="text-muted-foreground line-through">
                  {formatPrice(Number(product.compare_at_price))}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {agotado ? "Sin stock disponible" : `Disponible · ${product.stock} en stock`}
            </p>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button
                  className="grid h-11 w-11 place-items-center"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Quitar uno"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center">{qty}</span>
                <button
                  className="grid h-11 w-11 place-items-center"
                  onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))}
                  aria-label="Agregar uno"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                className="h-12 flex-1 rounded-full"
                disabled={agotado}
                onClick={() => {
                  add(
                    {
                      id: product.id,
                      name: product.name,
                      price: Number(product.price),
                      image_url: product.image_url,
                      stock: product.stock,
                    },
                    qty,
                  );
                  toast.success("Agregado al carrito");
                }}
              >
                {agotado ? "AGOTADO" : "Agregar al carrito"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
