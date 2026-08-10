import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/site/store-layout";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAssetUrl } from "@/lib/assets";
import { useCart } from "@/lib/cart";
import { combosQuery, productsQuery, settingsQuery } from "@/lib/queries";
import { comboDiscount, comboRules, formatPrice, type Combo, type Product } from "@/lib/store";

export const Route = createFileRoute("/combos")({
  head: () => ({
    meta: [
      { title: "Combos y descuentos | JATLION Essence" },
      {
        name: "description",
        content:
          "Arma tu combo y ahorra: combos listos y descuento automático al llevar varios productos.",
      },
      { property: "og:title", content: "Combos y descuentos | JATLION Essence" },
      {
        property: "og:description",
        content: "Combos listos y descuento por armar tu propio combo en JATLION Essence.",
      },
    ],
  }),
  component: CombosPage,
});

function ComboCard({ combo, products }: { combo: Combo; products: Product[] }) {
  const image = useAssetUrl(combo.image_url);
  const { add } = useCart();

  const lines = (combo.combo_items ?? [])
    .map((ci) => ({ product: products.find((p) => p.id === ci.product_id), qty: ci.quantity }))
    .filter((l): l is { product: Product; qty: number } => Boolean(l.product));

  const normal = lines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);
  const pct = Number(combo.discount_percent);
  const final = Math.round(normal * (1 - pct / 100) * 100) / 100;
  const agotado = lines.length === 0 || lines.some((l) => l.product.stock <= 0);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <div className="relative aspect-[4/3] bg-secondary">
        {image ? (
          <img src={image} alt={combo.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-3xl text-muted-foreground">
            JE
          </div>
        )}
        <Badge className="absolute left-2 top-2 bg-gold text-ink">-{pct}%</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-2xl leading-tight">{combo.name}</h3>
        {combo.description ? (
          <p className="text-sm text-muted-foreground">{combo.description}</p>
        ) : null}
        <ul className="mt-1 space-y-1 text-sm">
          {lines.map((l) => (
            <li key={l.product.id} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span className="min-w-0">
                {l.qty} × {l.product.name}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-2xl">{formatPrice(final)}</span>
          <span className="text-sm text-muted-foreground line-through">{formatPrice(normal)}</span>
        </div>
        <Button
          className="h-11 w-full rounded-full"
          disabled={agotado}
          onClick={() => {
            lines.forEach((l) =>
              add(
                {
                  id: l.product.id,
                  name: l.product.name,
                  price: Number(l.product.price),
                  image_url: l.product.image_url,
                  stock: l.product.stock,
                },
                l.qty,
              ),
            );
            toast.success("Combo agregado al carrito");
          }}
        >
          {agotado ? "NO DISPONIBLE" : "Agregar combo al carrito"}
        </Button>
      </div>
    </article>
  );
}

function CombosPage() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const { data: combos = [], isLoading } = useQuery(combosQuery);
  const { count, subtotal } = useCart();

  const rules = comboRules(settings);
  const activos = combos.filter((c) => c.is_active);
  const falta = Math.max(rules.minItems - count, 0);
  const descuento = comboDiscount(subtotal, count, rules);

  const destacados = useMemo(
    () => products.filter((p) => p.stock > 0).slice(0, 12),
    [products],
  );

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-4xl">🎁 Combos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Llévate más y paga menos: combos armados por nosotros o arma el tuyo con los productos que
          quieras.
        </p>

        <section className="mt-6 rounded-lg border border-gold/40 bg-secondary p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl">Arma tu combo y ahorra {rules.percent}%</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrega {rules.minItems} productos o más al carrito y el descuento del {rules.percent}% se
            aplica automáticamente al total.
          </p>

          <div className="mt-4">
            <Progress value={Math.min((count / Math.max(rules.minItems, 1)) * 100, 100)} />
            <p className="mt-2 text-sm">
              {falta > 0 ? (
                <>
                  Llevas <strong>{count}</strong> producto(s). Te falta{" "}
                  <strong>{falta}</strong> para activar tu descuento.
                </>
              ) : (
                <>
                  ✅ Descuento activo: ahorras <strong>{formatPrice(descuento)}</strong> en este
                  pedido.
                </>
              )}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild className="h-11 rounded-full">
              <Link to="/catalogo">Elegir productos</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full">
              <Link to="/carrito">Ver mi carrito ({count})</Link>
            </Button>
          </div>
        </section>

        <h2 className="mt-10 font-display text-3xl">Combos listos</h2>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : activos.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aún no hay combos publicados. Arma el tuyo con el catálogo y obtén tu descuento.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activos.map((c) => (
              <ComboCard key={c.id} combo={c} products={products} />
            ))}
          </div>
        )}

        <h2 className="mt-10 font-display text-3xl">Suma productos a tu combo</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {destacados.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
