import { useSyncExternalStore } from 'react';

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type Gesture = 'rest' | 'wave' | 'talk' | 'nod';
export type Emotion = 'neutral' | 'happy' | 'curious' | 'focused';
export type AvatarCommand = { command: 'speak' | 'listen' | 'think' | 'idle' } | { command: 'gesture'; value: Gesture } | { command: 'setEmotion'; value: Emotion };
export const stateLabels: Record<AIState, string> = { idle: 'Ocioso', listening: 'Ouvindo', thinking: 'Pensando', speaking: 'Falando' };
export const emotionLabels: Record<Emotion, string> = { neutral: 'Neutro', happy: 'Feliz', curious: 'Curioso', focused: 'Focado' };
export interface AvatarSettings {
  state: AIState; gesture: Gesture; emotion: Emotion; gestureId: number;
  breathing: boolean; blinking: boolean; headMovement: boolean; particles: boolean;
  scanlines: boolean; rotation: boolean; glow: number; speed: number; amplitude: number;
  paused: boolean; cameraReset: number; blinkId: number;
  logs: { id: number; text: string; time: string }[];
}
export const defaults: AvatarSettings = {
  state: 'idle', gesture: 'rest', emotion: 'neutral', gestureId: 0,
  breathing: true, blinking: true, headMovement: true, particles: true,
  scanlines: true, rotation: false, glow: 65, speed: 1, amplitude: 50,
  paused: false, cameraReset: 0, blinkId: 0, logs: [],
};
let current: AvatarSettings = { ...defaults };
const listeners = new Set<() => void>();
let logId = 0;
export const avatarStore = {
  getSnapshot: () => current,
  subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
  update: (patch: Partial<AvatarSettings>) => { current = { ...current, ...patch }; listeners.forEach(fn => fn()); },
  reset: () => { avatarStore.update({ ...defaults, logs: current.logs, cameraReset: current.cameraReset + 1 }); },
  log: (text: string) => {
    avatarStore.update({ logs: [{ id: ++logId, text, time: new Date().toLocaleTimeString('pt-BR', { hour12: false }) }, ...current.logs].slice(0, 30) });
  },
};
export function useAvatar() { return useSyncExternalStore(avatarStore.subscribe, avatarStore.getSnapshot, avatarStore.getSnapshot); }
export function executeCommand(input: unknown): boolean {
  if (!input || typeof input !== 'object' || !('command' in input)) return false;
  const command = input.command;
  const states: Record<string, AIState> = { speak: 'speaking', listen: 'listening', think: 'thinking', idle: 'idle' };
  if (typeof command !== 'string') return false;
  if (states[command]) {
    avatarStore.update({ state: states[command], paused: false });
  } else if (command === 'gesture' && 'value' in input && typeof input.value === 'string' && ['rest', 'wave', 'talk', 'nod'].includes(input.value)) {
    avatarStore.update({ gesture: input.value as Gesture, gestureId: current.gestureId + 1, paused: false });
  } else if (command === 'setEmotion' && 'value' in input && typeof input.value === 'string' && ['neutral', 'happy', 'curious', 'focused'].includes(input.value)) {
    avatarStore.update({ emotion: input.value as Emotion });
  } else return false;
  avatarStore.log(`${command}(${('value' in input) ? JSON.stringify(input.value) : ''})`);
  return true;
}
export interface AvatarAPI {
  speak: () => void; listen: () => void; think: () => void; idle: () => void;
  gesture: (name: Gesture) => void; setEmotion: (emotion: Emotion) => void;
  getState: () => AvatarSettings;
}
declare global { interface Window { aura?: AvatarAPI } }
export function connectAvatarEvents() {
  const api: AvatarAPI = {
    speak: () => { executeCommand({ command: 'speak' }); },
    listen: () => { executeCommand({ command: 'listen' }); },
    think: () => { executeCommand({ command: 'think' }); },
    idle: () => { executeCommand({ command: 'idle' }); },
    gesture: value => { executeCommand({ command: 'gesture', value }); },
    setEmotion: value => { executeCommand({ command: 'setEmotion', value }); },
    getState: avatarStore.getSnapshot,
  };
  window.aura = api;
  const onEvent = (event: Event) => { if (event instanceof CustomEvent) executeCommand(event.detail); };
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.data?.type !== 'aura:command') return;
    executeCommand(event.data);
  };
  window.addEventListener('aura:command', onEvent);
  window.addEventListener('message', onMessage);
  const unsubscribe = avatarStore.subscribe(() => window.dispatchEvent(new CustomEvent('aura:state', { detail: avatarStore.getSnapshot() })));
  return () => { if (window.aura === api) delete window.aura; window.removeEventListener('aura:command', onEvent); window.removeEventListener('message', onMessage); unsubscribe(); };
}