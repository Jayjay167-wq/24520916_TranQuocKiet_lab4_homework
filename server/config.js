const DEFAULT_PORT = 3001;

/**
 * Read server settings from the environment. Fails fast when MONGODB_URI is
 * missing so the server never starts half-configured.
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ mongoUri: string, port: number }}
 */
export function readConfig(env = process.env) {
  const mongoUri = env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI missing: copy .env.example to .env and set MONGODB_URI');
  }
  return { mongoUri, port: Number(env.PORT) || DEFAULT_PORT };
}
