import { useState } from "react";
import { Mail, Send } from "lucide-react";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    // Simular envío (aquí puedes integrar EmailJS o tu backend)
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setFormData({ nombre: "", email: "", mensaje: "" });

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setEnviado(false), 5000);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-biskoto/10 dark:bg-biskoto-900/30 rounded-xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-biskoto dark:text-biskoto-400" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
          Envíanos un mensaje
        </h3>
      </div>

      {enviado && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold">Mensaje enviado</p>
            <p className="text-sm">Te responderemos pronto</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nombre
          </label>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-biskoto dark:focus:border-biskoto-400 focus:outline-none transition-colors"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-biskoto dark:focus:border-biskoto-400 focus:outline-none transition-colors"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Mensaje
          </label>
          <textarea
            required
            rows={5}
            value={formData.mensaje}
            onChange={(e) =>
              setFormData({ ...formData, mensaje: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-biskoto dark:focus:border-biskoto-400 focus:outline-none transition-colors resize-none flex-1"
            placeholder="¿En qué podemos ayudarte?"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full px-6 py-4 bg-biskoto hover:bg-biskoto-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-biskoto/30 hover:shadow-xl hover:scale-105 disabled:scale-100 transition-all flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Enviar Mensaje
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        También puedes contactarnos por WhatsApp para respuesta inmediata
      </p>
    </div>
  );
};

export default ContactForm;
