import { MapPin, Phone, Mail, Instagram, Facebook, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  // Ícono personalizado de TikTok
  const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );

  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-white border-t border-gray-800 dark:border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1: Sobre Biskoto */}
          <div>
            <h3 className="text-lg font-black text-white mb-4">Biskoto</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Repostería artesanal con tradición griega y sabor costarricense
              desde 2018.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Heart className="w-4 h-4 text-biskoto-400" />
              <span>Hecho con amor en Costa Rica</span>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="text-lg font-black text-white mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/home"
                  className="text-gray-400 hover:text-biskoto-400 transition-colors text-sm"
                >
                  Productos
                </Link>
              </li>
              <li>
                <Link
                  to="/nosotros"
                  className="text-gray-400 hover:text-biskoto-400 transition-colors text-sm"
                >
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link
                  to="/contacto"
                  className="text-gray-400 hover:text-biskoto-400 transition-colors text-sm"
                >
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-gray-400 hover:text-biskoto-400 transition-colors text-sm"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h3 className="text-lg font-black text-white mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-biskoto-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">Cartago, Costa Rica</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Phone className="w-4 h-4 text-biskoto-400 flex-shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/50688383780"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-biskoto-400 transition-colors"
                >
                  +506 8838-3780
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Mail className="w-4 h-4 text-biskoto-400 flex-shrink-0 mt-0.5" />
                <button
                  onClick={() => {
                    const email = "hola" + "@" + "biskoto.cr";
                    navigator.clipboard.writeText(email);
                    alert("Email copiado: " + email);
                  }}
                  className="text-gray-400 hover:text-biskoto-400 transition-colors text-left"
                >
                  hola@biskoto.cr
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: Redes Sociales */}
          <div>
            <h3 className="text-lg font-black text-white mb-4">Síguenos</h3>
            <div className="flex gap-3">
              <a
                href="https://www.tiktok.com/@biskotodulces"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-biskoto-600 dark:bg-slate-800 dark:hover:bg-biskoto-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                title="TikTok"
              >
                <TikTokIcon />
              </a>
              <a
                href="https://www.instagram.com/biskoto_dulces/?hl=es-la"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-biskoto-600 dark:bg-slate-800 dark:hover:bg-biskoto-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/biskotodulcess/?locale=es_LA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 hover:bg-biskoto-600 dark:bg-slate-800 dark:hover:bg-biskoto-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                title="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>

            {/* Horarios */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Horario
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                L-V: 9:00 AM - 6:00 PM
                <br />
                Sáb: 10:00 AM - 4:00 PM
                <br />
                Dom: Cerrado
              </p>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 dark:border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Biskoto. Todos los derechos
              reservados.
            </p>

            {/* Enlaces legales (opcionales) */}
            <div className="flex gap-6 text-sm">
              <button
                onClick={() => alert("Próximamente: Términos y Condiciones")}
                className="text-gray-500 hover:text-biskoto-400 dark:text-gray-400 dark:hover:text-biskoto-400 transition-colors"
              >
                Términos
              </button>
              <button
                onClick={() => alert("Próximamente: Política de Privacidad")}
                className="text-gray-500 hover:text-biskoto-400 dark:text-gray-400 dark:hover:text-biskoto-400 transition-colors"
              >
                Privacidad
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
