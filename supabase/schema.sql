-- ============================================================
-- TATITOS PAÑALERA — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL,
  descripcion     text,
  precio          numeric(10,2) NOT NULL,
  stock           integer NOT NULL DEFAULT 0,
  categoria       text NOT NULL,
  marca           text,
  imagen_url      text,
  activo          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- Tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero              serial UNIQUE,
  cliente_nombre      text NOT NULL,
  cliente_telefono    text NOT NULL,
  cliente_email       text,
  direccion           text,
  tipo_entrega        text NOT NULL CHECK (tipo_entrega IN ('envio', 'retiro')),
  items               jsonb NOT NULL,
  subtotal            numeric(10,2),
  costo_envio         numeric(10,2) DEFAULT 0,
  total               numeric(10,2) NOT NULL,
  estado              text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
  mp_preference_id    text,
  mp_payment_id       text,
  mp_status           text,
  notas               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  text NOT NULL,
  slug    text UNIQUE NOT NULL,
  icono   text,
  orden   integer DEFAULT 0
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Productos: lectura pública
CREATE POLICY "productos_lectura_publica" ON productos
  FOR SELECT USING (activo = true);

-- Productos: escritura solo autenticado
CREATE POLICY "productos_escritura_admin" ON productos
  FOR ALL USING (auth.role() = 'authenticated');

-- Pedidos: inserción pública (el cliente crea su pedido)
CREATE POLICY "pedidos_insercion_publica" ON pedidos
  FOR INSERT WITH CHECK (true);

-- Pedidos: lectura y edición solo autenticado
CREATE POLICY "pedidos_admin" ON pedidos
  FOR ALL USING (auth.role() = 'authenticated');

-- Categorias: lectura pública
CREATE POLICY "categorias_lectura_publica" ON categorias
  FOR SELECT USING (true);

CREATE POLICY "categorias_escritura_admin" ON categorias
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Función para decrementar stock (usada por el webhook)
-- ============================================================

CREATE OR REPLACE FUNCTION decrementar_stock(p_id uuid, p_cantidad integer)
RETURNS void AS $$
BEGIN
  UPDATE productos
  SET stock = GREATEST(0, stock - p_cantidad)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Seed de productos iniciales
-- ============================================================

INSERT INTO productos (nombre, precio, stock, categoria, marca) VALUES
  ('Pampers Etapas T1 x20', 4500, 15, 'pañales', 'Pampers'),
  ('Pampers Etapas T2 x40', 5850, 18, 'pañales', 'Pampers'),
  ('Pampers Etapas T3 x40', 6100, 12, 'pañales', 'Pampers'),
  ('Huggies Clásicos T2 x40', 5200, 8, 'pañales', 'Huggies'),
  ('Huggies Clásicos T3 x32', 4900, 6, 'pañales', 'Huggies'),
  ('Toallitas Pequeñín x80', 2500, 24, 'toallitas', 'Pequeñín'),
  ('Toallitas Huggies x48', 1900, 20, 'toallitas', 'Huggies'),
  ('Crema Bepanthen 30g', 3200, 10, 'cremas', 'Bepanthen'),
  ('Crema Hipoglos 60g', 2800, 14, 'cremas', 'Hipoglos'),
  ('Shampoo Johnson x200ml', 2800, 9, 'higiene', 'Johnson''s'),
  ('Talco Johnson x100g', 1900, 11, 'higiene', 'Johnson''s'),
  ('Skip Bebé x3kg', 4100, 7, 'limpieza', 'Skip'),
  ('Suavitel Bebé x800ml', 1800, 13, 'limpieza', 'Suavitel')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Storage bucket para imágenes de productos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('productos-img', 'productos-img', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "imagen_publica" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos-img');

CREATE POLICY "imagen_upload_admin" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos-img' AND auth.role() = 'authenticated');
