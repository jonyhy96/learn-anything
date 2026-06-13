import { describe, it, expect, beforeEach } from 'vitest';
import { useProgressStore } from './progressStore';

// The unlock rule is the keystone of "where am I" — test it directly. We reset
// the store between tests so localStorage persistence doesn't bleed across cases.

const ORDER = [1, 2, 3, 4];

beforeEach(() => {
  useProgressStore.getState().reset();
});

describe('progress unlock logic', () => {
  it('opens the first lesson by default', () => {
    const { getStatus } = useProgressStore.getState();
    expect(getStatus(1, ORDER)).toBe('current');
  });

  it('locks lessons whose predecessor is not complete', () => {
    const { getStatus } = useProgressStore.getState();
    expect(getStatus(2, ORDER)).toBe('locked');
    expect(getStatus(3, ORDER)).toBe('locked');
  });

  it('unlocks the next lesson when one is completed', () => {
    const s = useProgressStore.getState();
    s.markCompleted(1);
    expect(s.getStatus(1, ORDER)).toBe('completed');
    expect(s.getStatus(2, ORDER)).toBe('current');
    expect(s.getStatus(3, ORDER)).toBe('locked');
  });

  it('is idempotent on repeated completion', () => {
    const s = useProgressStore.getState();
    s.markCompleted(1);
    s.markCompleted(1);
    expect(useProgressStore.getState().completedIds).toEqual([1]);
  });

  it('can undo a completion and re-lock downstream lessons', () => {
    const s = useProgressStore.getState();
    s.markCompleted(1);
    s.markIncomplete(1);
    expect(s.getStatus(1, ORDER)).toBe('current');
    expect(s.getStatus(2, ORDER)).toBe('locked');
  });
});
