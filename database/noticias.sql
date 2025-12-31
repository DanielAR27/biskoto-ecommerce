-- ============================================
-- TABLA NOTICIAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.noticias (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE,
  contenido TEXT NOT NULL,
  extracto TEXT,
  imagen_url TEXT,
  categoria TEXT DEFAULT 'general',
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  vistas INTEGER DEFAULT 0,
  fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_noticias_autor ON noticias(autor_id);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias(categoria);
CREATE INDEX IF NOT EXISTS idx_noticias_slug ON noticias(slug);
CREATE INDEX IF NOT EXISTS idx_noticias_activo ON noticias(activo);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON noticias(fecha_publicacion DESC);

-- ============================================
-- TABLA COMENTARIOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.comentarios (
  id BIGSERIAL PRIMARY KEY,
  noticia_id BIGINT NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para comentarios
CREATE INDEX IF NOT EXISTS idx_comentarios_noticia ON comentarios(noticia_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario ON comentarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_estado ON comentarios(estado);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en noticias
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer noticias activas
CREATE POLICY "Noticias activas públicas"
  ON noticias FOR SELECT
  USING (activo = true OR EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'admin'
  ));

-- Política: Solo admins pueden insertar
CREATE POLICY "Admins pueden crear noticias"
  ON noticias FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar
CREATE POLICY "Admins pueden actualizar noticias"
  ON noticias FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar
CREATE POLICY "Admins pueden eliminar noticias"
  ON noticias FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Habilitar RLS en comentarios
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Política: Ver comentarios aprobados o propios
CREATE POLICY "Comentarios visibles"
  ON comentarios FOR SELECT
  USING (
    estado = 'aprobado' 
    OR usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Política: Usuarios autenticados pueden crear comentarios
CREATE POLICY "Usuarios pueden comentar"
  ON comentarios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

-- Política: Usuarios pueden editar sus propios comentarios
CREATE POLICY "Usuarios pueden editar sus comentarios"
  ON comentarios FOR UPDATE
  USING (usuario_id = auth.uid());

-- Política: Usuarios pueden eliminar sus propios comentarios, admins pueden eliminar cualquiera
CREATE POLICY "Eliminar comentarios"
  ON comentarios FOR DELETE
  USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para noticias
DROP TRIGGER IF EXISTS update_noticias_updated_at ON noticias;
CREATE TRIGGER update_noticias_updated_at
  BEFORE UPDATE ON noticias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para comentarios
DROP TRIGGER IF EXISTS update_comentarios_updated_at ON comentarios;
CREATE TRIGGER update_comentarios_updated_at
  BEFORE UPDATE ON comentarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS DE PRUEBA (Opcional)
-- ============================================

-- Insertar una noticia de prueba (solo si el usuario admin existe)
-- Cambia el autor_id por tu UUID de usuario admin
/*
INSERT INTO noticias (titulo, slug, contenido, extracto, categoria, autor_id, activo, imagen_url)
VALUES (
  'Bienvenidos a nuestro blog',
  'bienvenidos-blog',
  'Esta es nuestra primera noticia. ¡Estamos emocionados de compartir contenido con ustedes!',
  'Primera noticia del blog de Biskoto',
  'general',
  'TU-UUID-ADMIN-AQUI', -- Cambia esto por tu UUID
  true,
  'https://via.placeholder.com/800x400'
);
*/