/**
 * Shared shape for server-action results.
 *
 * This lives outside actions.ts because a "use server" module may only export
 * async functions — a plain object or a re-exported const breaks the build.
 */
export interface ActionState {
  ok: boolean;
  message: string | null;
}

export const IDLE: ActionState = { ok: false, message: null };
