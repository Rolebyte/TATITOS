import { Baby, Mail, Phone, ExternalLink } from 'lucide-react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '5493492000000'

export default function Footer() {
  const waLink = `https://wa.me/${WHATSAPP}?text=Hola%20Tatitos%2C%20quiero%20consultar%20un%20pedido`

  return (
    <footer id="contacto" className="bg-dark text-white pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl text-primary mb-3">
              <Baby size={24} />
              <span>Tatitos Pañalera</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Pañalera familiar con sede en Rafaela, Santa Fe. Envíos a todo el país.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-white mb-3">Horarios</h4>
            <p className="text-gray-400 text-sm">Lunes a viernes: 8 a 20hs</p>
            <p className="text-gray-400 text-sm">Sábados: 9 a 13hs</p>
            <p className="text-gray-400 text-sm mt-2">📍 Rafaela, Santa Fe, Argentina</p>
          </div>

          <div>
            <h4 className="font-display font-bold text-white mb-3">Contacto</h4>
            <div className="flex flex-col gap-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm transition-colors"
              >
                <Phone size={16} />
                WhatsApp
              </a>
              <a
                href="https://instagram.com/tatitospanalera"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm transition-colors"
              >
                <ExternalLink size={16} />
                @tatitospanalera
              </a>
              <a
                href="mailto:tatitospanalera@gmail.com"
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                <Mail size={16} />
                tatitospanalera@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Tatitos Pañalera — Rafaela, Santa Fe
        </div>
      </div>
    </footer>
  )
}
