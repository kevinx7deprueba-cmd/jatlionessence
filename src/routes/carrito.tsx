import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";

import { StoreLayout } from "@/components/site/store-layout";
import { CartLine } from "@/components/site/cart-line";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/queries";
import { comboDiscount, comboRules, formatPrice } from "@/lib/store";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [
      { title: "Carrito | JATLION Essence" },
      { name: "description", content: "Revisa tus productos antes de realizar el pedido." },
      { property: "og:title", content: "Carrito | JATLION Essence" },
      { property: "og:description", content: "Revisa tus productos antes de realizar el pedido." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, count } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const shipping = Number(settings?.shipping_cost ?? 20);
  const rules = comboRules(settings);
  const discount = comboDiscount(subtotal, count, rules);
  const falta = Math.max(rules.minItems - count, 0);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="font-display text-4xl">Carrito</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Tu carrito está vacío.</p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {items.map((i) => (
                <CartLine key={i.id} item={i} />
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="mt-2 flex justify-between text-sm text-gold">
                  <span>🎁 Descuento combo ({rules.percent}%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              ) : falta > 0 ? (
                <p className="mt-2 rounded-md bg-secondary p-2 text-xs text-muted-foreground">
                  Agrega {falta} producto(s) más y obtén {rules.percent}% de descuento por combo.
                </p>
              ) : null}
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">📦 Envío departamental</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-2xl">
                <span>TOTAL</span>
                <span>{formatPrice(subtotal - discount + shipping)}</span>
              </div>
              <Button asChild className="mt-5 h-12 w-full rounded-full">
                <Link to="/checkout">CONTINUAR CON EL PEDIDO</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
