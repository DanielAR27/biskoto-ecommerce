import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductoForm from '../ProductoForm';
import * as categoriaService from '../../../api/categoriaService';
import * as ingredienteService from '../../../api/ingredienteService';
import * as storageService from '../../../api/storageService';

// --- MOCK NUCLEAR DE FRAMER MOTION  ---
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    img: ({ children, ...props }) => <img {...props} />,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// --- MOCKS DE SERVICIOS ---
vi.mock('../../../api/categoriaService');
vi.mock('../../../api/ingredienteService');
vi.mock('../../../api/storageService');
vi.mock('../../../config/supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({
        uploadToSignedUrl: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://fake-url.com/img.jpg' } })
      })
    }
  }
}));

// Mock de Dropzone
vi.mock('react-dropzone', async () => {
  const actual = await vi.importActual('react-dropzone');
  return {
    ...actual,
    useDropzone: ({ onDrop }) => ({
      getRootProps: () => ({
        onClick: () => {},
        onDrop: (files) => onDrop(files) 
      }),
      getInputProps: () => ({}),
      isDragActive: false
    })
  };
});

// Mock del Select
vi.mock('../../ui/SearchableSelect', () => ({
  default: ({ value, onChange, options, placeholder }) => (
    <select 
      data-testid="mock-select" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children }) => <a href="#">{children}</a>
}));

describe('ProductoForm Component', () => {
  
  const mockCategorias = [
    { id: 1, nombre: 'Postres' },
    { id: 2, nombre: 'Bebidas' }
  ];
  
  const mockIngredientes = [
    { id: 10, nombre: 'Harina', unidades_medida: { abreviatura: 'kg' } },
    { id: 20, nombre: 'Huevo', unidades_medida: { abreviatura: 'u' } } 
  ];

  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    categoriaService.getCategorias.mockResolvedValue(mockCategorias);
    ingredienteService.getIngredientes.mockResolvedValue(mockIngredientes);
    storageService.getSignedUploadUrl.mockResolvedValue({ 
      token: 'fake-token', 
      path: 'fake-path' 
    });
    window.scrollTo = vi.fn();
  });

  it('renderiza correctamente y carga los catálogos iniciales', async () => {
    render(<ProductoForm onSubmit={mockSubmit} />);
    expect(screen.getByText(/Sincronizando catálogos/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Sincronizando catálogos/i)).not.toBeInTheDocument();
    });
  });

  it('muestra errores de validación si se intenta guardar con datos inválidos', async () => {
    render(<ProductoForm onSubmit={mockSubmit} />);
    
    await waitFor(() => {
        expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument();
    });

    // Llenar el NOMBRE para que el navegador NO bloquee el submit por "required"
    fireEvent.change(screen.getByPlaceholderText(/Ej: Pastel/i), { target: { value: 'Producto Inválido' } });

    // Se deja el PRECIO en 0 (que es el valor por defecto

    const submitBtn = screen.getByText('Guardar Producto');
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockSubmit).not.toHaveBeenCalled();

    // handleSubmit se ejecutó y setUploadError debió mostrar el mensaje
    expect(await screen.findByText(/precio de venta debe ser mayor a 0/i)).toBeInTheDocument();
    
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('permite agregar y eliminar ingredientes de la receta', async () => {
    render(<ProductoForm onSubmit={mockSubmit} />);
    await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

    const selects = screen.getAllByTestId('mock-select');
    fireEvent.change(selects[1], { target: { value: '10' } }); 

    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '2.5' } }); 

    const addBtn = screen.getByTitle('Agregar a la receta');
    fireEvent.click(addBtn);

    const table = await screen.findByRole('table');
    const harinaEnTabla = within(table).getByText('Harina');
    expect(harinaEnTabla).toBeInTheDocument();
    expect(within(table).getByText(/2.5 kg/i)).toBeInTheDocument();

    const row = harinaEnTabla.closest('tr');
    const trashBtn = within(row).getByRole('button'); 
    fireEvent.click(trashBtn);

    expect(within(table).queryByText('Harina')).not.toBeInTheDocument();
  });

  it('valida que los ingredientes por unidad (huevos) no acepten decimales', async () => {
    render(<ProductoForm onSubmit={mockSubmit} />);
    await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

    const selects = screen.getAllByTestId('mock-select');
    fireEvent.change(selects[1], { target: { value: '20' } }); 

    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '1.5' } }); 

    const addBtn = screen.getByTitle('Agregar a la receta');
    fireEvent.click(addBtn);

    expect(await screen.findByText(/se mide en unidades enteras/i)).toBeInTheDocument();
    
    const table = screen.queryByRole('table');
    if (table) {
      expect(within(table).queryByText('Huevo')).not.toBeInTheDocument();
    }
  });

  it('procesa el envío del formulario correctamente', async () => {
    render(<ProductoForm onSubmit={mockSubmit} />);
    await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Ej: Pastel/i), { target: { value: 'Pastel Test' } });
    
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[0], { target: { value: '5000' } }); 
    
    const selects = screen.getAllByTestId('mock-select');
    fireEvent.change(selects[0], { target: { value: '1' } }); 

    fireEvent.change(selects[1], { target: { value: '10' } }); 
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.click(screen.getByTitle('Agregar a la receta'));

    const saveBtn = screen.getByText('Guardar Producto');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit.mock.calls[0][0]).toMatchObject({
      nombre: 'Pastel Test',
      precio: 5000,
      categoria_id: '1',
      ingredientes: [{ id: 10, cantidad: 1 }]
    });
  });
});