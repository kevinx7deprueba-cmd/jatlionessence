import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useAssetUrl } from "@/lib/assets";
import { useCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function CartLine({ item }: { item: CartItem }) {
  const image = useAssetUrl(item.image_url);
  const { setQty, remove } = useCart();

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <Link
        to="/producto/$id"
        params={{ id: item.id }}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary"
      >
        {image ? (
          <img src={image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-display text-lg leading-tight">{item.name}</p>
        <p className="text-xs text-muted-foreground">{formatPrice(item.price)} c/u</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-border">
            <button
              className="grid h-9 w-9 place-items-center"
              aria-label="Quitar uno"
              onClick={() => setQty(item.id, item.qty - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm">{item.qty}</span>
            <button
              className="grid h-9 w-9 place-items-center"
              aria-label="Agregar uno"
              onClick={() => setQty(item.id, item.qty + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="ml-auto font-semibold">{formatPrice(item.price * item.qty)}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-destructive"
            aria-label="Eliminar producto"
            onClick={() => remove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
