import { motion } from "framer-motion";
import { Heart, Sparkles, Award, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SofiaFoto from "../assets/sofia.jpg";

const NosotrosPage = () => {
  // Animación de fade-in para secciones
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Valores de la empresa
  const valores = [
    {
      icon: Heart,
      titulo: "Pasión Artesanal",
      descripcion:
        "Cada receta lleva el amor y dedicación heredados de mi abuela Yayi, con ese toque especial que hace la diferencia.",
    },
    {
      icon: Sparkles,
      titulo: "Calidad Premium",
      descripcion:
        "Uso ingredientes de la más alta calidad, cuidando cada detalle para conquistar hasta los paladares más exigentes.",
    },
    {
      icon: Award,
      titulo: "Herencia Griega",
      descripcion:
        "Honro las recetas tradicionales que mi abuela de origen griego me compartió desde pequeña, con un toque costarricense.",
    },
    {
      icon: Users,
      titulo: "Hecho con Amor",
      descripcion:
        "Cada producto está preparado con gratitud y cariño para las personas que confían en mí y en Biskoto.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-biskoto via-biskoto-700 to-biskoto-900 dark:from-biskoto-900 dark:via-slate-900 dark:to-slate-950 text-white overflow-hidden">
        {/* Patrón decorativo */}
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
            className="text-center -translate-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              Quiénes Somos
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto font-light">
              Una historia de tradición, amor y repostería artesanal que endulza
              Costa Rica desde 2018
            </p>
          </motion.div>
        </div>

        {/* Onda decorativa */}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* Nuestra Historia */}
        <motion.section {...fadeIn}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6">
                Mi Historia
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="text-lg leading-relaxed">
                  Hola, soy{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    Sofía Montero
                  </span>
                  , la persona y el corazón detrás de{" "}
                  <span className="font-bold text-biskoto dark:text-biskoto-400">
                    Biskoto
                  </span>
                  .
                </p>
                <p className="text-lg leading-relaxed">
                  Biskoto es un emprendimiento de repostería artesanal, donde
                  preparo postres, queques y galletas con ingredientes de alta
                  calidad, cuidando cada detalle para conquistar incluso a los
                  paladares más exigentes.
                </p>
                <p className="text-lg leading-relaxed">
                  Este proyecto nace de una pasión muy especial por la cocina,
                  una que me heredó mi{" "}
                  <span className="font-bold text-biskoto dark:text-biskoto-400">
                    Yayi
                  </span>
                  , mi abuelita materna de origen griego. Desde pequeña me abrió
                  las puertas de su cocina, me compartió sus recetas y me dejó
                  experimentar, aprender y enamorarme de ese mundo lleno de
                  aromas y sabores.
                </p>
                <p className="text-lg leading-relaxed">
                  Con los años, cuando mis hijas ya estaban grandes, decidí
                  seguir aprendiendo y comencé a llevar cursos y talleres de
                  cocina. Poco a poco, familiares y amigos empezaron a pedirme
                  lo que preparaba… y sin darme cuenta, Biskoto ya estaba
                  tomando forma.
                </p>
                <p className="text-lg leading-relaxed">
                  Para un Día de la Madre, mis hijas me sorprendieron con uno de
                  los regalos más lindos que he recibido: crearon una cuenta de
                  Facebook para que pudiera iniciar el negocio de manera formal.
                  Ese gesto marcó un antes y un después, no solo para mí, sino
                  para toda nuestra familia.
                </p>
                <p className="text-lg leading-relaxed font-medium text-gray-900 dark:text-white">
                  Así nace Biskoto. Un proyecto hecho con amor, tradición y
                  mucha gratitud.
                </p>
                <p className="text-lg leading-relaxed italic">
                  Gracias a Dios y a cada persona que día a día confía, prueba y
                  disfruta de mis productos. Ustedes son parte de esta historia.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-biskoto/30 dark:border-biskoto-700/40 shadow-2xl">
                {/* Imagen de Sofía */}
                <img
                  src={SofiaFoto}
                  alt="Sofía Montero - Fundadora de Biskoto"
                  className="w-full h-full object-cover"
                />

                {/* Overlay con degradado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                {/* Texto sobre la imagen */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-center">
                  <p className="text-2xl font-black mb-1">Sofía Montero</p>
                  <p className="text-white/90 text-sm">
                    Fundadora y corazón de Biskoto
                  </p>
                </div>
              </div>
              {/* Decoración */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-biskoto/10 dark:bg-biskoto-900/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-biskoto-700/10 dark:bg-biskoto-700/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </motion.section>

        {/* Misión y Visión */}
        <motion.section {...fadeIn} className="py-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Misión */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-biskoto dark:text-biskoto-400" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                Nuestra Misión
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Crear experiencias dulces memorables a través de repostería
                artesanal de la más alta calidad, honrando las tradiciones que
                mi abuela Yayi me enseñó. Cada producto lleva el cuidado, amor y
                dedicación que cada persona merece, conquistando paladares y
                endulzando momentos especiales.
              </p>
            </div>

            {/* Visión */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-biskoto dark:text-biskoto-400" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                Nuestra Visión
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Ser reconocidos como una repostería artesanal de confianza en
                Costa Rica, donde la tradición griega y el amor por la cocina se
                encuentran para crear postres que no solo endulzan paladares,
                sino que también conectan corazones, celebran la vida y crean
                recuerdos inolvidables.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Nuestros Valores */}
        <motion.section {...fadeIn}>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Nuestros Valores
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Los principios que guían cada creación y nos hacen únicos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((valor, index) => (
              <motion.div
                key={valor.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-xl flex items-center justify-center mb-4">
                  <valor.icon className="w-7 h-7 text-biskoto dark:text-biskoto-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {valor.titulo}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {valor.descripcion}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section {...fadeIn} className="text-center py-12">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">
            ¿Quieres saber más?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Contáctanos o descubre nuestra selección de postres artesanales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/home"
              className="px-8 py-4 bg-biskoto hover:bg-biskoto-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-biskoto/30 hover:shadow-xl hover:scale-105 transition-all"
            >
              Ver Productos
            </a>
            <a
              href="/contacto"
              className="px-8 py-4 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-slate-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Contáctanos
            </a>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default NosotrosPage;
