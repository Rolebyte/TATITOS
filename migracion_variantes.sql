-- MIGRACIÓN: Agregar columna variantes
ALTER TABLE productos ADD COLUMN IF NOT EXISTS variantes JSONB;

-- Grupo: PETIT ENFANT OLEO CALCAREO
UPDATE productos SET nombre = 'PETIT ENFANT OLEO CALCAREO', precio = 10800, stock = 1, variantes = '[{"label":"500ml","precio":15200,"stock":0},{"label":"240ml","precio":10800,"stock":1}]'::jsonb WHERE nombre = 'PETIT ENFANT OLEO CALCAREO 500 ml';
DELETE FROM productos WHERE nombre = 'PETIT ENFANT OLEO CALCAREO 240ml';

-- Grupo: HUGGIES NATURAL CARE
UPDATE productos SET nombre = 'HUGGIES NATURAL CARE', precio = 19000, stock = 7, variantes = '[{"label":"P 30u","precio":19000,"stock":5},{"label":"G 60u","precio":30000,"stock":2},{"label":"XXXG 92u","precio":55000,"stock":0},{"label":"XG 100u","precio":55000,"stock":0}]'::jsonb WHERE nombre = 'HUGGIES NATURAL CARE P 30 u';
DELETE FROM productos WHERE nombre = 'HUGGIES NATURAL CARE G 60 u';
DELETE FROM productos WHERE nombre = 'HUGGIES NATURAL CARE XXXG 92 u';
DELETE FROM productos WHERE nombre = 'HUGGIES NATURAL CARE XG 100 u';

-- Grupo: HUGGIES FLEXI COMFORT
UPDATE productos SET nombre = 'HUGGIES FLEXI COMFORT', precio = 16000, stock = 7, variantes = '[{"label":"XG 100u","precio":49500,"stock":1},{"label":"XXXG 92u","precio":49500,"stock":1},{"label":"P 50u","precio":20000,"stock":0},{"label":"RN 34u","precio":16000,"stock":5}]'::jsonb WHERE nombre = 'HUGGIES FLEXI COMFORT XG 100 u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT XXXG 92u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT P 50u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT RN 34u';

-- Grupo: OLEO DONCELLA c/AVENA
UPDATE productos SET nombre = 'OLEO DONCELLA c/AVENA', precio = 6750, stock = 3, variantes = '[{"label":"1000ml","precio":10200,"stock":1},{"label":"500ml","precio":6750,"stock":2}]'::jsonb WHERE nombre = 'OLEO DONCELLA c/AVENA 1000 ml';
DELETE FROM productos WHERE nombre = 'OLEO DONCELLA c/AVENA 500 ml';

-- Grupo: SHAMPOO PETIT ENFANT KIDS
UPDATE productos SET nombre = 'SHAMPOO PETIT ENFANT KIDS', precio = 8000, stock = 3, variantes = '[{"label":"500ml","precio":12200,"stock":1},{"label":"240ml","precio":8000,"stock":2}]'::jsonb WHERE nombre = 'SHAMPOO PETIT ENFANT KIDS 500 ml';
DELETE FROM productos WHERE nombre = 'SHAMPOO PETIT ENFANT KIDS 240ml';

-- Grupo: PAMPERS BABYDRY HIPOALERGÉNICO
UPDATE productos SET nombre = 'PAMPERS BABYDRY HIPOALERGÉNICO', precio = 32000, stock = 2, variantes = '[{"label":"G 72U","precio":32000,"stock":0},{"label":"XG 96u","precio":50000,"stock":2}]'::jsonb WHERE nombre = 'PAMPERS BABYDRY HIPOALERGÉNICO G 72 U';
DELETE FROM productos WHERE nombre = 'PAMPERS BABYDRY HIPOALERGÉNICO XG 96 u';

-- Grupo: JOHNSON AC GOTAS DE BRILLO
UPDATE productos SET nombre = 'JOHNSON AC GOTAS DE BRILLO', precio = 6100, stock = 4, variantes = '[{"label":"200ml","precio":6100,"stock":2},{"label":"400ml","precio":11000,"stock":2}]'::jsonb WHERE nombre = 'JOHNSON AC GOTAS DE BRILLO 200ml';
DELETE FROM productos WHERE nombre = 'JOHNSON AC GOTAS DE BRILLO 400ml';

-- Grupo: BABYSEC PREMIUM
UPDATE productos SET nombre = 'BABYSEC PREMIUM', precio = 25000, stock = 2, variantes = '[{"label":"XXG 44u","precio":25000,"stock":2},{"label":"XG 48u","precio":25000,"stock":0},{"label":"G 60u","precio":25000,"stock":0}]'::jsonb WHERE nombre = 'BABYSEC PREMIUM XXG 44u';
DELETE FROM productos WHERE nombre = 'BABYSEC PREMIUM XG 48u';
DELETE FROM productos WHERE nombre = 'BABYSEC PREMIUM G 60u';

-- Grupo: Woolite jabón líquido bebé
UPDATE productos SET nombre = 'Woolite jabón líquido bebé', precio = 4000, stock = 6, variantes = '[{"label":"900ml","precio":6200,"stock":3},{"label":"450ml","precio":4000,"stock":3}]'::jsonb WHERE nombre = 'Woolite jabón líquido bebé - 900 ml';
DELETE FROM productos WHERE nombre = 'Woolite jabón líquido bebé - 450 ml';

-- Grupo: ESTRELLA
UPDATE productos SET nombre = 'ESTRELLA', precio = 21000, stock = 2, variantes = '[{"label":"JUNIORS 50u","precio":21000,"stock":0},{"label":"XXG 50u","precio":21000,"stock":2},{"label":"G 60u","precio":21000,"stock":0}]'::jsonb WHERE nombre = 'ESTRELLA JUNIORS 50 u';
DELETE FROM productos WHERE nombre = 'ESTRELLA XXG 50u';
DELETE FROM productos WHERE nombre = 'ESTRELLA G 60u';

-- Grupo: ESTRELLA OLEO LIMPIADOR
UPDATE productos SET nombre = 'ESTRELLA OLEO LIMPIADOR', precio = 5300, stock = 0, variantes = '[{"label":"500ml","precio":6800,"stock":0},{"label":"245ml","precio":5300,"stock":0}]'::jsonb WHERE nombre = 'ESTRELLA OLEO LIMPIADOR 500ml';
DELETE FROM productos WHERE nombre = 'ESTRELLA OLEO LIMPIADOR 245ml';

-- Grupo: JOHNSON SH MANZANILLA
UPDATE productos SET nombre = 'JOHNSON SH MANZANILLA', precio = 5700, stock = 6, variantes = '[{"label":"750ml","precio":18000,"stock":2},{"label":"400ml","precio":11000,"stock":2},{"label":"200ml","precio":5700,"stock":2}]'::jsonb WHERE nombre = 'JOHNSON SH MANZANILLA 750ml';
DELETE FROM productos WHERE nombre = 'JOHNSON SH MANZANILLA 400ml';
DELETE FROM productos WHERE nombre = 'JOHNSON SH MANZANILLA 200ml';

-- Grupo: JOHNSON SH CLASICO
UPDATE productos SET nombre = 'JOHNSON SH CLASICO', precio = 5700, stock = 4, variantes = '[{"label":"750ml","precio":18000,"stock":2},{"label":"400ml","precio":11000,"stock":2},{"label":"200ml","precio":5700,"stock":0}]'::jsonb WHERE nombre = 'JOHNSON SH CLASICO 750ml';
DELETE FROM productos WHERE nombre = 'JOHNSON SH CLASICO 400ml';
DELETE FROM productos WHERE nombre = 'JOHNSON SH CLASICO 200ml';

-- Grupo: JOHNSON SH GOTAS DE BRILLO
UPDATE productos SET nombre = 'JOHNSON SH GOTAS DE BRILLO', precio = 5700, stock = 3, variantes = '[{"label":"400ml","precio":11000,"stock":2},{"label":"200ml","precio":5700,"stock":1}]'::jsonb WHERE nombre = 'JOHNSON SH GOTAS DE BRILLO 400ml';
DELETE FROM productos WHERE nombre = 'JOHNSON SH GOTAS DE BRILLO 200ml';

-- Grupo: ALGABO SH P-BEBE EXTRA SUAVE
UPDATE productos SET nombre = 'ALGABO SH P-BEBE EXTRA SUAVE', precio = 3500, stock = 3, variantes = '[{"label":"755ml","precio":5500,"stock":1},{"label":"444ml","precio":4000,"stock":2},{"label":"200ml","precio":3500,"stock":0}]'::jsonb WHERE nombre = 'ALGABO SH P-BEBE EXTRA SUAVE 755ml';
DELETE FROM productos WHERE nombre = 'ALGABO SH P-BEBE EXTRA SUAVE 444ml';
DELETE FROM productos WHERE nombre = 'ALGABO SH P-BEBE EXTRA SUAVE 200ml';

-- Grupo: HUGGIES NATURAL CARE + TOALLITAS HÚMEDAS
UPDATE productos SET nombre = 'HUGGIES NATURAL CARE + TOALLITAS HÚMEDAS', precio = 32000, stock = 1, variantes = '[{"label":"HUGGIES NATURAL CARE XXG 50u + TOALLITAS HÚMEDAS","precio":32000,"stock":0},{"label":"HUGGIES NATURAL CARE M 68u + TOALLITAS HÚMEDAS","precio":32000,"stock":1}]'::jsonb WHERE nombre = 'HUGGIES NATURAL CARE XXG 50u + TOALLITAS HÚMEDAS';
DELETE FROM productos WHERE nombre = 'HUGGIES NATURAL CARE M 68u + TOALLITAS HÚMEDAS';

-- Grupo: HUGGIES FLEXI COMFORT AHORRA PACK
UPDATE productos SET nombre = 'HUGGIES FLEXI COMFORT AHORRA PACK', precio = 27000, stock = 3, variantes = '[{"label":"XXXG 48u","precio":49500,"stock":0},{"label":"XXG 50u","precio":27000,"stock":0},{"label":"XG 52u","precio":27000,"stock":0},{"label":"G 60u","precio":27000,"stock":1},{"label":"M 68u","precio":27000,"stock":2}]'::jsonb WHERE nombre = 'HUGGIES FLEXI COMFORT AHORRA PACK XXXG 48u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT AHORRA PACK XXG 50u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT AHORRA PACK XG 52u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT AHORRA PACK G 60u';
DELETE FROM productos WHERE nombre = 'HUGGIES FLEXI COMFORT AHORRA PACK M 68u';

-- Grupo: BABYSEC ULTRA SOFT
UPDATE productos SET nombre = 'BABYSEC ULTRA SOFT', precio = 19900, stock = 1, variantes = '[{"label":"X-XG 50u","precio":19900,"stock":0},{"label":"XG 52u","precio":19900,"stock":0},{"label":"G 60u","precio":19900,"stock":0},{"label":"M 68u","precio":19900,"stock":1}]'::jsonb WHERE nombre = 'BABYSEC ULTRA SOFT X-XG 50u';
DELETE FROM productos WHERE nombre = 'BABYSEC ULTRA SOFT XG 52u';
DELETE FROM productos WHERE nombre = 'BABYSEC ULTRA SOFT G 60u';
DELETE FROM productos WHERE nombre = 'BABYSEC ULTRA SOFT M 68u';
