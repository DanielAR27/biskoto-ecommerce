const supabase = require("../config/supabase");

/**
 * Gestiona las operaciones de compras y entradas de inventario.
 */
const getCompras = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("compras")
      .select(
        `
        *,
        proveedores (nombre)
      `,
      )
      .order("fecha_compra", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener las compras." });
  }
};

const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("compras")
      .select(
        `
        *,
        proveedores (nombre),
        compra_items (
          *,
          ingredientes (
            nombre, 
            unidades_medida (nombre, abreviatura)
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Compra no encontrada." });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener el detalle de la compra." });
  }
};

const createCompra = async (req, res) => {
  const { proveedor_id, monto_total, notas, items } = req.body;

  try {
    // 1. Insertar la cabecera
    const { data: compra, error: compraError } = await supabase
      .from("compras")
      .insert([{ proveedor_id, monto_total, notas }])
      .select()
      .single();

    if (compraError) throw compraError;

    // 2. Preparar ítems
    const itemsFormatted = items.map((item) => ({
      compra_id: compra.id,
      ingrediente_id: item.ingrediente_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }));

    // 3. Insertar detalles (Aquí el TRIGGER sumará automáticamente al stock)
    const { error: itemsError } = await supabase
      .from("compra_items")
      .insert(itemsFormatted);

    if (itemsError) throw itemsError;

    res.status(201).json(compra);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateCompra = async (req, res) => {
  const { id } = req.params;
  const { proveedor_id, monto_total, notas, items } = req.body;

  try {
    // 1. Actualizar la cabecera (compras)
    const { data: compraActualizada, error: compraError } = await supabase
      .from("compras")
      .update({ proveedor_id, monto_total, notas })
      .eq("id", id)
      .select()
      .single();

    if (compraError) throw compraError;

    // 2. Eliminar los items antiguos (el TRIGGER restará el stock automáticamente)
    const { error: deleteError } = await supabase
      .from("compra_items")
      .delete()
      .eq("compra_id", id);

    if (deleteError) throw deleteError;

    // 3. Insertar los nuevos items (el TRIGGER sumará el stock automáticamente)
    const itemsFormatted = items.map((item) => ({
      compra_id: parseInt(id),
      ingrediente_id: item.ingrediente_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }));

    const { error: itemsError } = await supabase
      .from("compra_items")
      .insert(itemsFormatted);

    if (itemsError) throw itemsError;

    res.json(compraActualizada);
  } catch (err) {
    console.error("Error al actualizar compra:", err);
    res
      .status(400)
      .json({ error: err.message || "Error al actualizar la compra." });
  }
};

const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params;

    // Al borrar la compra, el CASCADE borrará los items,
    // y el nuevo TRIGGER restará el stock automáticamente.
    const { error } = await supabase.from("compras").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Compra eliminada y stock revertido exitosamente." });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar la compra." });
  }
};

module.exports = {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
};
