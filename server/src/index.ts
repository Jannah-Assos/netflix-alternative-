import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
// Local par défaut. Dans un conteneur ou derrière un proxy, définissez HOST=0.0.0.0 ;
// l'outil n'a pas d'authentification : exposez-le derrière un proxy (HTTPS, accès restreint) si besoin.
const host = process.env.HOST ?? '127.0.0.1';
const rateLimitMax = process.env.RATE_LIMIT === undefined ? undefined : Number(process.env.RATE_LIMIT);

const app = buildApp({
  trustProxy: process.env.TRUST_PROXY === '1',
  ...(rateLimitMax !== undefined && Number.isFinite(rateLimitMax) ? { rateLimitMax } : {}),
});

app
  .listen({ port, host })
  .then((addr) => console.log(`Open Media prêt sur ${addr}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
