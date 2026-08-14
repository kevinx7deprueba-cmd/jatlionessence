ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS qr_dynamic_template text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.purge_expired_checkouts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.orders
   WHERE status = 'checkout_en_progreso'
     AND expires_at IS NOT NULL
     AND expires_at < now();
$$;

CREATE OR REPLACE FUNCTION public.start_checkout()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM public.purge_expired_checkouts();
  INSERT INTO public.orders (customer_name, phone, status, total, expires_at)
  VALUES ('Checkout en progreso', '', 'checkout_en_progreso', 0, now() + interval '2 hours')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_checkout(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.orders WHERE id = _id AND status = 'checkout_en_progreso';
$$;

GRANT EXECUTE ON FUNCTION public.purge_expired_checkouts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_checkout() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_checkout(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_order(_customer_name text, _phone text, _department text, _destination text, _transport text, _notes text, _shipping_cost numeric, _receipt_path text, _items jsonb, _delivery_method text DEFAULT 'envio'::text, _checkout_id uuid DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_number text;
  v_subtotal numeric := 0;
  v_combo_subtotal numeric := 0;
  v_combo_units integer := 0;
  v_discount numeric := 0;
  v_min_items integer := 3;
  v_pct numeric := 20;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_qty integer;
  v_is_combo boolean;
  v_item_pct numeric;
  v_method text;
  v_shipping numeric;
BEGIN
  PERFORM public.purge_expired_checkouts();

  IF length(trim(_customer_name)) < 2 OR length(trim(_phone)) < 6 THEN
    RAISE EXCEPTION 'Datos del cliente inválidos';
  END IF;
  IF jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Carrito inválido';
  END IF;

  -- Verificar disponibilidad antes de crear el pedido
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'id')::uuid;
    IF NOT FOUND OR v_product.is_active = false OR v_product.is_available = false THEN
      RAISE EXCEPTION 'AGOTADO:%', coalesce(v_product.name, 'Producto');
    END IF;
  END LOOP;

  v_method := CASE WHEN _delivery_method = 'recojo' THEN 'recojo' ELSE 'envio' END;
  v_shipping := CASE WHEN v_method = 'recojo' THEN 0 ELSE greatest(coalesce(_shipping_cost,0),0) END;

  SELECT combo_min_items, combo_discount_percent INTO v_min_items, v_pct
  FROM public.store_settings LIMIT 1;
  v_min_items := coalesce(v_min_items, 3);
  v_pct := least(greatest(coalesce(v_pct, 0), 0), 90);

  INSERT INTO public.orders (customer_name, phone, department, destination, transport, notes,
                             subtotal, discount, shipping_cost, total, status, payment_method, receipt_path, delivery_method)
  VALUES (left(trim(_customer_name),120), left(trim(_phone),40),
          CASE WHEN v_method = 'recojo' THEN '' ELSE left(coalesce(_department,''),60) END,
          CASE WHEN v_method = 'recojo' THEN '' ELSE left(coalesce(_destination,''),120) END,
          CASE WHEN v_method = 'recojo' THEN '' ELSE left(coalesce(_transport,''),40) END,
          left(coalesce(_notes,''),500), 0, 0, v_shipping, 0,
          'pago_pendiente', 'qr', _receipt_path, v_method)
  RETURNING id, order_number INTO v_order_id, v_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'id')::uuid AND is_active = true;
    IF NOT FOUND THEN CONTINUE; END IF;
    v_qty := greatest(1, least(coalesce((v_item->>'qty')::int, 1), 999));
    v_is_combo := coalesce((v_item->>'combo')::boolean, false);
    v_item_pct := least(greatest(coalesce((v_item->>'combo_percent')::numeric, 0), 0), 90);
    v_subtotal := v_subtotal + v_product.price * v_qty;
    IF v_item_pct > 0 THEN
      v_discount := v_discount + round(v_product.price * v_qty * v_item_pct / 100.0, 2);
    ELSIF v_is_combo THEN
      v_combo_subtotal := v_combo_subtotal + v_product.price * v_qty;
      v_combo_units := v_combo_units + v_qty;
    END IF;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);
  END LOOP;

  IF v_min_items > 0 AND v_combo_units >= v_min_items THEN
    v_discount := v_discount + round(v_combo_subtotal * v_pct / 100.0, 2);
  END IF;

  UPDATE public.orders
     SET subtotal = v_subtotal,
         discount = v_discount,
         total = greatest(v_subtotal - v_discount, 0) + v_shipping
   WHERE id = v_order_id;

  IF _checkout_id IS NOT NULL THEN
    DELETE FROM public.orders WHERE id = _checkout_id AND status = 'checkout_en_progreso';
  END IF;

  RETURN v_number;
END;
$function$;