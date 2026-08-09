CREATE POLICY "Anyone can upload receipts" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'comprobantes');
CREATE POLICY "Admins read receipts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'comprobantes' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'comprobantes' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone reads store assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'tienda');
CREATE POLICY "Admins upload store assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tienda' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update store assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tienda' AND has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'tienda' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete store assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tienda' AND has_role(auth.uid(), 'admin'));