import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// 1. Agregamos los íconos del ojo
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import IconBackground from '../../components/IconBackground';
import ThemeToggleBtn from '../../components/ThemeToggleBtn';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2. Estados independientes para cada campo
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const token = params.get('access_token');

    if (token) {
      setResetToken(token);
    } else {
      setError('Enlace inválido o expirado. Vuelve a solicitar el correo.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    setError('');

    try {
      await updatePassword(password, resetToken);
      navigate('/login', { state: { successMsg: 'Contraseña actualizada. Inicia sesión.' } });
    } catch (err) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconBackground>
      
      {/* Botón flotante de Tema */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggleBtn />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Nueva Contraseña</h2>
          
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPO 1: Nueva Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-biskoto focus:border-biskoto bg-white dark:bg-slate-800 text-gray-900 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
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

            {/* CAMPO 2: Confirmar Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-biskoto focus:border-biskoto bg-white dark:bg-slate-800 text-gray-900 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!error}
              className="w-full py-2.5 bg-biskoto hover:bg-biskoto-700 text-white font-bold rounded-lg transition-colors shadow-md disabled:bg-indigo-300"
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </IconBackground>
  );
};

export default UpdatePasswordPage;