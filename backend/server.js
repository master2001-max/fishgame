import { env } from './src/config/env.js';
import { initDatabase } from './src/db/database.js';
import { createApp } from './src/app.js';

initDatabase();

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`Fish Catcher backend listening on http://localhost:${env.PORT}`);
});
