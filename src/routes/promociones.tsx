import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { StoreLayout } from "@/components/site/store-layout";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones | JATLION Essence" },
      {
        name: "description",
        content: "Ofertas y precios especiales en perfumes y cuidado personal JATLION Essence.",
      },
      { property: "og:title", content: "Promociones | JATLION Essence" },
      { property: "og:description", content: "Descuentos y combos vigentes en JATLION Essence." },
    ],
  }),
  component: PromosPage,
});

function PromosPage() {
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const promos = products.filter(
    (p) => p.is_offer || p.category === "promociones" || Number(p.compare_at_price) > Number(p.price),
  );

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-4xl">🔥 Promociones</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Productos en oferta y precios especiales por tiempo limitado.
        </p>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : promos.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Por ahora no hay promociones activas. Revisa el catálogo completo.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {promos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
