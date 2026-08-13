export type OrderSnapshot = {
  order_number: string;
  customer_name: string;
  phone: string;
  /** "envio" | "recojo" */
  delivery_method?: string;
  department: string;
  destination: string;
  transport: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
};

const key = (n: string) => `jatlion-order-${n}`;

export function saveOrderSnapshot(order: OrderSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key(order.order_number), JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function readOrderSnapshot(orderNumber: string): OrderSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(orderNumber));
    return raw ? (JSON.parse(raw) as OrderSnapshot) : null;
  } catch {
    return null;
  }
}
