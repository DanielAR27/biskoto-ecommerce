const supabase = require('../config/supabase');

// Verifica el token JWT enviado por el cliente en las cookies o headers.
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado' });
  }

  try {
    // Se valida el token directamente con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Se guarda el objeto usuario en el request para uso posterior
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
};

// Verifica si el usuario autenticado tiene el rol de administrador.
const isAdmin = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', req.user.id)
      .single();

    if (error || data?.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos de usuario' });
  }
};

module.exports = { verifyToken, isAdmin };