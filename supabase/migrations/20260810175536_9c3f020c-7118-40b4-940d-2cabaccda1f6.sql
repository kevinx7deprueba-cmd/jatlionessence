CREATE TABLE public.combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  discount_percent numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.combos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combos TO authenticated;
GRANT ALL ON public.combos TO service_role;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active combos" ON public.combos FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage combos" ON public.combos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER combos_updated_at BEFORE UPDATE ON public.combos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.combo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.combo_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combo_items TO authenticated;
GRANT ALL ON public.combo_items TO service_role;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view combo items" ON public.combo_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage combo items" ON public.combo_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS combo_min_items integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS combo_discount_percent numeric NOT NULL DEFAULT 20;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.create_order(_customer_name text, _phone text, _department text, _destination text, _transport text, _notes text, _shipping_cost numeric, _receipt_path text, _items jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_number text;
  v_subtotal numeric := 0;
  v_units integer := 0;
  v_discount numeric := 0;
  v_min_items integer := 3;
  v_pct numeric := 20;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_qty integer;
BEGIN
  IF length(trim(_customer_name)) < 2 OR length(trim(_phone)) < 6 THEN
    RAISE EXCEPTION 'Datos del cliente inválidos';
  END IF;
  IF jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Carrito inválido';
  END IF;

  SELECT combo_min_items, combo_discount_percent INTO v_min_items, v_pct
  FROM public.store_settings LIMIT 1;
  v_min_items := coalesce(v_min_items, 3);
  v_pct := least(greatest(coalesce(v_pct, 0), 0), 90);

  INSERT INTO public.orders (customer_name, phone, department, destination, transport, notes,
                             subtotal, discount, shipping_cost, total, status, payment_method, receipt_path)
  VALUES (left(trim(_customer_name),120), left(trim(_phone),40), left(_department,60), left(_destination,120),
          left(_transport,40), left(coalesce(_notes,''),500), 0, 0, greatest(coalesce(_shipping_cost,0),0), 0,
          'pago_pendiente', 'qr', _receipt_path)
  RETURNING id, order_number INTO v_order_id, v_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'id')::uuid AND is_active = true;
    IF NOT FOUND THEN CONTINUE; END IF;
    v_qty := greatest(1, least(coalesce((v_item->>'qty')::int, 1), 999));
    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_units := v_units + v_qty;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);
  END LOOP;

  IF v_min_items > 0 AND v_units >= v_min_items THEN
    v_discount := round(v_subtotal * v_pct / 100.0, 2);
  END IF;

  UPDATE public.orders
     SET subtotal = v_subtotal,
         discount = v_discount,
         total = greatest(v_subtotal - v_discount, 0) + greatest(coalesce(_shipping_cost,0),0)
   WHERE id = v_order_id;

  RETURN v_number;
END;
$function$;