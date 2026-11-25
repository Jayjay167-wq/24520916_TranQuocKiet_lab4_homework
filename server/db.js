import mongoose from 'mongoose';

/**
 * Mongoose 8: connect with the URI only, no deprecated options, no callback.
 * @param {string} uri
 * @param {{ connect(uri: string): Promise<unknown> }} [client] injectable for tests
 */
export async function connectDb(uri, client = mongoose) {
  await client.connect(uri);
}
