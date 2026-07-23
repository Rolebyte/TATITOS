import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)

    // MP sends notifications either as query params (IPN) or JSON body (Webhooks)
    let topic = url.searchParams.get('topic') || url.searchParams.get('type')
    let id = url.searchParams.get('id') || url.searchParams.get('data.id')

    // Parse JSON body for modern MP webhook format
    if (!id || !topic) {
      try {
        const body = await req.json()
        topic = topic || body.type || body.topic
        id = id || body.data?.id || body.id
      } catch {
        // not JSON, ignore
      }
    }

    if (topic !== 'payment' && topic !== 'merchant_order') {
      return new Response('ok', { status: 200 })
    }

    if (!id) {
      return new Response('ok', { status: 200 })
    }

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Consultar pago en MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    })

    if (!mpRes.ok) return new Response('ok', { status: 200 })

    const payment = await mpRes.json()
    const pedidoId = payment.external_reference

    if (!pedidoId) return new Response('ok', { status: 200 })

    const mpStatus = payment.status
    let nuevoEstado = 'pendiente'

    if (mpStatus === 'approved') nuevoEstado = 'confirmado'
    else if (mpStatus === 'rejected' || mpStatus === 'cancelled') nuevoEstado = 'cancelado'

    // Actualizar pedido
    await supabase
      .from('pedidos')
      .update({
        estado: nuevoEstado,
        mp_payment_id: String(payment.id),
        mp_status: mpStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)

    // Si fue aprobado, descontar stock (solo si no fue descontado ya)
    if (mpStatus === 'approved') {
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('items, stock_descontado')
        .eq('id', pedidoId)
        .single()

      if (pedido?.items && !pedido.stock_descontado) {
        for (const item of pedido.items) {
          if (item.producto_id) {
            await supabase.rpc('decrementar_stock', {
              p_id: item.producto_id,
              p_cantidad: item.cantidad,
            })
          }
        }
        await supabase.from('pedidos').update({ stock_descontado: true }).eq('id', pedidoId)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
})
