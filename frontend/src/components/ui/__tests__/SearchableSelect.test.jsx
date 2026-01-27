import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchableSelect from '../SearchableSelect';

const mockOptions = [
  { value: '1', label: 'Chocolate' },
  { value: '2', label: 'Vainilla' },
  { value: '3', label: 'Fresa' },
  { value: '4', label: 'Limón', subLabel: 'Cítrico' }
];

describe('SearchableSelect Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el placeholder cuando no hay ninguna opción seleccionada', () => {
    render(
      <SearchableSelect 
        options={mockOptions} 
        value="" 
        onChange={mockOnChange} 
        placeholder="Seleccione un sabor" 
      />
    );

    // Se verifica que el texto del placeholder esté presente
    expect(screen.getByText('Seleccione un sabor')).toBeInTheDocument();
    
    // Se verifica que el input de búsqueda (que indica menú abierto) no esté visible
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('muestra la etiqueta de la opción seleccionada correctamente', () => {
    render(
      <SearchableSelect 
        options={mockOptions} 
        value="2" 
        onChange={mockOnChange} 
      />
    );

    // Se verifica que se muestre el label correspondiente al value '2'
    expect(screen.getByText('Vainilla')).toBeInTheDocument();
    expect(screen.queryByText('Seleccionar...')).not.toBeInTheDocument();
  });

  it('despliega la lista de opciones y permite filtrar mediante búsqueda', () => {
    render(
      <SearchableSelect 
        options={mockOptions} 
        value="" 
        onChange={mockOnChange} 
      />
    );

    // CORRECCIÓN: En lugar de buscar por rol 'button', buscamos por el texto del placeholder.
    // Al hacer clic en el texto "Seleccionar...", el evento burbujea al div contenedor y abre el menú.
    const trigger = screen.getByText('Seleccionar...');
    fireEvent.click(trigger);

    // Ahora verificamos que las opciones sean visibles
    expect(screen.getByText('Chocolate')).toBeInTheDocument();
    expect(screen.getByText('Fresa')).toBeInTheDocument();

    // Filtramos escribiendo "Choc"
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Choc' } });

    // Verificamos el filtrado
    expect(screen.getByText('Chocolate')).toBeInTheDocument();
    expect(screen.queryByText('Fresa')).not.toBeInTheDocument();
  });

  it('llama a la función onChange con el valor correcto al hacer clic en una opción', () => {
    render(
      <SearchableSelect 
        options={mockOptions} 
        value="" 
        onChange={mockOnChange} 
      />
    );

    // 1. Abrir menú haciendo clic en el placeholder
    fireEvent.click(screen.getByText('Seleccionar...'));

    // 2. Seleccionar opción
    fireEvent.click(screen.getByText('Fresa'));

    // 3. Verificar llamada
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('3');

    // 4. Verificar cierre (el input de búsqueda ya no debe estar)
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('cierra el menú al hacer clic fuera del componente (click outside)', () => {
    render(
      <div>
        <div data-testid="outside">Elemento externo</div>
        <SearchableSelect 
          options={mockOptions} 
          value="" 
          onChange={mockOnChange} 
        />
      </div>
    );

    // Abrir menú
    fireEvent.click(screen.getByText('Seleccionar...'));
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();

    // Clic afuera
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Verificar cierre
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('limpia el término de búsqueda al hacer clic en el botón X', () => {
    render(
      <SearchableSelect 
        options={mockOptions} 
        value="" 
        onChange={mockOnChange} 
      />
    );

    // Abrir y escribir
    fireEvent.click(screen.getByText('Seleccionar...'));
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Texto a borrar' } });

    expect(searchInput.value).toBe('Texto a borrar');

    // Aquí sí podemos buscar un botón real o icono.
    // Como tu componente tiene un {searchTerm && <button><X/></button>},
    // al haber texto, ese botón existe. 
    // Como es el único botón visible en ese momento (el trigger es un div), getByRole('button') podría funcionar aquí,
    // pero para ser más seguros, buscamos el botón hermano del input.
    // O mejor aún, buscamos el SVG de la X si es complicado, pero intentemos con role 'button' que ahora SÍ debería existir para la X.
    
    // OPCIÓN A: Buscar el único botón presente (la X)
    const clearButton = screen.getByRole('button'); 
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
  });
});