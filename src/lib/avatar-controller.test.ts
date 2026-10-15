import { beforeEach, describe, expect, it } from 'vitest';
import { avatarStore, executeCommand, connectAvatarEvents } from './avatar-controller';

describe('Avatar AI commands', () => {
  beforeEach(() => avatarStore.reset());
  it.each([['speak', 'speaking'], ['listen', 'listening'], ['think', 'thinking'], ['idle', 'idle']])('%s selects %s', (command, state) => {
    expect(executeCommand({ command })).toBe(true);
    expect(avatarStore.getSnapshot().state).toBe(state);
  });
  it('triggers a wave again with a new animation identifier', () => {
    executeCommand({ command: 'gesture', value: 'wave' });
    const previous = avatarStore.getSnapshot().gestureId;
    executeCommand({ command: 'gesture', value: 'wave' });
    expect(avatarStore.getSnapshot().gesture).toBe('wave');
    expect(avatarStore.getSnapshot().gestureId).toBe(previous + 1);
  });
  it('sets an emotion and rejects unknown commands', () => {
    executeCommand({ command: 'setEmotion', value: 'happy' });
    expect(avatarStore.getSnapshot().emotion).toBe('happy');
    expect(executeCommand({ command: 'setEmotion', value: 'invalid' })).toBe(false);
    expect(avatarStore.getSnapshot().emotion).toBe('happy');
  });
  it('accepts external custom events and removes the API on cleanup', () => {
    const cleanup = connectAvatarEvents();
    window.dispatchEvent(new CustomEvent('aura:command', { detail: { command: 'listen' } }));
    expect(window.aura?.getState().state).toBe('listening');
    cleanup();
    expect(window.aura).toBeUndefined();
  });
});