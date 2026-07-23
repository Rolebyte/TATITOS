import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function formatPeso(n: number): string {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function notificarDuenos(pedido: any, items: any[], tipo_entrega: string, total: number, metodo_pago: string) {
  const duenos = [
    { phone: '5493492627811', apikey: '5568416' },
    { phone: '5493493459749', apikey: '6063730' },
  ]

  const numeroFormateado = String(pedido.numero).padStart(4, '0')
  const itemsTexto = items.map((i: any) => `${i.nombre} x${i.cantidad}`).join(', ')
  const entregaTexto =
    tipo_entrega === 'domicilio' ? 'Envio a domicilio' :
    tipo_entrega === 'localidad' ? 'Envio a localidad' : 'Retiro'

  const metodoTexto =
    metodo_pago === 'efectivo' ? 'Efectivo' :
    metodo_pago === 'transferencia' ? 'Transferencia' : 'Mercado Pago'

  const mensaje = [
    `Nuevo pedido #${numeroFormateado}`,
    `${pedido.cliente_nombre} - ${pedido.cliente_telefono}`,
    itemsTexto,
    `Total: ${formatPeso(total)}`,
    `${entregaTexto} — ${metodoTexto}`,
  ].join('\n')

  await Promise.allSettled(
    duenos.map(({ phone, apikey }) =>
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensaje)}&apikey=${apikey}`)
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
    const { cliente, items, tipo_entrega, direccion, notas, costo_envio, cupon_codigo, descuento, metodo_pago = 'mercadopago', recargo_mp = 0 } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const subtotal = items.reduce((acc: number, i: any) => acc + i.precio * i.cantidad, 0)
    const total = subtotal + (costo_envio || 0) + (recargo_mp || 0)

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
        cupon_codigo: cupon_codigo || null,
        descuento: descuento || 0,
        metodo_pago,
        recargo_mp: recargo_mp || 0,
        estado: metodo_pago === 'mercadopago' ? 'pendiente' : 'pendiente',
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    // Descontar stock inmediatamente al crear el pedido
    for (const item of items) {
      if (item.producto_id) {
        await supabase.rpc('decrementar_stock', {
          p_id: item.producto_id,
          p_cantidad: item.cantidad,
        })
      }
    }
    await supabase.from('pedidos').update({ stock_descontado: true }).eq('id', pedido.id)

    // Notificación WhatsApp a los dueños
    await notificarDuenos(pedido, items, tipo_entrega, total, metodo_pago)

    // Para efectivo/transferencia: no necesita MP
    if (metodo_pago !== 'mercadopago') {
      return new Response(
        JSON.stringify({
          pedido_id: pedido.id,
          numero: pedido.numero,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── MercadoPago ──
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

    if (recargo_mp > 0) {
      mpItems.push({
        id: 'recargo_mp',
        title: 'Recargo Mercado Pago',
        unit_price: Number(recargo_mp),
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

    await supabase
      .from('pedidos')
      .update({ mp_preference_id: mpData.id })
      .eq('id', pedido.id)

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
