import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, QrCode, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { StoreLayout } from "@/components/site/store-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssetUrl, uploadReceipt } from "@/lib/assets";
import { useCart } from "@/lib/cart";
import { destinationsQuery, settingsQuery } from "@/lib/queries";
import { comboDiscount, comboRules, DEPARTMENTS, formatPrice, transportLabel } from "@/lib/store";
import { saveOrderSnapshot } from "@/lib/order-storage";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Realizar pedido | JATLION Essence" },
      {
        name: "description",
        content: "Completa tus datos, elige tu destino y paga con QR. Envíos a todo Bolivia.",
      },
      { property: "og:title", content: "Realizar pedido | JATLION Essence" },
      { property: "og:description", content: "Checkout rápido con pago por QR y envío departamental." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const { data: destinations = [] } = useQuery(destinationsQuery);
  const qrUrl = useAssetUrl(settings?.qr_image_url ?? null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [transport, setTransport] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shipping = Number(settings?.shipping_cost ?? 20);
  const rules = comboRules(settings);
  const discount = comboDiscount(items, rules);
  const total = subtotal - discount + shipping;

  const activeDestinations = useMemo(
    () => destinations.filter((d) => d.is_active && d.department === department),
    [destinations, department],
  );
  const destination = activeDestinations.find((d) => d.id === destinationId);
  const availableTransports = destination?.transports ?? [];

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="px-5 py-24 text-center">
          <h1 className="font-display text-3xl">Tu carrito está vacío</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/catalogo">Ver catálogo</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const submit = async () => {
    if (name.trim().length < 2) {
      toast.error("Escribe tu nombre completo");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      toast.error("Escribe tu número de WhatsApp");
      return;
    }
    if (!department) {
      toast.error("Selecciona tu departamento");
      return;
    }
    if (!destination) {
      toast.error("Selecciona tu destino");
      return;
    }
    if (!transport) {
      toast.error("Selecciona el tipo de transporte");
      return;
    }
    if (!receiptFile) {
      toast.error("Sube el comprobante de tu pago por QR");
      return;
    }


    setSubmitting(true);
    try {
      const receiptPath = await uploadReceipt(receiptFile);
      const { data, error } = await supabase.rpc("create_order", {
        _customer_name: name,
        _phone: phone,
        _department: department,
        _destination: destination.destination,
        _transport: transport,
        _notes: notes,
        _shipping_cost: shipping,
        _receipt_path: receiptPath,
        _items: items.map((i) => ({ id: i.id, qty: i.qty, combo: Boolean(i.combo) })),
      });
      if (error) throw error;

      const orderNumber = String(data);
      saveOrderSnapshot({
        order_number: orderNumber,
        customer_name: name,
        phone,
        department,
        destination: destination.destination,
        transport,
        items: items.map((i) => ({ name: i.name, qty: i.qty, price: Number(i.price) })),
        subtotal,
        discount,
        shipping,
        total,
      });
      clear();
      navigate({ to: "/pedido/$numero", params: { numero: orderNumber } });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo registrar el pedido. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="font-display text-4xl">Realizar pedido</h1>

        <section className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-2xl">1. Tus datos</h2>
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              className="h-12"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa">Número de WhatsApp</Label>
            <Input
              id="wa"
              type="tel"
              inputMode="tel"
              className="h-12"
              maxLength={20}
              placeholder="Ej. 70000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </section>

        <section className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-2xl">2. Envío departamental</h2>
          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <Select
              value={department}
              onValueChange={(v) => {
                setDepartment(v);
                setDestinationId("");
                setTransport("");
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona tu departamento" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Destino</Label>
            <Select
              value={destinationId}
              onValueChange={(v) => {
                setDestinationId(v);
                setTransport("");
              }}
              disabled={!department}
            >
              <SelectTrigger className="h-12">
                <SelectValue
                  placeholder={department ? "Selecciona tu destino" : "Elige primero el departamento"}
                />
              </SelectTrigger>
              <SelectContent>
                {activeDestinations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {department && activeDestinations.length === 0 && (
              <p className="text-xs text-destructive">
                Aún no hay destinos habilitados en {department}. Escríbenos por WhatsApp.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de transporte</Label>
            <Select value={transport} onValueChange={setTransport} disabled={!destination}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona el transporte" />
              </SelectTrigger>
              <SelectContent>
                {availableTransports.map((t) => (
                  <SelectItem key={t} value={t}>
                    {transportLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {destination?.notes ? (
              <p className="text-xs text-muted-foreground">{destination.notes}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Referencia u observación (opcional)</Label>
            <Textarea
              id="notas"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-2xl">3. Resumen</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {i.qty} × {i.name}
                </span>
                <span className="shrink-0">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal de productos</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-gold">
                <span>🎁 Descuento combo ({rules.percent}%)</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío departamental JATLION Essence</span>
              <span>{formatPrice(shipping)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-2xl">
            <span>TOTAL</span>
            <span>{formatPrice(total)}</span>
          </div>
          {destination && (
            <p className="mt-3 text-sm text-muted-foreground">
              Destino: {department} → {destination.destination}
              {transport ? ` · ${transportLabel(transport)}` : ""}
            </p>
          )}
          <p className="mt-3 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
            El transporte seleccionado puede cobrar una tarifa adicional por la recepción de la
            encomienda. Esta tarifa no está incluida en el pago realizado a JATLION Essence.
          </p>
        </section>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-2xl">4. 💳 Paga con QR</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escanea el código QR y realiza el pago por el monto exacto.
          </p>
          <div className="mt-4 grid place-items-center rounded-lg border border-border bg-background p-5">
            {qrUrl ? (
              <img src={qrUrl} alt="Código QR de pago" className="h-64 w-64 object-contain" />
            ) : (
              <div className="grid h-64 w-64 place-items-center rounded-md border border-dashed border-border text-center text-xs text-muted-foreground">
                <div>
                  <QrCode className="mx-auto mb-2 h-8 w-8" />
                  El administrador aún no cargó el código QR.
                  <br />
                  Escríbenos por WhatsApp para coordinar el pago.
                </div>
              </div>
            )}
            <p className="mt-4 font-display text-3xl">{formatPrice(total)}</p>
            <p className="text-xs text-muted-foreground">Monto total a pagar</p>
          </div>

          <div className="mt-4">
            <Label htmlFor="comprobante" className="mb-2 block">
              📸 Subir comprobante
            </Label>
            <label
              htmlFor="comprobante"
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-border text-sm"
            >
              {receiptFile ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-gold" /> {receiptFile.name}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Seleccionar imagen del comprobante
                </>
              )}
            </label>
            <input
              id="comprobante"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </section>

        <Button
          className="mt-5 h-14 w-full rounded-full text-base"
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          CONFIRMAR PEDIDO
        </Button>
        <p className="mt-2 pb-6 text-center text-xs text-muted-foreground">
          Tu pago será verificado manualmente por el equipo de JATLION Essence.
        </p>
      </div>
    </StoreLayout>
  );
}
