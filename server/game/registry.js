// Action and timeout handler tables. Kept apart from engine.js so phase modules can register
// themselves without importing the engine (which imports them).

export class ActionError extends Error {
  /** code: 'wrong-phase' | 'not-allowed' | 'invalid' | 'too-late' */
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}

const handlers = new Map();
const timeouts = new Map();

/** fn(state, action, now, events): mutates the (already cloned) state, pushes GameEvents. */
export function registerHandler(type, fn) { handlers.set(type, fn); }
/** fn(state, now, events): runs when state.deadline of this kind passes. */
export function registerTimeout(kind, fn) { timeouts.set(kind, fn); }
export const getHandler = (type) => handlers.get(type);
export const getTimeout = (kind) => timeouts.get(kind);
