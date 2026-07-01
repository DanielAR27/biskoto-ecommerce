import { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; 
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import IconBackground from '../../components/IconBackground';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { resetPasswordRequest } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPasswordRequest(email);
      setMessage('Te hemos enviado un enlace de recuperación a tu correo.');
    } catch (err) {
      console.error("Error original de Supabase:", err);  
      setError('No se pudo enviar el correo. Verifica que la dirección sea correcta o inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconBackground>
      {/* Contenedor Centrado */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 transition-colors duration-300">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar Contraseña</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu correo y te enviaremos las instrucciones.
            </p>
          </div>

          {/* Mensaje de Éxito */}
          {message && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-biskoto focus:border-biskoto bg-white dark:bg-slate-800 text-gray-900 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none disabled:bg-indigo-400 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </IconBackground>
  );
};

export default ForgotPasswordPage;