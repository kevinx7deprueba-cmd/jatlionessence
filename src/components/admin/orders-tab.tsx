import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Receipt } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useReceiptUrl } from "@/lib/assets";
import { adminOrdersQuery } from "@/lib/queries";
import { formatPrice, ORDER_STATUSES, statusLabel, transportLabel } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OrderRow = {
  id: string;
  order_number: string | null;
  created_at: string;
  customer_name: string;
  phone: string;
  department: string;
  destination: string;
  transport: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_method: string;
  receipt_path: string | null;
  delivery_method: string | null;
  notes: string;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function ReceiptDialog({ path, onClose }: { path: string | null; onClose: () => void }) {
  const url = useReceiptUrl(path);
  return (
    <Dialog open={Boolean(path)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Comprobante de pago</DialogTitle>
        </DialogHeader>
        {url ? (
          <img src={url} alt="Comprobante" className="max-h-[70vh] w-full object-contain" />
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Cargando comprobante…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({ order, onUpdate }: { order: OrderRow; onUpdate: (id: string, status: string) => void }) {
  const [receipt, setReceipt] = useState<string | null>(null);
  const wa = order.phone.replace(/\D/g, "");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-2xl">#{order.order_number}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("es-BO")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {order.delivery_method === "recojo" ? "🚶 Recogida en persona" : "📦 Envío"}
          </Badge>
          <Badge variant="outline">{statusLabel(order.status)}</Badge>
        </div>
      </div>

      <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">Cliente:</span> {order.customer_name}
        </p>
        <p>
          <span className="text-muted-foreground">WhatsApp:</span> {order.phone}
        </p>
        {order.delivery_method === "recojo" ? (
          <p>
            <span className="text-muted-foreground">Entrega:</span> 🚶 El cliente recoge en persona
          </p>
        ) : (
          <>
            <p>
              <span className="text-muted-foreground">Destino:</span> {order.department} →{" "}
              {order.destination}
            </p>
            <p>
              <span className="text-muted-foreground">Transporte:</span>{" "}
              {transportLabel(order.transport)}
            </p>
          </>
        )}
      </div>

      <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        {order.order_items?.map((i) => (
          <li key={i.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {i.quantity} × {i.product_name}
            </span>
            <span>{formatPrice(Number(i.unit_price) * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(Number(order.subtotal))}</span>
        </div>
        {Number(order.discount) > 0 && (
          <div className="flex justify-between text-gold">
            <span>Descuento combo</span>
            <span>-{formatPrice(Number(order.discount))}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Envío</span>
          <span>{formatPrice(Number(order.shipping_cost))}</span>
        </div>
        <div className="flex justify-between font-display text-xl">
          <span>TOTAL</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </div>

      {order.notes ? (
        <p className="mt-2 text-xs text-muted-foreground">Nota: {order.notes}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="h-10 rounded-full"
          disabled={!order.receipt_path}
          onClick={() => setReceipt(order.receipt_path)}
        >
          <Receipt className="mr-2 h-4 w-4" />
          {order.receipt_path ? "Ver comprobante" : "Sin comprobante"}
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-full">
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </a>
        </Button>
        {order.status === "pago_pendiente" && (
          <>
            <Button
              className="h-10 rounded-full"
              onClick={() => onUpdate(order.id, "pago_confirmado")}
            >
              ✓ Confirmar pago
            </Button>
            <Button
              variant="destructive"
              className="h-10 rounded-full"
              onClick={() => onUpdate(order.id, "cancelado")}
            >
              ✕ Rechazar comprobante
            </Button>
          </>
        )}
        <Select value={order.status} onValueChange={(v) => onUpdate(order.id, v)}>
          <SelectTrigger className="h-10 w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReceiptDialog path={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

export function OrdersTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(adminOrdersQuery);
  const orders = data as unknown as OrderRow[];
  const [filter, setFilter] = useState("todos");

  const stats = useMemo(() => {
    const by = (s: string) => orders.filter((o) => o.status === s).length;
    return {
      pendientes: by("pago_pendiente"),
      confirmados: by("pago_confirmado"),
      preparando: by("preparando"),
      enviados: by("enviado"),
      entregados: by("entregado"),
      cancelados: by("cancelado"),
      ventas: orders
        .filter((o) => o.status !== "cancelado" && o.status !== "pago_pendiente")
        .reduce((s, o) => s + Number(o.total), 0),
    };
  }, [orders]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error("No se pudo actualizar el pedido");
      return;
    }
    toast.success("Pedido actualizado");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const visibles = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="🟡 Pagos pendientes" value={stats.pendientes} />
        <Stat label="🟢 Pagos confirmados" value={stats.confirmados} />
        <Stat label="📦 Preparando" value={stats.preparando} />
        <Stat label="🚚 Enviados" value={stats.enviados} />
        <Stat label="✅ Entregados" value={stats.entregados} />
        <Stat label="❌ Cancelados" value={stats.cancelados} />
        <Stat label="Pedidos totales" value={orders.length} />
        <Stat label="Ventas" value={formatPrice(stats.ventas)} />
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="h-11 w-full sm:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los pedidos</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando pedidos…</p>
      ) : visibles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hay pedidos en este estado.
        </p>
      ) : (
        <div className="space-y-4">
          {visibles.map((o) => (
            <OrderCard key={o.id} order={o} onUpdate={update} />
          ))}
        </div>
      )}
    </div>
  );
}
