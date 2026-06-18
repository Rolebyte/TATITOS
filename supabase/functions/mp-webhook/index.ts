import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function notificarCliente(telefono: string, nombre: string, numero: number) {
  const duenos = [
    { phone: '5493492627811', apikey: '5568416' },
    { phone: '5493493459749', apikey: '6063730' },
  ]

  const numeroFormateado = String(numero).padStart(4, '0')
  const mensaje = `✅ Hola ${encodeURIComponent(nombre)}! Tu pago fue confirmado 🎉%0ATu pedido %23${numeroFormateado} está siendo preparado.%0AEn breve te contactamos para coordinar la entrega. ¡Gracias por elegirnos! 💕`

  const clientePhone = `549${telefono.replace(/\D/g, '').slice(-10)}`
  await fetch(`https://api.callmebot.com/whatsapp.php?phone=${clientePhone}&text=${mensaje}&apikey=${duenos[0].apikey}`)
    .catch(() => {})

  const mensajeDuenos = `✅ Pago confirmado — Pedido %23${numeroFormateado}%0A👤 ${encodeURIComponent(nombre)}%0A💳 Pagó con Mercado Pago`
  await Promise.allSettled(
    duenos.map(({ phone, apikey }) =>
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${mensajeDuenos}&apikey=${apikey}`)
    )
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    if (body.type !== 'payment' && body.topic !== 'payment') {
      return new Response('ok', { headers: corsHeaders })
    }

    const paymentId = body.data?.id || body.id
    if (!paymentId) {
      return new Response('ok', { headers: corsHeaders })
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    })

    if (!mpRes.ok) throw new Error(`MP fetch error: ${mpRes.status}`)
    const payment = await mpRes.json()

    if (payment.status !== 'approved') {
      return new Response('ok', { headers: corsHeaders })
    }

    const pedidoId = payment.external_reference
    if (!pedidoId) {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single()

    if (pedidoError || !pedido) throw new Error('Pedido no encontrado')

    if (pedido.mp_payment_id === String(paymentId)) {
      return new Response('ok', { headers: corsHeaders })
    }

    await supabase
      .from('pedidos')
      .update({
        estado: 'confirmado',
        mp_payment_id: String(paymentId),
        mp_status: payment.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)

    const items = pedido.items as Array<{ producto_id: string; cantidad: number }>
    await Promise.allSettled(
      items.map((item) =>
        supabase.rpc('decrementar_stock', {
          p_id: item.producto_id,
          p_cantidad: item.cantidad,
        })
      )
    )

    await notificarCliente(pedido.cliente_telefono, pedido.cliente_nombre, pedido.numero)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
