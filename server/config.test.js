// @vitest-environment node
import { connectDb } from './db.js';
import { readConfig } from './config.js';

describe('readConfig', () => {
  it.each([
    ['missing', {}],
    ['empty', { MONGODB_URI: '' }],
    ['blank', { MONGODB_URI: '   ' }],
  ])('throws a clear error when MONGODB_URI is %s', (_, env) => {
    expect(() => readConfig(env)).toThrow(/MONGODB_URI missing/);
  });

  it('returns the URI and a default port', () => {
    expect(readConfig({ MONGODB_URI: 'mongodb://example.test/db' })).toEqual({
      mongoUri: 'mongodb://example.test/db',
      port: 3001,
    });
  });

  it('reads PORT when it is set', () => {
    expect(readConfig({ MONGODB_URI: 'mongodb://example.test/db', PORT: '4000' }).port).toBe(4000);
  });
});

describe('connectDb', () => {
  it('calls mongoose.connect(uri) with no options and awaits it', async () => {
    const fakeMongoose = { connect: vi.fn().mockResolvedValue(undefined) };

    await connectDb('mongodb://example.test/db', fakeMongoose);

    expect(fakeMongoose.connect).toHaveBeenCalledWith('mongodb://example.test/db');
    expect(fakeMongoose.connect.mock.calls[0]).toHaveLength(1);
  });

  it('propagates a failed connection', async () => {
    const fakeMongoose = { connect: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) };

    await expect(connectDb('mongodb://example.test/db', fakeMongoose)).rejects.toThrow('ECONNREFUSED');
  });
});
