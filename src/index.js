require('dotenv').config();
const app = require('./app');
const { connectDb } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não definida. Configure o .env');
    process.exit(1);
  }
  await connectDb(uri);
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
