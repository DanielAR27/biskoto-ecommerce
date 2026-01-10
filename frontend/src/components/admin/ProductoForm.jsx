import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  AlertCircle,
  Package,
  DollarSign,
  List,
  Info,
  Database,
  X,
  Image as ImageIcon,
  ChevronDown,
  Plus,
  Loader2,
  ChefHat,
  Trash2,
  CreditCard,
} from "lucide-react";

import { getCategorias } from "../../api/categoriaService";
import { getIngredientes } from "../../api/ingredienteService";
import { getSignedUploadUrl } from "../../api/storageService";
import { supabase } from "../../config/supabaseClient";
import SearchableSelect from "../../components/ui/SearchableSelect";

const ProductoForm = ({
  initialData,
  onSubmit,
  loading: submitting,
  error: externalError,
  buttonText = "Guardar Producto",
}) => {
  const [formData, setFormData] = useState({
    nombre: "",
    precio: 0,
    descripcion: "",
    categoria_id: "",
    stock_actual: 0,
    requiere_adelanto: initialData?.requiere_adelanto ?? false,
    porcentaje_adelanto: initialData?.porcentaje_adelanto ?? 50,
  });

  const [categorias, setCategorias] = useState([]);
  const [ingredientesDb, setIngredientesDb] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);

  const [receta, setReceta] = useState([]);
  const [selectedIngrediente, setSelectedIngrediente] = useState("");
  const [cantidadIngrediente, setCantidadIngrediente] = useState("");

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [itemError, setItemError] = useState(null);

  // NUEVO: Estado para errores locales (como el de subida de imágenes)
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setFetchingData(true);
        const [cats, ings] = await Promise.all([
          getCategorias(),
          getIngredientes(),
        ]);
        setCategorias(cats);
        setIngredientesDb(ings);
      } catch (err) {
        console.error("Error al cargar catálogos maestros", err);
      } finally {
        setFetchingData(false);
      }
    };
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        precio: initialData.precio ?? "",
        descripcion: initialData.descripcion || "",
        categoria_id: initialData.categoria_id || "",
        stock_actual: initialData.stock_actual ?? 0,
        requiere_adelanto: initialData.requiere_adelanto || false,
        porcentaje_adelanto: initialData.porcentaje_adelanto ?? 50,
      });

      if (initialData.producto_imagenes) {
        setFiles(
          initialData.producto_imagenes.map((img) => ({
            id: img.id,
            preview: img.url,
            url: img.url,
            isPrincipal: img.es_principal,
            isExisting: true,
          }))
        );
      }

      if (initialData.producto_ingredientes) {
        const recetaExistente = initialData.producto_ingredientes.map(
          (item) => ({
            id: item.ingrediente_id,
            nombre: item.ingredientes?.nombre,
            unidad: item.ingredientes?.unidades_medida?.abreviatura || "u",
            cantidad: item.cantidad_necesaria,
          })
        );
        setReceta(recetaExistente);
      }
    }
  }, [initialData]);

  // Gestión automática del scroll para errores externos O locales
  useEffect(() => {
    if (externalError || uploadError) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [externalError, uploadError]);

  const ingSeleccionadoObj = ingredientesDb.find(
    (i) => i.id === Number(selectedIngrediente)
  );
  const requiereEnteros = ingSeleccionadoObj
    ? ["u", "doc"].includes(
        ingSeleccionadoObj.unidades_medida?.abreviatura?.toLowerCase()
      )
    : false;

  const onDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles
        .slice(0, 10 - files.length)
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          isPrincipal: files.length === 0,
          id: Math.random().toString(36).substr(2, 9),
        }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 10,
  });

  const removeFile = (id) => {
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id);
      if (filtered.length > 0 && !filtered.some((f) => f.isPrincipal)) {
        filtered[0].isPrincipal = true;
      }
      return filtered;
    });
  };

  const setPrincipal = (id) => {
    setFiles((prev) => prev.map((f) => ({ ...f, isPrincipal: f.id === id })));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "precio" || name === "stock_actual"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const agregarIngrediente = () => {
    if (
      !selectedIngrediente ||
      !cantidadIngrediente ||
      Number(cantidadIngrediente) <= 0
    )
      return;

    if (requiereEnteros && !Number.isInteger(Number(cantidadIngrediente))) {
      setItemError(
        `El ingrediente "${ingSeleccionadoObj.nombre}" se mide en unidades enteras, no acepta decimales.`
      );
      return;
    }

    if (receta.some((item) => item.id === Number(selectedIngrediente))) return;

    const ingInfo = ingredientesDb.find(
      (i) => i.id === Number(selectedIngrediente)
    );
    if (!ingInfo) return;

    setReceta([
      ...receta,
      {
        id: ingInfo.id,
        nombre: ingInfo.nombre,
        unidad: ingInfo.unidades_medida?.abreviatura || "u",
        cantidad: Number(cantidadIngrediente),
      },
    ]);
    setItemError(null);
    setSelectedIngrediente("");
    setCantidadIngrediente("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de precio básico antes de intentar subir nada
    if (!formData.precio || Number(formData.precio) <= 0) {
      setUploadError("El precio de venta debe ser mayor a 0.");
      return;
    }

    setUploading(true);
    setUploadError(null); // Limpiamos errores previos

    try {
      const uploadPromises = files.map(async (f, index) => {
        if (f.isExisting)
          return { url: f.url, es_principal: f.isPrincipal, orden: index };

        const fileExt = f.file.name.split(".").pop();
        const fileName = `${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        // Aquí es donde ocurría el error 403/500
        const { token, path } = await getSignedUploadUrl(fileName);

        await supabase.storage
          .from("productos")
          .uploadToSignedUrl(path, token, f.file);

        const {
          data: { publicUrl },
        } = supabase.storage.from("productos").getPublicUrl(path);
        return { url: publicUrl, es_principal: f.isPrincipal, orden: index };
      });

      const imagenesFinales = await Promise.all(uploadPromises);

      const payload = {
        ...formData,
        imagenes: imagenesFinales,
        ingredientes: receta.map((item) => ({
          id: item.id,
          cantidad: item.cantidad,
        })),
      };

      await onSubmit(payload);
    } catch (err) {
      console.error("Error crítico durante el guardado:", err);
      // CORRECCIÓN: Ahora sí actualizamos el estado para mostrar el error visualmente
      setUploadError(
        "Error al procesar las imágenes. Verifica tu conexión o intenta de nuevo."
      );

      // Forzamos el scroll arriba manualmente por si el useEffect falla en timing
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setUploading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Sincronizando catálogos y unidades...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* CORRECCIÓN: Mostrar tanto error externo como el nuevo error de subida */}
      <AnimatePresence>
        {(externalError || uploadError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 flex items-center text-red-700 dark:text-red-400 overflow-hidden"
          >
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium">
              {externalError || uploadError}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        {/* ... (Resto del formulario igual que antes) ... */}

        {/* SECCIÓN: GALERÍA DE IMÁGENES */}
        <div className="space-y-4">
          {/* ... Código de Dropzone ... */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragActive
                ? "border-biskoto bg-biskoto/10 dark:border-white dark:bg-white/20"
                : "border-biskoto/40 bg-biskoto/5 dark:border-white/30 dark:bg-white/5 hover:border-biskoto dark:hover:border-white dark:hover:bg-white/10"
            }`}
          >
            <input {...getInputProps()} />
            <div className="p-4 rounded-full bg-white dark:bg-transparent shadow-sm border border-biskoto/20 dark:border-white/40">
              <Plus size={28} className="text-biskoto dark:text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-biskoto dark:text-white">
                Haz clic para subir{" "}
                <span className="font-normal opacity-80">
                  o arrastra tus fotos
                </span>
              </p>
              <p className="text-[11px] uppercase tracking-widest text-biskoto/60 dark:text-white/50 mt-1 font-bold">
                PNG, JPG o WEBP hasta 2MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 shadow-xl transition-all ${
                    file.isPrincipal
                      ? "border-biskoto ring-4 ring-biskoto/20 dark:border-white dark:ring-white/30"
                      : "border-white/10 dark:border-white/10"
                  }`}
                >
                  <img
                    src={file.preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrincipal(file.id)}
                    className={`absolute bottom-2 left-2 right-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                      file.isPrincipal
                        ? "bg-biskoto text-white dark:bg-white dark:text-slate-900"
                        : "bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white backdrop-blur-sm"
                    }`}
                  >
                    {file.isPrincipal ? "✓ Principal" : "Usar Portada"}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* SECCIÓN: DATOS GENERALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <Package size={16} /> Nombre del Producto{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre"
              type="text"
              required
              placeholder="Ej: Pastel de Chocolate"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-biskoto dark:text-white transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <List size={16} /> Categoría
            </label>
            <div className="relative z-30">
              <SearchableSelect
                value={formData.categoria_id}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, categoria_id: val }))
                }
                placeholder="Buscar categoría..."
                options={[
                  { value: "", label: "Sin categoría" },
                  ...categorias.map((cat) => ({
                    value: cat.id,
                    label: cat.nombre,
                  })),
                ]}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <DollarSign size={16} /> Precio de Venta{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              name="precio"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={formData.precio}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-biskoto dark:text-white transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              {" "}
              <Database size={16} /> Stock Actual para Venta
            </label>
            <input
              name="stock_actual"
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock_actual}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-biskoto dark:text-white transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <Info size={16} /> Descripción
            </label>
            <textarea
              name="descripcion"
              rows="3"
              placeholder="Detalles o ingredientes especiales..."
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-biskoto dark:text-white resize-none transition-all"
            />
          </div>
        </div>

        {/* ======================================== */}
        {/* NUEVA SECCIÓN: Configuración de Adelanto */}
        {/* ======================================== */}
        <div className="md:col-span-2 space-y-4 p-6 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <CreditCard size={18} className="text-biskoto" />
            Configuración de Adelanto
          </h3>

          {/* Checkbox: Requiere adelanto */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.requiere_adelanto}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiere_adelanto: e.target.checked,
                })
              }
              className="mt-1 w-4 h-4 text-biskoto focus:ring-biskoto rounded border-gray-300 dark:border-slate-600 transition-all"
            />
            <div className="flex-1">
              <span className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-biskoto dark:group-hover:text-biskoto transition-colors">
                Requiere pago adelantado
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                El cliente deberá pagar un porcentaje por adelantado para
                confirmar el pedido
              </p>
            </div>
          </label>

          {/* Campo: Porcentaje de adelanto (solo visible si está activado) */}
          {formData.requiere_adelanto && (
            <div className="pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Porcentaje de Adelanto <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={
                    formData.porcentaje_adelanto === ""
                      ? ""
                      : formData.porcentaje_adelanto
                  }
                  onChange={(e) => {
                    const raw = e.target.value; // string
                    if (raw === "") {
                      setFormData((prev) => ({
                        ...prev,
                        porcentaje_adelanto: "",
                      }));
                      return;
                    }

                    // permití que escriba, sin forzar default
                    setFormData((prev) => ({
                      ...prev,
                      porcentaje_adelanto: raw, // lo guardamos como string mientras escribe
                    }));
                  }}
                  onBlur={() => {
                    // al salir del campo, validamos y clamp
                    const n = Number(formData.porcentaje_adelanto);

                    const fixed = Number.isFinite(n)
                      ? Math.min(100, Math.max(1, Math.trunc(n)))
                      : 50;

                    setFormData((prev) => ({
                      ...prev,
                      porcentaje_adelanto: fixed,
                    }));
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-biskoto outline-none text-gray-900 dark:text-white font-bold text-lg shadow-sm transition-all"
                  required={formData.requiere_adelanto}
                />
                <span className="text-gray-600 dark:text-gray-400 font-bold text-lg">
                  %
                </span>
              </div>
              <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <Info
                  size={14}
                  className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Valor por defecto: 50%</strong>
                  <br />
                  El cliente pagará este porcentaje al hacer el pedido. El resto
                  se paga al recoger.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN: FICHA TÉCNICA (RECETA) */}
        <div className="pt-8 pb-6 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ChefHat className="text-biskoto" size={24} /> Ficha Técnica /
              Receta
            </h3>
            <span className="text-xs bg-biskoto/10 text-biskoto dark:bg-white/10 dark:text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              {receta.length} Insumos
            </span>
          </div>

          {/* Mensaje de error local con soporte para modo oscuro y botón de cierre */}
          <AnimatePresence>
            {itemError && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center justify-between text-red-700 dark:text-red-400 overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span className="text-xs font-bold tracking-tight">
                    {itemError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setItemError(null)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-800/40 rounded-full transition-colors"
                  title="Cerrar aviso"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-end mb-8 shadow-inner overflow-visible">
            {/* Selector Buscable (Estilo Blanco y Pequeño) */}
            <div className="flex-1 w-full relative z-20">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 block">
                Ingrediente
              </label>
              <SearchableSelect
                value={selectedIngrediente}
                onChange={(val) => setSelectedIngrediente(val)}
                placeholder="Buscar insumo..."
                // AQUI ESTÁ EL CAMBIO PARA QUE COINCIDA CON EL INPUT DE AL LADO
                bgClasses="bg-white dark:bg-slate-800"
                pyClasses="py-2.5"
                options={ingredientesDb.map((ing) => ({
                  value: ing.id,
                  label: ing.nombre,
                  subLabel: ing.unidades_medida?.abreviatura || "u",
                }))}
              />
            </div>

            {/* Campo Cantidad */}
            <div className="w-full md:w-32 relative z-10">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 block">
                Cant.
              </label>
              <input
                type="number"
                step={requiereEnteros ? "1" : "0.01"}
                min="0"
                placeholder="0.00"
                value={cantidadIngrediente}
                onChange={(e) => {
                  setCantidadIngrediente(e.target.value);
                  if (itemError) setItemError(null);
                }}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-biskoto outline-none dark:text-white shadow-sm transition-all"
              />
            </div>

            {/* Botón "+" (Deshabilitado si no hay datos) */}
            <button
              type="button"
              onClick={agregarIngrediente}
              disabled={
                !selectedIngrediente ||
                !cantidadIngrediente ||
                Number(cantidadIngrediente) <= 0
              }
              className="w-full md:w-[46px] h-[46px] flex items-center justify-center bg-slate-900 dark:bg-biskoto text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-md disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              title="Agregar a la receta"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>

          {receta.length > 0 ? (
            <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-visible shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase">
                      Ingrediente
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase text-center">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {receta.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                        {item.nombre}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-black text-biskoto dark:text-white uppercase tracking-tighter">
                          {item.cantidad} {item.unidad}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setReceta(receta.filter((r) => r.id !== item.id))
                          }
                          className="p-2 text-red-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
              <ChefHat className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay ingredientes asignados a esta receta.
              </p>
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <Link
            to="/admin/productos"
            className="px-10 py-3.5 text-center text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 transition-colors order-2 md:order-1 uppercase text-xs tracking-widest"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={uploading || submitting}
            className="bg-biskoto text-white px-12 py-3.5 rounded-xl font-black hover:bg-biskoto-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-biskoto/20 transition-all hover:-translate-y-1 active:translate-y-0 order-1 md:order-2 uppercase text-xs tracking-widest"
          >
            {uploading || submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductoForm;
