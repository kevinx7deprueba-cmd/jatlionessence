import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/queries";
import { ImageField } from "./image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Form = {
  store_name: string;
  whatsapp: string;
  logo_url: string;
  qr_image_url: string;
  qr_dynamic_template: string;
  shipping_cost: string;
  combo_min_items: string;
  combo_discount_percent: string;
  contact_info: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
};

const blank: Form = {
  store_name: "JATLION Essence",
  whatsapp: "",
  logo_url: "",
  qr_image_url: "",
  qr_dynamic_template: "",
  shipping_cost: "20",
  combo_min_items: "3",
  combo_discount_percent: "20",
  contact_info: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
};

export function SettingsTab() {
  const qc = useQueryClient();
  const { data: settings } = useQuery(settingsQuery);
  const [form, setForm] = useState<Form>(blank);

  useEffect(() => {
    if (!settings) return;
    setForm({
      store_name: settings.store_name ?? "",
      whatsapp: settings.whatsapp ?? "",
      logo_url: settings.logo_url ?? "",
      qr_image_url: settings.qr_image_url ?? "",
      qr_dynamic_template: settings.qr_dynamic_template ?? "",
      shipping_cost: String(settings.shipping_cost ?? 20),
      combo_min_items: String(settings.combo_min_items ?? 3),
      combo_discount_percent: String(settings.combo_discount_percent ?? 20),
      contact_info: settings.contact_info ?? "",
      instagram_url: settings.instagram_url ?? "",
      facebook_url: settings.facebook_url ?? "",
      tiktok_url: settings.tiktok_url ?? "",
    });
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        store_name: form.store_name.trim().slice(0, 80),
        whatsapp: form.whatsapp.trim().slice(0, 30),
        logo_url: form.logo_url.trim() || null,
        qr_image_url: form.qr_image_url.trim() || null,
        qr_dynamic_template: form.qr_dynamic_template.trim(),
        shipping_cost: Number(form.shipping_cost) || 0,
        combo_min_items: Math.max(Number(form.combo_min_items) || 0, 0),
        combo_discount_percent: Math.min(Math.max(Number(form.combo_discount_percent) || 0, 0), 90),
        contact_info: form.contact_info.trim().slice(0, 400),
        instagram_url: form.instagram_url.trim(),
        facebook_url: form.facebook_url.trim(),
        tiktok_url: form.tiktok_url.trim(),
      };
      const { error } = settings?.id
        ? await supabase.from("store_settings").update(payload).eq("id", settings.id)
        : await supabase.from("store_settings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Configuración guardada");
    },
    onError: () => toast.error("No se pudo guardar la configuración"),
  });

  const field = (key: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`s-${key}`}>{label}</Label>
      <Input
        id={`s-${key}`}
        className="h-11"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Tienda</h2>
        {field("store_name", "Nombre de la tienda")}
        {field("whatsapp", "WhatsApp del dueño (con código de país)", {
          placeholder: "59174968246",
        })}
        <ImageField
          label="Logo"
          folder="branding"
          value={form.logo_url}
          onChange={(logo_url) => setForm({ ...form, logo_url })}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Pagos y envío</h2>
        <ImageField
          label="QR de pago"
          folder="qr"
          value={form.qr_image_url}
          onChange={(qr_image_url) => setForm({ ...form, qr_image_url })}
        />
        <div className="space-y-1.5">
          <Label htmlFor="s-qrtpl">Plantilla de QR dinámico (opcional)</Label>
          <Input
            id="s-qrtpl"
            className="h-11"
            placeholder="https://pago.tubanco.com/qr?cuenta=123&monto={monto}"
            value={form.qr_dynamic_template}
            onChange={(e) => setForm({ ...form, qr_dynamic_template: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Si tu proveedor de pago permite links o QR con monto, pega aquí el enlace usando{" "}
            {"{monto}"} donde va el importe. El checkout generará un QR con el monto exacto del
            pedido. Si lo dejas vacío se mostrará el QR fijo que subiste arriba.
          </p>
        </div>
        {field("shipping_cost", "Costo de envío (Bs)", { type: "number", min: "0", step: "0.01" })}
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Descuento por combo</h2>
        <p className="text-sm text-muted-foreground">
          Cuando el cliente lleva la cantidad mínima de productos, se aplica el descuento
          automáticamente en el checkout.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("combo_min_items", "Cantidad mínima de productos", { type: "number", min: "0" })}
          {field("combo_discount_percent", "Descuento (%)", {
            type: "number",
            min: "0",
            max: "90",
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Contacto y redes</h2>
        <div className="space-y-1.5">
          <Label htmlFor="s-contact">Información de contacto</Label>
          <Textarea
            id="s-contact"
            rows={3}
            value={form.contact_info}
            onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
          />
        </div>
        {field("instagram_url", "Instagram")}
        {field("facebook_url", "Facebook")}
        {field("tiktok_url", "TikTok")}
      </section>

      <Button type="submit" className="h-12 w-full rounded-full sm:w-auto sm:px-10">
        Guardar configuración
      </Button>
    </form>
  );
}
