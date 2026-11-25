import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/renderWithRouter.jsx';

const PROFILES = [
  { id: '665f1c2a9b3e4d5f6a7b8c01', name: 'An', age: 22, bio: 'Thích trà sữa.' },
  { id: '665f1c2a9b3e4d5f6a7b8c02', name: 'Bình', age: 24, bio: 'Chạy bộ mỗi sáng.' },
];

const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

/** Deferred promise, to hold a request open while the test looks at the UI. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Stub global fetch. `handlers` maps "METHOD /path" to a function returning a
 * response (or a promise of one).
 */
function stubFetch(handlers) {
  const fetchMock = vi.fn(async (url, init = {}) => {
    const key = `${init.method ?? 'GET'} ${url}`;
    const handler = handlers[key];
    if (!handler) throw new Error(`Unexpected fetch: ${key}`);
    return handler(init);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const callsWith = (method) => (fetchMock) => fetchMock.mock.calls.filter(([, init]) => init?.method === method);
const postCalls = callsWith('POST');
const deleteCalls = callsWith('DELETE');
const card = (name) => screen.getByRole('group', { name });
const score = () => screen.getByText(/^score:/i);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loading profiles', () => {
  it('shows a loading state, then the first profile from GET /api/profiles', async () => {
    const pending = deferred();
    const fetchMock = stubFetch({ 'GET /api/profiles': () => pending.promise });

    renderApp('/swipe');

    // (renderApp's location probe is an <output>, which also has role=status)
    expect(screen.getByText(/loading profiles/i)).toHaveAttribute('role', 'status');
    expect(fetchMock).toHaveBeenCalledWith('/api/profiles', expect.objectContaining({ signal: expect.any(AbortSignal) }));

    pending.resolve(json(200, PROFILES));

    expect(await screen.findByRole('group', { name: 'An, 22' })).toBeInTheDocument();
    expect(screen.queryByText(/loading profiles/i)).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when the server answers 500', async () => {
    const user = userEvent.setup();
    const responses = [json(500, { error: 'Could not load profiles' }), json(200, PROFILES)];
    const fetchMock = stubFetch({ 'GET /api/profiles': () => responses.shift() });

    renderApp('/swipe');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not load profiles/i);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('group', { name: 'An, 22' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows an error when the network request itself fails', async () => {
    stubFetch({
      'GET /api/profiles': () => {
        throw new TypeError('Failed to fetch');
      },
    });

    renderApp('/swipe');

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to fetch/i);
  });

  it('aborts the request when the page unmounts', () => {
    const fetchMock = stubFetch({ 'GET /api/profiles': () => new Promise(() => {}) });

    const { unmount } = renderApp('/swipe');
    const { signal } = fetchMock.mock.calls[0][1];
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});

describe('saving swipes', () => {
  async function ready(postHandler) {
    const user = userEvent.setup();
    const fetchMock = stubFetch({
      'GET /api/profiles': () => json(200, PROFILES),
      'POST /api/swipe': postHandler,
    });
    renderApp('/swipe');
    (await screen.findByRole('group', { name: 'An, 22' })).focus();
    return { user, fetchMock };
  }

  it('POSTs each swipe as JSON, then advances the deck', async () => {
    const { user, fetchMock } = await ready((init) => json(201, { id: 'x', ...JSON.parse(init.body) }));

    await user.keyboard('{ArrowRight}');

    expect(await screen.findByRole('group', { name: 'Bình, 24' })).toBeInTheDocument();
    expect(score()).toHaveTextContent('Score: 10');

    const [[url, init]] = postCalls(fetchMock);
    expect(url).toBe('/api/swipe');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ profileId: PROFILES[0].id, action: 'LIKE' });
  });

  it('a failed save shows an error and leaves the deck unchanged', async () => {
    const { user } = await ready(() => json(500, { error: 'Could not save swipe' }));

    await user.keyboard('{ArrowLeft}');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t save.*An/i);
    expect(card('An, 22')).toBeInTheDocument();
    expect(score()).toHaveTextContent('Score: 0');
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  });

  it('a network failure on save also leaves the deck unchanged', async () => {
    const { user } = await ready(() => {
      throw new TypeError('Failed to fetch');
    });

    await user.keyboard('{ArrowUp}');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(card('An, 22')).toBeInTheDocument();
  });

  it('after a failed save, swiping again retries and clears the error', async () => {
    const responses = [json(500, { error: 'boom' }), json(201, {})];
    const { user, fetchMock } = await ready(() => responses.shift());

    await user.keyboard('{ArrowRight}');
    await screen.findByRole('alert');
    await user.keyboard('{ArrowRight}');

    expect(await screen.findByRole('group', { name: 'Bình, 24' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(postCalls(fetchMock)).toHaveLength(2);
    expect(score()).toHaveTextContent('Score: 10');
  });

  it('ignores more swipes and undo while a save is in flight', async () => {
    const pending = deferred();
    const { user, fetchMock } = await ready(() => pending.promise);

    await user.keyboard('{ArrowRight}');
    expect(card('An, 22')).toHaveAttribute('aria-busy', 'true');
    await user.keyboard('{ArrowLeft}{ArrowUp}{Backspace}');

    expect(postCalls(fetchMock)).toHaveLength(1);

    pending.resolve(json(201, {}));
    await waitFor(() => expect(score()).toHaveTextContent('Score: 10'));
    expect(card('Bình, 24')).toBeInTheDocument();
  });
});

describe('undo deletes the saved swipe', () => {
  const SWIPE_ID = '665f1c2a9b3e4d5f6a7b8caa';

  async function likedFirst(deleteHandler) {
    const user = userEvent.setup();
    const fetchMock = stubFetch({
      'GET /api/profiles': () => json(200, PROFILES),
      'POST /api/swipe': (init) => json(201, { id: SWIPE_ID, ...JSON.parse(init.body) }),
      [`DELETE /api/swipe/${SWIPE_ID}`]: deleteHandler,
    });
    renderApp('/swipe');
    (await screen.findByRole('group', { name: 'An, 22' })).focus();
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('group', { name: 'Bình, 24' });
    return { user, fetchMock };
  }

  it('sends DELETE /api/swipe/:id with the id from the POST, then pops history', async () => {
    const { user, fetchMock } = await likedFirst(() => ({ ok: true, status: 204, json: async () => null }));

    await user.keyboard('{Backspace}');

    expect(await screen.findByRole('group', { name: 'An, 22' })).toBeInTheDocument();
    expect(score()).toHaveTextContent('Score: 0');
    expect(deleteCalls(fetchMock)).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Undid like on An');
  });

  it('a failed delete shows an error and keeps the swipe', async () => {
    const { user } = await likedFirst(() => json(500, { error: 'Could not delete swipe' }));

    await user.keyboard('{Backspace}');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t undo.*An/i);
    expect(card('Bình, 24')).toBeInTheDocument();
    expect(score()).toHaveTextContent('Score: 10');
  });

  it('ignores swipes and a second undo while the delete is in flight', async () => {
    const pending = deferred();
    const { user, fetchMock } = await likedFirst(() => pending.promise);

    await user.keyboard('{Backspace}');
    expect(card('Bình, 24')).toHaveAttribute('aria-busy', 'true');
    await user.keyboard('{Backspace}{ArrowLeft}');

    expect(deleteCalls(fetchMock)).toHaveLength(1);
    expect(postCalls(fetchMock)).toHaveLength(1);

    pending.resolve({ ok: true, status: 204, json: async () => null });
    expect(await screen.findByRole('group', { name: 'An, 22' })).toBeInTheDocument();
  });
});
