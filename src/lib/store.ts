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

/** Descuento por armar combo: aplica cuando el carrito tiene al menos `minItems` unidades. */
export const comboDiscount = (subtotal: number, units: number, rules: ComboRules) =>
  rules.minItems > 0 && units >= rules.minItems
    ? Math.round(subtotal * (rules.percent / 100) * 100) / 100
    : 0;
