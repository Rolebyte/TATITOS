import { useEffect } from 'react'

const BASE = 'Tatitos Pañalera'
const DESC_DEFAULT = 'Todo lo que tu bebé necesita, llegando a tu puerta. Pañales, toallitas, cremas y más. Rafaela, Santa Fe.'
const IMG_DEFAULT = 'https://brpotkzqrekjqezykkrx.supabase.co/storage/v1/object/public/productos-img/og-default.jpg'
const URL_BASE = 'https://tatitos.com.ar'

export default function useSEO({ titulo, descripcion, imagen, url } = {}) {
  useEffect(() => {
    const title = titulo ? `${titulo} | ${BASE}` : BASE
    const desc = descripcion || DESC_DEFAULT
    const img = imagen || IMG_DEFAULT
    const canonical = url ? `${URL_BASE}${url}` : URL_BASE

    document.title = title

    setMeta('description', desc)
    setOG('title', title)
    setOG('description', desc)
    setOG('image', img)
    setOG('url', canonical)
    setOG('type', 'website')
    setOG('site_name', BASE)
    setOG('locale', 'es_AR')
    setTwitter('card', 'summary_large_image')
    setTwitter('title', title)
    setTwitter('description', desc)
    setTwitter('image', img)
  }, [titulo, descripcion, imagen, url])
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

function setOG(property, content) {
  let el = document.querySelector(`meta[property="og:${property}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', `og:${property}`); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

function setTwitter(name, content) {
  let el = document.querySelector(`meta[name="twitter:${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', `twitter:${name}`); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
