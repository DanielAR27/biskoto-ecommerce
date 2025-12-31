const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Aseguramos que las variables estén cargadas

/**
 * Genera una URL firmada para permitir la subida de un archivo específico.
 * El ticket expira en 5 minutos por seguridad.
 */
const generarUrlSubida = async (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res
      .status(400)
      .json({ error: "El nombre del archivo es requerido." });
  }

  try {
    // 1. CREAMOS UNA INSTANCIA LIMPIA Y EXCLUSIVA PARA ESTA OPERACIÓN
    const storageClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY, // Debe ser SERVICE_ROLE_KEY
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // 2. Generar path único con timestamp
    const timestamp = Date.now();
    const filePath = `${timestamp}-${fileName}`;

    // 3. Determinar bucket según el tipo de archivo
    const bucket = fileName.includes("comprobante-")
      ? "comprobantes"
      : "productos";

    // 4. Generar URL firmada
    const { data, error } = await storageClient.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket: bucket,
    });
  } catch (error) {
    console.error("Error generando firma de storage:", error);
    if (error.statusCode === "403" || error.status === 400) {
      console.error(
        "🔍 Pista: Verifica que SUPABASE_KEY en el .env sea la SERVICE_ROLE (no la anon)."
      );
    }
    res
      .status(500)
      .json({ error: "No se pudo autorizar la subida al storage." });
  }
};

module.exports = { generarUrlSubida };
