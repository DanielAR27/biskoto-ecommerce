import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

const ContactoPage = () => {
  // Animación de fade-in
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Ícono TikTok
  const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );

  const googleMapsUrl = "https://maps.app.goo.gl/BpsFXAuVWVREogHD9";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-biskoto via-biskoto-700 to-biskoto-900 dark:from-biskoto-900 dark:via-slate-900 dark:to-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              Contáctanos
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto font-light">
              Estamos aquí para endulzar tus momentos especiales
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
              className="text-gray-50 dark:text-slate-950"
            />
          </svg>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Información + Mapa */}
        <motion.section {...fadeIn}>
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Columna Izquierda: Información */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700 space-y-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                Información de Contacto
              </h2>

              {/* Ubicación */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-biskoto dark:text-biskoto-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    Ubicación
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Cartago, Costa Rica
                  </p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-biskoto dark:text-biskoto-400 mt-2 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver en Google Maps
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-biskoto dark:text-biskoto-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    WhatsApp
                  </h3>
                  <a
                    href="https://wa.me/50688383780?text=Hola%20Biskoto%2C%20me%20gustaría%20hacer%20una%20consulta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-biskoto dark:text-biskoto-400 hover:underline font-semibold text-lg"
                  >
                    +506 8838-3780
                  </a>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Escríbenos para consultas y pedidos
                  </p>
                  <a
                    href="https://wa.me/50688383780"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir WhatsApp
                  </a>
                </div>
              </div>

              {/* Horarios */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-biskoto dark:text-biskoto-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    Horario
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p>Lunes a Viernes: 9:00 AM - 6:00 PM</p>
                    <p>Sábados: 10:00 AM - 4:00 PM</p>
                    <p>Domingos: Cerrado</p>
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="pt-6 border-t border-gray-200 dark:border-slate-600">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  Síguenos
                </h3>
                <div className="flex gap-3">
                  <a
                    href="https://www.tiktok.com/@biskotodulces"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 hover:bg-biskoto/20 dark:hover:bg-biskoto-900/40 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  >
                    <TikTokIcon />
                  </a>
                  <a
                    href="https://www.instagram.com/biskoto_dulces/?hl=es-la"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 hover:bg-biskoto/20 dark:hover:bg-biskoto-900/40 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Instagram className="w-6 h-6 text-biskoto dark:text-biskoto-400" />
                  </a>
                  <a
                    href="https://www.facebook.com/biskotodulcess/?locale=es_LA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 hover:bg-biskoto/20 dark:hover:bg-biskoto-900/40 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Facebook className="w-6 h-6 text-biskoto dark:text-biskoto-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Mapa */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
              <div className="h-full min-h-[600px] relative">
                {/* Encabezado */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-10">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Nuestra Ubicación
                  </h3>
                </div>

                {/* Mapa */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d246.37688207539593!2d-83.91915973854894!3d9.86277459999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0e3dbfe5f2a73%3A0x9f5f5f5f5f5f5f5f!2sCartago%2C%20Costa%20Rica!5e0!3m2!1ses!2scr!4v1234567890123!5m2!1ses!2scr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="Ubicación Biskoto"
                ></iframe>

                {/* Botón */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Abrir en Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section {...fadeIn} className="text-center">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">
            ¿Listo para hacer tu pedido?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Explora nuestra selección de postres artesanales
          </p>
          <a
            href="/home"
            className="inline-block px-8 py-4 bg-biskoto hover:bg-biskoto-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-biskoto/30 hover:shadow-xl hover:scale-105 transition-all"
          >
            Ver Productos
          </a>
        </motion.section>
      </main>
    </div>
  );
};

export default ContactoPage;
