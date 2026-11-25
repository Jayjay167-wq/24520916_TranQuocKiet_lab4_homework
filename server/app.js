import express from 'express';
import * as models from './models.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** @returns {string | null} an error message, or null when the body is valid */
function validateSwipe(body) {
  const { profileId, action } = body ?? {};
  if (typeof profileId !== 'string' || !OBJECT_ID.test(profileId)) {
    return 'profileId must be a 24-character hex ObjectId';
  }
  if (!models.SWIPE_ACTIONS.includes(action)) {
    return `action must be one of ${models.SWIPE_ACTIONS.join(', ')}`;
  }
  return null;
}

const isMongooseInputError = (err) => err?.name === 'ValidationError' || err?.name === 'CastError';

/**
 * Build the API. Models are injected so tests can pass mocks.
 * @param {{ Profile: typeof models.Profile, Swipe: typeof models.Swipe }} [deps]
 */
export function createApp({ Profile, Swipe } = models) {
  const app = express();
  app.use(express.json());

  app.get('/api/profiles', async (req, res) => {
    try {
      const docs = await Profile.find({}, 'name age bio').lean();
      res.json(docs.map(({ _id, name, age, bio }) => ({ id: String(_id), name, age, bio })));
    } catch (err) {
      console.error('GET /api/profiles failed:', err);
      res.status(500).json({ error: 'Could not load profiles' });
    }
  });

  app.post('/api/swipe', async (req, res) => {
    const invalid = validateSwipe(req.body);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    const { profileId, action } = req.body;
    try {
      const saved = await Swipe.create({ profileId, action });
      res.status(201).json({
        id: String(saved._id),
        profileId: String(saved.profileId),
        action: saved.action,
        createdAt: saved.createdAt,
      });
    } catch (err) {
      if (isMongooseInputError(err)) {
        res.status(400).json({ error: err.message });
        return;
      }
      console.error('POST /api/swipe failed:', err);
      res.status(500).json({ error: 'Could not save swipe' });
    }
  });

  app.delete('/api/swipe/:id', async (req, res) => {
    const { id } = req.params;
    if (!OBJECT_ID.test(id)) {
      res.status(400).json({ error: 'id must be a 24-character hex ObjectId' });
      return;
    }

    try {
      const deleted = await Swipe.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Swipe not found' });
        return;
      }
      res.status(204).end();
    } catch (err) {
      console.error('DELETE /api/swipe/:id failed:', err);
      res.status(500).json({ error: 'Could not delete swipe' });
    }
  });

  // Malformed JSON from express.json() arrives here; answer with JSON, not HTML.
  // Express only treats a handler as an error handler when it declares 4 params.
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Request body is not valid JSON' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
