// @vitest-environment node
import request from 'supertest';
import { createApp } from './app.js';

const ID = '665f1c2a9b3e4d5f6a7b8c9d';

function mockModels() {
  const lean = vi.fn().mockResolvedValue([
    { _id: ID, name: 'An', age: 22, bio: 'Thích trà sữa.', __v: 0 },
  ]);
  return {
    lean,
    Profile: { find: vi.fn(() => ({ lean })) },
    Swipe: {
      create: vi.fn(async (doc) => ({ _id: 'swipe-1', ...doc, createdAt: new Date(0) })),
      findByIdAndDelete: vi.fn(async (id) => ({ _id: id, profileId: ID, action: 'LIKE' })),
    },
  };
}

describe('GET /api/profiles', () => {
  it('returns lean profiles mapped to { id, name, age, bio }', async () => {
    const models = mockModels();

    const res = await request(createApp(models)).get('/api/profiles');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: ID, name: 'An', age: 22, bio: 'Thích trà sữa.' }]);
    expect(models.Profile.find).toHaveBeenCalledTimes(1);
    expect(models.lean).toHaveBeenCalledTimes(1);
  });

  it('answers 500 with { error } when the query fails', async () => {
    const models = mockModels();
    models.lean.mockRejectedValueOnce(new Error('connection lost'));

    const res = await request(createApp(models)).get('/api/profiles');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: expect.any(String) });
    expect(res.body.error).not.toMatch(/connection lost/); // no internals leaked
  });
});

describe('POST /api/swipe', () => {
  it.each(['LIKE', 'NOPE', 'SUPERLIKE'])('stores a valid %s swipe and answers 201', async (action) => {
    const models = mockModels();

    const res = await request(createApp(models)).post('/api/swipe').send({ profileId: ID, action });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'swipe-1', profileId: ID, action });
    expect(models.Swipe.create).toHaveBeenCalledWith({ profileId: ID, action });
  });

  it.each([
    ['an empty body', {}],
    ['a missing action', { profileId: ID }],
    ['an unknown action', { profileId: ID, action: 'MAYBE' }],
    ['a lowercase action', { profileId: ID, action: 'like' }],
    ['a missing profileId', { action: 'LIKE' }],
    ['a malformed profileId', { profileId: 'not-an-id', action: 'LIKE' }],
    ['a non-string profileId', { profileId: 42, action: 'LIKE' }],
  ])('answers 400 with { error } for %s and stores nothing', async (_, body) => {
    const models = mockModels();

    const res = await request(createApp(models)).post('/api/swipe').send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
    expect(models.Swipe.create).not.toHaveBeenCalled();
  });

  it('answers 400 for a body that is not valid JSON', async () => {
    const res = await request(createApp(mockModels()))
      .post('/api/swipe')
      .set('Content-Type', 'application/json')
      .send('{"profileId":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('answers 400 when Mongoose rejects the document', async () => {
    const models = mockModels();
    const invalid = Object.assign(new Error('Swipe validation failed'), { name: 'ValidationError' });
    models.Swipe.create.mockRejectedValueOnce(invalid);

    const res = await request(createApp(models)).post('/api/swipe').send({ profileId: ID, action: 'LIKE' });

    expect(res.status).toBe(400);
  });

  it('answers 500 with { error } when saving fails for another reason', async () => {
    const models = mockModels();
    models.Swipe.create.mockRejectedValueOnce(new Error('disk full'));

    const res = await request(createApp(models)).post('/api/swipe').send({ profileId: ID, action: 'LIKE' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});

describe('DELETE /api/swipe/:id', () => {
  const SWIPE_ID = '665f1c2a9b3e4d5f6a7b8caa';

  it('deletes the swipe and answers 204 with no body', async () => {
    const models = mockModels();

    const res = await request(createApp(models)).delete(`/api/swipe/${SWIPE_ID}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(models.Swipe.findByIdAndDelete).toHaveBeenCalledWith(SWIPE_ID);
  });

  it('answers 400 with { error } for a malformed id and deletes nothing', async () => {
    const models = mockModels();

    const res = await request(createApp(models)).delete('/api/swipe/not-an-id');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
    expect(models.Swipe.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('answers 404 with { error } when no swipe has that id', async () => {
    const models = mockModels();
    models.Swipe.findByIdAndDelete.mockResolvedValueOnce(null);

    const res = await request(createApp(models)).delete(`/api/swipe/${SWIPE_ID}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('answers 500 with { error } when the delete fails', async () => {
    const models = mockModels();
    models.Swipe.findByIdAndDelete.mockRejectedValueOnce(new Error('disk full'));

    const res = await request(createApp(models)).delete(`/api/swipe/${SWIPE_ID}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});
