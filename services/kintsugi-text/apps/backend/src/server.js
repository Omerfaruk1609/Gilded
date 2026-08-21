import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 KintsugiText Backend HTTP Server running on port ${PORT} [${env.NODE_ENV}]`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`👉 Analyze endpoint: POST http://localhost:${PORT}/api/v1/moderate`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
