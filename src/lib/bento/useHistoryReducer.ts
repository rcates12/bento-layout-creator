"use client";

import { useReducer, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryState<S> {
  past: S[];
  present: S;
  future: S[];
}

type InternalAction = { type: "__UNDO__" } | { type: "__REDO__" };

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useHistoryReducer<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  skipActions: string[] = [],
  loadState?: () => S | null | undefined,
) {
  const reducerRef = useRef(reducer);
  reducerRef.current = reducer;

  const skipSet = useRef(new Set(skipActions));
  skipSet.current = new Set(skipActions);

  const [history, rawDispatch] = useReducer(
    (state: HistoryState<S>, action: A | InternalAction): HistoryState<S> => {
      if (action.type === "__UNDO__") {
        if (state.past.length === 0) return state;
        const newPresent = state.past[state.past.length - 1];
        return {
          past: state.past.slice(0, -1),
          present: newPresent,
          future: [state.present, ...state.future],
        };
      }

      if (action.type === "__REDO__") {
        if (state.future.length === 0) return state;
        const [newPresent, ...newFuture] = state.future;
        return {
          past: [...state.past, state.present],
          present: newPresent,
          future: newFuture,
        };
      }

      const newPresent = reducerRef.current(state.present, action as A);

      // State unchanged — nothing to record
      if (newPresent === state.present) return state;

      // Skip-listed actions update state without recording history
      if (skipSet.current.has(action.type)) {
        return { ...state, present: newPresent };
      }

      // Record in history (cap at 50 entries)
      return {
        past: [...state.past.slice(-49), state.present],
        present: newPresent,
        future: [],
      };
    },
    undefined,
    (): HistoryState<S> => ({
      past: [],
      present: loadState?.() ?? initialState,
      future: [],
    }),
  );

  const dispatch = useCallback(
    (action: A) => rawDispatch(action),
    [rawDispatch],
  );

  const undo = useCallback(
    () => rawDispatch({ type: "__UNDO__" }),
    [rawDispatch],
  );

  const redo = useCallback(
    () => rawDispatch({ type: "__REDO__" }),
    [rawDispatch],
  );

  return {
    state: history.present,
    dispatch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
