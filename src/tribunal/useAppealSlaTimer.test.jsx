import { act, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { formatDuration, useAppealSlaTimer } from './useAppealSlaTimer.js';
import DossierView from './DossierView.jsx';

const T0 = new Date('2026-12-01T00:00:00Z').getTime();

let visibility = 'visible';
function setVisibility(state) {
  visibility = state;
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
});

afterEach(() => {
  vi.useRealTimers();
  delete document.visibilityState; // fall back to jsdom's prototype getter
});

const advance = (ms) => act(() => vi.advanceTimersByTime(ms));

describe('useAppealSlaTimer', () => {
  it('starts at deadline minus the current clock', () => {
    const { result } = renderHook(() => useAppealSlaTimer(T0 + 10_000));

    expect(result.current).toBe(10_000);
  });

  it('counts down once per tick', () => {
    const { result } = renderHook(() => useAppealSlaTimer(T0 + 10_000));

    advance(1_000);
    expect(result.current).toBe(9_000);
    advance(3_000);
    expect(result.current).toBe(6_000);
  });

  it('reads the clock on every tick instead of subtracting the tick length (no drift)', () => {
    const { result } = renderHook(() => useAppealSlaTimer(T0 + 10_000));

    // The clock moves 4.25s while no timer fires (busy main thread, sleeping laptop)…
    vi.setSystemTime(T0 + 4_250);
    // …then one late tick arrives.
    advance(1_000);

    expect(result.current).toBe(10_000 - 5_250);
  });

  it('resyncs immediately when the tab becomes visible again', () => {
    const { result } = renderHook(() => useAppealSlaTimer(T0 + 60_000));

    setVisibility('hidden');
    vi.setSystemTime(T0 + 30_000); // background tabs throttle intervals: no ticks ran
    expect(result.current).toBe(60_000);

    setVisibility('visible');

    expect(result.current).toBe(30_000);
  });

  it('clamps at 0 and stops its interval once the deadline passes', () => {
    const { result } = renderHook(() => useAppealSlaTimer(T0 + 2_500));

    advance(5_000);

    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns 0 without scheduling anything for a deadline already in the past', () => {
    const { result } = renderHook(() => useAppealSlaTimer(T0 - 1));

    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns 0 for an invalid deadline', () => {
    const { result } = renderHook(() => useAppealSlaTimer(Number.NaN));

    expect(result.current).toBe(0);
  });

  it('follows a new deadline passed on re-render', () => {
    const { result, rerender } = renderHook(({ deadline }) => useAppealSlaTimer(deadline), {
      initialProps: { deadline: T0 + 10_000 },
    });

    rerender({ deadline: T0 + 20_000 });
    expect(result.current).toBe(20_000);
    advance(1_000);
    expect(result.current).toBe(19_000);
  });

  it('removes its listener and interval on unmount', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useAppealSlaTimer(T0 + 10_000));
    const handler = add.mock.calls.find(([type]) => type === 'visibilitychange')?.[1];
    expect(handler).toBeTypeOf('function');
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(remove).toHaveBeenCalledWith('visibilitychange', handler);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0d 00:00:00'],
    [999, '0d 00:00:00'],
    [1_000, '0d 00:00:01'],
    [86_400_000 + 3_723_000, '1d 01:02:03'],
    [-5_000, '0d 00:00:00'],
  ])('%i ms -> %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe('appeal window on the dossier', () => {
  function renderDossier(id) {
    return render(
      <MemoryRouter initialEntries={[`/dossier/${id}`]}>
        <Routes>
          <Route path="/dossier/:playerID" element={<DossierView />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('counts down to the absolute deadline', () => {
    // Himass deadline: 2026-12-04T17:00:00+07:00
    vi.setSystemTime(new Date('2026-12-03T16:59:58+07:00'));
    renderDossier('himass');

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('1d 00:00:02');
    advance(1_000);
    expect(timer).toHaveTextContent('1d 00:00:01');
    expect(screen.getByRole('region', { name: /appeal window/i }).querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-12-04T17:00:00+07:00',
    );
  });

  it('says the window has closed once the deadline passes', () => {
    vi.setSystemTime(new Date('2026-12-04T16:59:59+07:00'));
    renderDossier('himass');

    advance(2_000);

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByText(/appeal window has closed/i)).toBeInTheDocument();
  });
});
