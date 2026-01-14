module.exports = {
  // Indica que el entorno de prueba es Node.js
  testEnvironment: 'node',

  // Carpetas que Jest debe ignorar para ejecutar pruebas
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Configuración del Coverage (Cobertura)
  collectCoverage: true, // Para que siempre genere el reporte
  coverageDirectory: 'coverage',
  
  // Ignorar carpetas para el área de cobertura
  collectCoverageFrom: [
    'src/**/*.js',           // todo en src
    '!src/config/*.js',      // Ignorar archivos de configuración (como supabase.js)
    '!src/app.js',           // Ignorar el arranque de la app
    '!**/node_modules/**',   // Ignorar siempre node_modules
  ],

  // Indicar qué porcentaje mínimo se pide para que el test "pase" (opcional)
  /*
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  */

  // Mostrar cada test individualmente en la consola
  verbose: true,
};