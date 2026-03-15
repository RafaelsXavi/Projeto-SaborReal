import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

// Explicit bind for Docker/Windows port forwarding reliability.
app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      hasPg: Boolean(env.DATABASE_URL),
      hasMongo: Boolean(env.MONGO_URI),
      procDbEnv: Boolean(process.env.DATABASE_URL),
      procMongoEnv: Boolean(process.env.MONGO_URI),
    },
    'api_listening',
  );
});
