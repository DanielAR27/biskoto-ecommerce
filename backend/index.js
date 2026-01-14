const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT;

// Solo inicia el servidor si NO esta en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}