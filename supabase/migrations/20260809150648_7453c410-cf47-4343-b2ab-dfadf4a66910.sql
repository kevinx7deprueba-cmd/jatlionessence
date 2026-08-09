CREATE OR REPLACE FUNCTION public.create_order(
  _customer_name text,
  _phone text,
  _department text,
  _destination text,
  _transport text,
  _notes text,
  _shipping_cost numeric,
  _receipt_path text,
  _items jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_number text;
  v_subtotal numeric := 0;
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

  INSERT INTO public.orders (customer_name, phone, department, destination, transport, notes,
                             subtotal, shipping_cost, total, status, payment_method, receipt_path)
  VALUES (left(trim(_customer_name),120), left(trim(_phone),40), left(_department,60), left(_destination,120),
          left(_transport,40), left(coalesce(_notes,''),500), 0, greatest(coalesce(_shipping_cost,0),0), 0,
          'pago_pendiente', 'qr', _receipt_path)
  RETURNING id, order_number INTO v_order_id, v_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'id')::uuid AND is_active = true;
    IF NOT FOUND THEN CONTINUE; END IF;
    v_qty := greatest(1, least(coalesce((v_item->>'qty')::int, 1), 999));
    v_subtotal := v_subtotal + v_product.price * v_qty;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);
  END LOOP;

  UPDATE public.orders
     SET subtotal = v_subtotal,
         total = v_subtotal + greatest(coalesce(_shipping_cost,0),0)
   WHERE id = v_order_id;

  RETURN v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,text,text,numeric,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,numeric,text,jsonb) TO anon, authenticated;