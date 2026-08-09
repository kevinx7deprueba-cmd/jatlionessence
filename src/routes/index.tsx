import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Zap, QrCode, Truck, MessageCircle } from "lucide-react";

import heroImage from "@/assets/hero.jpg";
import { StoreLayout } from "@/components/site/store-layout";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JATLION Essence | Perfumes y cuidado personal en Bolivia" },
      {
        name: "description",
        content:
          "Perfumes, cuidado facial, corporal y bienestar. Compra rápida, pago con QR y envíos a todos los departamentos de Bolivia.",
      },
      { property: "og:title", content: "JATLION Essence | Descubre tu esencia" },
      {
        property: "og:description",
        content: "Perfumes y cuidado personal con pago por QR y envíos departamentales.",
      },
    ],
  }),
  component: HomePage,
});

const BENEFITS = [
  { icon: ShieldCheck, text: "Productos de calidad" },
  { icon: Zap, text: "Compra rápida y sencilla" },
  { icon: QrCode, text: "Pago mediante QR" },
  { icon: Truck, text: "Envíos departamentales" },
  { icon: MessageCircle, text: "Atención personalizada por WhatsApp" },
];

function HomePage() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const destacados = products.filter((p) => p.featured).slice(0, 8);
  const nuevos = products.filter((p) => p.is_new).slice(0, 8);
  const vitrina = destacados.length ? destacados : products.slice(0, 8);

  return (
    <StoreLayout>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img
          src={heroImage}
          alt="Perfumes JATLION Essence"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <p className="eyebrow text-gold">JATLION Essence</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-6xl">
            Descubre tu <span className="text-gradient-gold">esencia</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
            Perfumes, cuidado personal y productos seleccionados para realzar tu estilo.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-full bg-gold px-8 text-ink hover:bg-gold/90">
              <Link to="/catalogo">🛍️ VER CATÁLOGO</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-white/30 bg-transparent px-8 text-ink-foreground hover:bg-white/10"
            >
              <Link to="/promociones">🔥 VER PROMOCIONES</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center font-display text-3xl">¿Por qué comprar con nosotros?</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BENEFITS.map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-soft"
            >
              <b.icon className="h-5 w-5 shrink-0 text-gold" />
              <span className="min-w-0 text-sm">{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-6">
          <h2 className="font-display text-3xl">Categorías</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories
              .filter((c) => c.is_active)
              .map((c) => (
                <Link
                  key={c.id}
                  to="/catalogo"
                  search={{ categoria: c.slug }}
                  className="rounded-lg border border-border bg-card p-4 shadow-soft transition-colors hover:border-gold"
                >
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
                </Link>
              ))}
          </div>
        </section>
      )}

      {vitrina.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl">Destacados</h2>
            <Link to="/catalogo" className="text-sm text-muted-foreground hover:text-foreground">
              Ver todo →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {vitrina.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {nuevos.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-12">
          <h2 className="font-display text-3xl">Nuevos</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {nuevos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
