import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
// Local par défaut : l'outil n'a ni authentification ni limitation de débit.
const host = process.env.HOST ?? '127.0.0.1';

const app = buildApp();
app
  .listen({ port, host })
  .then((addr) => console.log(`Open Media Scanner prêt sur ${addr}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
