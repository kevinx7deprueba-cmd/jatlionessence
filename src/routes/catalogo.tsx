import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { StoreLayout } from "@/components/site/store-layout";
import { ProductCard } from "@/components/site/product-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesQuery, productsQuery } from "@/lib/queries";

type CatalogSearch = { categoria?: string };

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    categoria: typeof search['categoria'] === "string" ? search['categoria'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo | JATLION Essence" },
      {
        name: "description",
        content:
          "Explora perfumes, cuidado facial y corporal, cabello y bienestar. Busca, filtra y ordena por precio.",
      },
      { property: "og:title", content: "Catálogo | JATLION Essence" },
      { property: "og:description", content: "Todos los productos de JATLION Essence en un solo lugar." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { categoria } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState("recientes");

  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const list = useMemo(() => {
    let out = products;
    if (categoria) out = out.filter((p) => p.category === categoria);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle),
      );
    }
    const sorted = [...out];
    if (orden === "precio-asc") sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (orden === "precio-desc") sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (orden === "ofertas") sorted.sort((a, b) => Number(b.is_offer) - Number(a.is_offer));
    if (orden === "nuevos") sorted.sort((a, b) => Number(b.is_new) - Number(a.is_new));
    return sorted;
  }, [products, categoria, q, orden]);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-4xl">Catálogo</h1>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto…"
              className="h-12 pl-9"
            />
          </div>
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="h-12 sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Más recientes</SelectItem>
              <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
              <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
              <SelectItem value="ofertas">Ofertas primero</SelectItem>
              <SelectItem value="nuevos">Nuevos primero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => navigate({ search: {} })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
              !categoria ? "border-gold bg-gold text-ink" : "border-border bg-card"
            }`}
          >
            Todos
          </button>
          {categories
            .filter((c) => c.is_active)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ search: { categoria: c.slug } })}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                  categoria === c.slug ? "border-gold bg-gold text-ink" : "border-border bg-card"
                }`}
              >
                {c.name}
              </button>
            ))}
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando productos…</p>
        ) : list.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No encontramos productos con esos filtros.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
