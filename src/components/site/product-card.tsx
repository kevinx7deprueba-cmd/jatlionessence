import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAssetUrl } from "@/lib/assets";
import { useCart } from "@/lib/cart";
import { formatPrice, isBuyable, type Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product, combo = false }: { product: Product; combo?: boolean }) {
  const image = useAssetUrl(product.image_url);
  const { add } = useCart();
  const navigate = useNavigate();
  const agotado = !isBuyable(product);

  const cartItem = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image_url: product.image_url,
    stock: product.stock,
    combo,
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-3xl text-muted-foreground">
            JE
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.is_new && <Badge className="bg-ink text-ink-foreground">Nuevo</Badge>}
          {product.is_offer && <Badge className="bg-gold text-ink">Oferta</Badge>}
        </div>
        {agotado && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold tracking-widest">
              AGOTADO
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to="/producto/$id" params={{ id: product.id }} className="min-w-0">
          <h3 className="line-clamp-2 font-display text-lg leading-tight">{product.name}</h3>
        </Link>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-semibold">{formatPrice(Number(product.price))}</span>
          {Number(product.compare_at_price) > Number(product.price) ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(Number(product.compare_at_price))}
            </span>
          ) : null}
        </div>
        <Button
          className="h-11 w-full rounded-full"
          disabled={agotado}
          onClick={() => {
            add(cartItem, 1);
            toast.success(combo ? "Agregado a tu combo" : "Agregado al carrito");
          }}
        >
          {agotado ? "AGOTADO" : combo ? "Agregar a mi combo" : "Agregar al carrito"}
        </Button>
        {!combo && (
          <Button
            variant="outline"
            className="h-11 w-full rounded-full"
            disabled={agotado}
            onClick={() => {
              add(cartItem, 1);
              navigate({ to: "/checkout" });
            }}
          >
            Comprar ahora
          </Button>
        )}
      </div>
    </article>
  );
}
