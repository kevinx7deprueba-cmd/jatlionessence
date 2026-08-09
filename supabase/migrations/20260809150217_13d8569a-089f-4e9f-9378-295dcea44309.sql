-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.categories (slug, name, blurb, sort_order) VALUES
  ('fragancias-hombre','Fragancias Hombre','Notas amaderadas, cítricas y orientales',1),
  ('fragancias-mujer','Fragancias Mujer','Florales, dulces y envolventes',2),
  ('rostro','Cuidado facial','Limpieza, hidratación y tratamiento',3),
  ('cuerpo-y-bano','Cuidado corporal','Cremas, geles y exfoliantes',4),
  ('cabello','Cabello','Shampoo, tratamientos y styling',5),
  ('nutricion-y-bienestar','Bienestar','Suplementos y bebidas funcionales',6),
  ('accesorios','Accesorios','Estuches, neceseres y complementos',7),
  ('promociones','Promociones','Combos y precios especiales',8),
  ('otros','Otros','Otros productos seleccionados',9);

-- PRODUCTS extras
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS compare_at_price numeric NOT NULL DEFAULT 0;

-- SHIPPING DESTINATIONS
CREATE TABLE public.shipping_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  destination text NOT NULL,
  transports text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department, destination)
);
GRANT SELECT ON public.shipping_destinations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_destinations TO authenticated;
GRANT ALL ON public.shipping_destinations TO service_role;
ALTER TABLE public.shipping_destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active destinations" ON public.shipping_destinations FOR SELECT TO anon, authenticated USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage destinations" ON public.shipping_destinations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER shipping_destinations_updated_at BEFORE UPDATE ON public.shipping_destinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORE SETTINGS (single row)
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  store_name text NOT NULL DEFAULT 'JATLION Essence',
  whatsapp text NOT NULL DEFAULT '',
  logo_url text,
  qr_image_url text,
  shipping_cost numeric NOT NULL DEFAULT 20,
  contact_info text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  tiktok_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.store_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert settings" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.store_settings (whatsapp, shipping_cost) VALUES ('59174968246', 20);

-- ORDERS extras
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS destination text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS transport text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cost numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'qr',
  ADD COLUMN IF NOT EXISTS receipt_path text;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'JE-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_order_number() FROM anon, authenticated;
CREATE TRIGGER orders_set_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();
UPDATE public.orders SET order_number = 'JE-' || lpad(nextval('public.order_number_seq')::text, 4, '0') WHERE order_number IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders (order_number);