import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import { StoreLayout } from "@/components/site/store-layout";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";
import { formatPrice, transportLabel } from "@/lib/store";
import { readOrderSnapshot } from "@/lib/order-storage";

export const Route = createFileRoute("/pedido/$numero")({
  head: () => ({
    meta: [
      { title: "Pedido recibido | JATLION Essence" },
      { name: "description", content: "Confirmación de tu pedido en JATLION Essence." },
      { property: "og:title", content: "Pedido recibido | JATLION Essence" },
      { property: "og:description", content: "Confirmación de tu pedido en JATLION Essence." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { numero } = Route.useParams();
  const { data: settings } = useQuery(settingsQuery);
  const order = typeof window !== "undefined" ? readOrderSnapshot(numero) : null;
  const whatsapp = (settings?.whatsapp ?? "59174968246").replace(/\D/g, "");

  const message = order
    ? `Hola, JATLION Essence.\nAcabo de realizar el pedido #${order.order_number}.\n\nCliente:\n${order.customer_name}\n\nProductos:\n${order.items
        .map((i) => `${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`)
        .join("\n")}\n\nSubtotal:\n${formatPrice(order.subtotal)}\nEnvío:\n${formatPrice(
        order.shipping,
      )}\nTOTAL:\n${formatPrice(order.total)}\n\nDepartamento:\n${order.department}\nDestino:\n${
        order.destination
      }\nTransporte:\n${transportLabel(order.transport)}\n\nMétodo de pago:\nQR\n\nAdjunto mi comprobante.`
    : `Hola, JATLION Essence. Acabo de realizar el pedido #${numero}. Adjunto mi comprobante.`;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="font-display text-3xl">🎉 ¡PEDIDO RECIBIDO!</h1>
          <p className="mt-2 font-display text-4xl tracking-widest">#{numero}</p>
          <p className="mt-3 inline-block rounded-full bg-secondary px-4 py-1.5 text-xs">
            🟡 Pago pendiente de verificación
          </p>
        </div>

        {order && (
          <div className="mt-4 space-y-2 rounded-lg border border-border bg-card p-5 text-sm">
            <p className="font-display text-2xl">{order.customer_name}</p>
            <ul className="space-y-1 border-t border-border pt-3">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {i.qty} × {i.name}
                  </span>
                  <span>{formatPrice(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount ? (
              <div className="flex justify-between text-gold">
                <span>Descuento combo</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-display text-2xl">
              <span>TOTAL</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <p className="pt-3 text-muted-foreground">
              {order.department} → {order.destination} · {transportLabel(order.transport)} · Pago con
              QR
            </p>
          </div>
        )}

        <Button asChild className="mt-5 h-14 w-full rounded-full text-base">
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-2 h-5 w-5" /> ENVIAR PEDIDO POR WHATSAPP
          </a>
        </Button>
        <Button asChild variant="outline" className="mt-3 h-12 w-full rounded-full">
          <Link to="/catalogo">Seguir comprando</Link>
        </Button>
      </div>
    </StoreLayout>
  );
}
