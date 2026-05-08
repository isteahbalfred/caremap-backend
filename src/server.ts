import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 Serveur CareMap démarré sur le port ${PORT}`);
  logger.info(`📖 Environnement: ${process.env.NODE_ENV}`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1`);
});