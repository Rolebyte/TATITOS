import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function notificarDuenos(pedido: any, items: any[], tipo_entrega: string, total: number) {
  const duenos = [
    { phone: '5493492627811', apikey: '5568416' },
    { phone: '5493493459749', apikey: '6063730' },
  ]

  const numeroFormateado = String(pedido.numero).padStart(4, '0')
  const itemsTexto = items.map((i: any) => `${i.nombre} x${i.cantidad}`).join(', ')
  const entregaTexto =
    tipo_entrega === 'domicilio' ? '🏠 Envío a domicilio' :
    tipo_entrega === 'localidad' ? '📦 Envío a localidad' : '🤝 Retiro'

  const mensaje = `🛍️ Nuevo pedido %23${numeroFormateado}%0A👤 ${encodeURIComponent(pedido.cliente_nombre)} · ${pedido.cliente_telefono}%0A📋 ${encodeURIComponent(itemsTexto)}%0A💰 Total: $${Number(total).toLocaleString('es-AR')}%0A${encodeURIComponent(entregaTexto)}`

  await Promise.allSettled(
    duenos.map(({ phone, apikey }) =>
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${mensaje}&apikey=${apikey}`)
    )
  )
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cliente, items, tipo_entrega, direccion, notas, costo_envio } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const subtotal = items.reduce((acc: number, i: any) => acc + i.precio * i.cantidad, 0)
    const total = subtotal + (costo_envio || 0)

    // Crear pedido en Supabase
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_email: cliente.email,
        tipo_entrega,
        direccion,
        items,
        notas,
        subtotal,
        costo_envio: costo_envio || 0,
        total,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    // Crear preference en Mercado Pago
    const appUrl = Deno.env.get('APP_URL') || 'https://tatitos.netlify.app'
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!

    const mpItems = items.map((i: any) => ({
      id: i.producto_id,
      title: i.nombre,
      unit_price: Number(i.precio),
      quantity: Number(i.cantidad),
      currency_id: 'ARS',
    }))

    if (costo_envio > 0) {
      mpItems.push({
        id: 'envio',
        title: 'Costo de envío',
        unit_price: Number(costo_envio),
        quantity: 1,
        currency_id: 'ARS',
      })
    }

    const preferencePayload = {
      items: mpItems,
      payer: {
        name: cliente.nombre,
        phone: { number: cliente.telefono },
        email: cliente.email || 'cliente@tatitos.com',
      },
      back_urls: {
        success: `${appUrl}/pago/exito`,
        failure: `${appUrl}/pago/error`,
        pending: `${appUrl}/pago/pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      external_reference: pedido.id,
      statement_descriptor: 'Tatitos Panalera',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    })

    if (!mpRes.ok) {
      const err = await mpRes.text()
      throw new Error(`MP error: ${err}`)
    }

    const mpData = await mpRes.json()

    // Guardar preference_id en el pedido
    await supabase
      .from('pedidos')
      .update({ mp_preference_id: mpData.id })
      .eq('id', pedido.id)

    // Notificación WhatsApp a los dueños via CallMeBot
    await notificarDuenos(pedido, items, tipo_entrega, total)

    return new Response(
      JSON.stringify({
        pedido_id: pedido.id,
        numero: pedido.numero,
        init_point: mpData.init_point,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
