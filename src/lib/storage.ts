import {
  emptyState,
  stateSchema,
  type AppState,
} from "@/features/nutrition/domain";
export const storageKey = "nextbite:v1";
export function loadState(): AppState {
  const text = localStorage.getItem(storageKey);
  if (!text) return structuredClone(emptyState);
  const result = stateSchema.safeParse(JSON.parse(text));
  if (!result.success)
    throw new Error(
      "Dati salvati non validi. Esportali prima di reimpostarli.",
    );
  return result.data;
}
export function saveState(state: AppState) {
  localStorage.setItem(storageKey, JSON.stringify(stateSchema.parse(state)));
}
