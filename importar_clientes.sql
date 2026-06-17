-- Crear tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  ciudad TEXT,
  provincia TEXT,
  total_consumido NUMERIC DEFAULT 0,
  cantidad_compras INTEGER DEFAULT 0,
  ultima_compra DATE,
  origen TEXT DEFAULT 'tiendanube',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Política de acceso solo admin
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Solo admins') THEN
    CREATE POLICY "Solo admins" ON clientes USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Importar clientes
INSERT INTO clientes (nombre, email, telefono, ciudad, provincia, total_consumido, cantidad_compras, ultima_compra, origen) VALUES
  ('Tami Bonardi', 'alarconariana@hotmail.com', NULL, NULL, 'Argentina', 23400, 1, '2025-11-02', 'tiendanube'),
  ('Pato Walker', 'alarconcita@gmail.com', NULL, NULL, 'Argentina', 20390, 1, '2025-03-05', 'tiendanube'),
  ('Pato Walker', 'alarconmariana@hotmail.com', NULL, NULL, 'Argentina', 3879820, 109, '2026-06-09', 'tiendanube'),
  ('Mariana Alarcón', 'alarcosriana@hotmail.com', NULL, NULL, 'Santa Fe', 14930, 1, '2025-02-24', 'tiendanube'),
  ('Ariel Medici', 'ariel_medici@hotmail.com', '+543492214054', 'Colonia Bella Italia', 'Santa Fe', 14760, 1, '2025-04-28', 'tiendanube'),
  ('Alicia Rinaldi', 'arinaldi26@gmail.com', '+543492583466', 'Rafaela', 'Santa Fe', 15450, 1, '2025-02-19', 'tiendanube'),
  ('Carolina Bergamasco', 'caro.bergamasco@hotmail.com', '+543425294104', 'Galvez', 'Santa Fe', 161250, 6, '2025-07-23', 'tiendanube'),
  ('Carolina Bergamasco', 'cbergamasco@solenis.com', '+543425294104', 'Galvez', 'Santa Fe', 25800, 1, '2025-02-14', 'tiendanube'),
  ('Facundo de Caminos', 'decka27@gmail.com', '+543404524337', 'San Carlos Centro', 'Santa Fe', 44000, 1, '2026-05-23', 'tiendanube'),
  ('Gustavo Ramon Pucci', 'grp.pucci@gmail.com', '+541121818104', 'Capital Federal', 'CABA', 0, 0, NULL, 'tiendanube'),
  ('Juan Gallino', 'jgallino1@gmail.com', '+543492627811', 'Rafaela', 'Santa Fe', 0, 0, NULL, 'tiendanube'),
  ('Maria Julia Gallino', 'mariajuliagallino@gmail.com', '+543492644334', 'Colonia Bella Italia', 'Santa Fe', 49960, 1, '2025-05-14', 'tiendanube'),
  ('Micaela Pinciroli', 'micaelapinciroli@gmail.com', '+543492633112', 'Colonia Bella Italia', 'Santa Fe', 1900, 1, '2025-05-30', 'tiendanube'),
  ('Micaela Pinciroli', 'micaelapinciroli@hotmail.com', '+543492633112', 'Vila', 'Santa Fe', 61800, 1, '2025-05-30', 'tiendanube'),
  ('Jorge Noss', 'noss.jorge@gmail.com', '+543492524242', 'Rafaela', 'Santa Fe', 56300, 1, '2026-01-26', 'tiendanube'),
  ('Ricardo Galliano', 'rhgalliano@gmail.com', '+541123918229', 'Capital Federal', 'CABA', 45000, 1, '2025-08-07', 'tiendanube'),
  ('Rosana Marconi', 'rosanamarconi@181gmail.com', '+543492312585', NULL, NULL, 0, 0, NULL, 'tiendanube'),
  ('Evelyn Gracias', 'Sanchezevelynhys@gmail.com', '+541134176218', 'Ferrari', 'Gran Buenos Aires', 51000, 1, '2025-08-18', 'tiendanube'),
  ('Tamara Bonardi', 'tamarabonardi10@gmail.com', '+543493662099', 'Colonia Reina Margarita', 'Santa Fe', 23710, 1, '2025-02-14', 'tiendanube')
ON CONFLICT DO NOTHING;