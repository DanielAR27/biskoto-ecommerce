import { Search } from 'lucide-react';

const TableSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Buscar...", 
  resultCount 
}) => {
  return (
    // Quitamos el p-4 y justify-between para controlar el espacio nosotros
    <div className="flex items-center w-full gap-6">
      
      {/* Contenedor del Input: ahora crecerá todo lo posible */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // w-full para que use todo el flex-1
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-biskoto/20 focus:border-biskoto sm:text-sm transition-all"
          placeholder={placeholder}
        />
      </div>

      {/* Texto de Resultados: forzamos que no se rompa */}
      {resultCount !== undefined && (
        <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block whitespace-nowrap flex-shrink-0 font-medium">
          Mostrando <span className="font-black text-gray-900 dark:text-white">{resultCount}</span> resultados
        </div>
      )}
    </div>
  );
};

export default TableSearch;