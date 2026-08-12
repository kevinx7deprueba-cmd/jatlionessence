export const DEPARTMENTS = [
  "Santa Cruz",
  "La Paz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando",
] as const;

export const TRANSPORTS = [
  { value: "trufi", label: "🚐 Trufi / transporte interprovincial" },
  { value: "flota", label: "🚌 Flota / encomienda" },
  { value: "otro", label: "📦 Otro transporte" },
] as const;

export const transportLabel = (value: string) =>
  TRANSPORTS.find((t) => t.value === value)?.label ?? value;

export const ORDER_STATUSES = [
  { value: "pago_pendiente", label: "🟡 Pago pendiente de verificación" },
  { value: "pago_confirmado", label: "🟢 Pago confirmado" },
  { value: "preparando", label: "📦 Preparando pedido" },
  { value: "enviado", label: "🚚 Enviado" },
  { value: "entregado", label: "✅ Entregado" },
  { value: "cancelado", label: "❌ Cancelado" },
] as const;

export const statusLabel = (value: string) =>
  ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;

export const formatPrice = (value: number) =>
  `Bs ${Number(value || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const waLink = (phone: string, message: string) =>
  `https://wa.me/${(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const SUPPORT_MESSAGE = "Hola, necesito soporte técnico con JATLION Essence.";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number;
  category: string;
  image_url: string | null;
  stock: number;
  featured: boolean;
  is_active: boolean;
  is_new: boolean;
  is_offer: boolean;
  created_at?: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  sort_order: number;
  is_active: boolean;
};

export type Destination = {
  id: string;
  department: string;
  destination: string;
  transports: string[];
  notes: string;
  is_active: boolean;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  whatsapp: string;
  logo_url: string | null;
  qr_image_url: string | null;
  shipping_cost: number;
  contact_info: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  combo_min_items: number;
  combo_discount_percent: number;
};

export type ComboItem = {
  id: string;
  combo_id: string;
  product_id: string;
  quantity: number;
};

export type Combo = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  discount_percent: number;
  is_active: boolean;
  sort_order: number;
  combo_items?: ComboItem[];
};

export type ComboRules = { minItems: number; percent: number };

export const comboRules = (settings?: { combo_min_items?: number; combo_discount_percent?: number } | null): ComboRules => ({
  minItems: Number(settings?.combo_min_items ?? 3),
  percent: Number(settings?.combo_discount_percent ?? 20),
});

/**
 * Descuento por combo:
 * - Combos ya armados (items con `comboPercent`): el descuento aplica siempre,
 *   sin importar cuántos productos lleve el carrito.
 * - "Arma tu combo" (items con `combo: true` sin porcentaje propio): aplica solo
 *   al alcanzar el mínimo de unidades.
 * Las compras normales del catálogo nunca reciben descuento.
 */
export const comboDiscount = (
  items: { price: number; qty: number; combo?: boolean; comboPercent?: number }[],
  rules: ComboRules,
) => {
  const fijos = items.filter((i) => Number(i.comboPercent ?? 0) > 0);
  let total = fijos.reduce(
    (s, i) => s + Number(i.price) * i.qty * (Number(i.comboPercent) / 100),
    0,
  );

  const armados = items.filter((i) => i.combo && !Number(i.comboPercent ?? 0));
  const units = armados.reduce((s, i) => s + i.qty, 0);
  if (rules.minItems > 0 && units >= rules.minItems) {
    total += armados.reduce((s, i) => s + Number(i.price) * i.qty, 0) * (rules.percent / 100);
  }
  return Math.round(total * 100) / 100;
};

/** Unidades del carrito que pertenecen al flujo "arma tu combo". */
export const comboUnits = (items: { qty: number; combo?: boolean; comboPercent?: number }[]) =>
  items.reduce((s, i) => s + (i.combo && !Number(i.comboPercent ?? 0) ? i.qty : 0), 0);
