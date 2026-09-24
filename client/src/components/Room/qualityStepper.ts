import { MAX_STEP_DOWN } from "./videoQuality";

const CPU_SAMPLES_TO_STEP_DOWN = 2;
const CLEAR_SAMPLES_TO_STEP_UP = 4;
const MAX_CLEAR_SAMPLES_TO_STEP_UP = 32;

export interface StepperState {
  floor: number;
  stepDown: number;
  cpuStreak: number;
  clearStreak: number;
  clearNeeded: number;
  lastMove: "up" | "down" | null;
}

export function initialStepper(floor: number): StepperState {
  return { floor, stepDown: floor, cpuStreak: 0, clearStreak: 0, clearNeeded: CLEAR_SAMPLES_TO_STEP_UP, lastMove: null };
}

export function stepQuality(state: StepperState, reasons: string[]): StepperState {
  if (reasons.length === 0) return state;
  const cpuCount = reasons.filter((reason) => reason === "cpu").length;

  if (cpuCount * 2 >= reasons.length) {
    const cpuStreak = state.cpuStreak + 1;
    if (cpuStreak >= CPU_SAMPLES_TO_STEP_DOWN && state.stepDown < MAX_STEP_DOWN) {
      // a step-up that didn't stick doubles the wait before the next one
      const clearNeeded =
        state.lastMove === "up" ? Math.min(state.clearNeeded * 2, MAX_CLEAR_SAMPLES_TO_STEP_UP) : state.clearNeeded;
      return { ...state, stepDown: state.stepDown + 1, cpuStreak: 0, clearStreak: 0, clearNeeded, lastMove: "down" };
    }
    return { ...state, cpuStreak, clearStreak: 0 };
  }

  if (cpuCount > 0) return { ...state, cpuStreak: 0, clearStreak: 0 };

  const clearStreak = state.clearStreak + 1;
  if (clearStreak >= state.clearNeeded && state.stepDown > state.floor) {
    return { ...state, stepDown: state.stepDown - 1, cpuStreak: 0, clearStreak: 0, lastMove: "up" };
  }
  return { ...state, cpuStreak: 0, clearStreak };
}
