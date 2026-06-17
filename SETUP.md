# Tatitos Pañalera — Guía de Setup

## Desarrollo local

```bash
cd TATITOS
npm install
npm run dev
# → http://localhost:5173
```

## 1. Crear proyecto en Supabase

1. Ir a https://supabase.com → New project
2. Guardar la URL y la `anon key`
3. En **SQL Editor**, ejecutar todo el contenido de `supabase/schema.sql`
   - Crea las tablas `productos`, `pedidos`, `categorias`
   - Configura RLS
   - Inserta los 13 productos iniciales
   - Crea el bucket `productos-img`

## 2. Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://tatitos.netlify.app   # en prod; en dev: http://localhost:5173
VITE_WHATSAPP_NUMBER=5493492XXXXXX         # código de país + área + número sin 0 ni 15
```

## 3. Mercado Pago

1. Crear cuenta en https://www.mercadopago.com.ar
2. Ir a **Tus integraciones → Credenciales → Producción**
3. Copiar el `Access Token`

## 4. Deploy Edge Functions en Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref TU_PROJECT_REF

# Configurar secrets (NUNCA en el frontend)
supabase secrets set MP_ACCESS_TOKEN=APP_USR-xxx
supabase secrets set APP_URL=https://tatitos.netlify.app

# Deploy functions
supabase functions deploy crear-pedido
supabase functions deploy mp-webhook
```

## 5. Deploy en Netlify

1. Subir código a GitHub
2. Conectar repo en https://netlify.com
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Agregar variables de entorno en Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (la URL de Netlify)
   - `VITE_WHATSAPP_NUMBER`

## 6. Crear usuario admin

En Supabase → **Authentication → Users → Invite user**:
- Email: admin@tatitos.com (o el que prefieras)
- Luego setear contraseña desde el dashboard

## 7. Webhook de Mercado Pago

En el panel de MP → **Tus integraciones → Webhooks**:
- URL: `https://TU_PROYECTO.supabase.co/functions/v1/mp-webhook`
- Eventos: `payment`

## Rutas de la app

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/tienda` | Catálogo público |
| `/tienda/carrito` | Carrito y checkout |
| `/pago/exito` | Pago aprobado |
| `/pago/pendiente` | Pago pendiente |
| `/pago/error` | Pago rechazado |
| `/admin` | Login admin |
| `/admin/pedidos` | Gestión de pedidos |
| `/admin/stock` | Gestión de productos |
| `/admin/ventas` | Métricas y reportes |
