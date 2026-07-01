import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { XCircle, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import IconBackground from '../../components/IconBackground';

/**
 * Componente de la página de inicio de sesión.
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.successMsg || '');
  const [showSuccess, setShowSuccess] = useState(!!location.state?.successMsg);

  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (showSuccess) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowAlert(false);
    setShowSuccess(false); 
    
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.error || 'Correo o contraseña incorrectos');
      setShowAlert(true);
    }
  };

  if (loading && !user) return null;

  return (
    <IconBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* Banner de Éxito */}
        {showSuccess && (
          <div className="max-w-md w-full mb-4 flex items-center justify-between bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-3" />
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">{successMessage}</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Banner de Error */}
        {showAlert && (
          <div className="max-w-md w-full mb-4 flex items-center justify-between bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setShowAlert(false)} className="text-red-500 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Tarjeta de Login */}
        <div className="max-w-md w-full space-y-6 p-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 transition-colors duration-300">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Bienvenido</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-light">
              Ingrese sus credenciales para acceder al sistema
            </p>
          </div>
          
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            
            {/* Campo Email */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto focus:border-transparent sm:text-sm transition-all"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Campo Contraseña con Ojo Mágico */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto focus:border-transparent sm:text-sm transition-all"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-all shadow-md active:scale-[0.98]"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/recuperar-password"
              className="text-sm font-medium text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors duration-200"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white/0">
                <div className="h-1.5 w-1.5 rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"></div>
              </span>
            </div>
          </div>

          <div className="text-center pb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Todavía no tienes cuenta?{' '}
              <Link
                to="/registro"
                className="font-medium text-biskoto dark:text-blue-400 underline decoration-biskoto/30 dark:decoration-blue-400/30 underline-offset-4 hover:text-biskoto-700 dark:hover:text-blue-300 transition-all duration-200"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </IconBackground>
  );
};

export default LoginPage;