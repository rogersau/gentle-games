export type GuidedRoundPhase = 'independent' | 'hinted' | 'modelled' | 'corrected' | 'skipped';

export type GuidedSupportLevel = 'independent' | 'hinted' | 'modelled';

export interface GuidedRoundState {
  phase: GuidedRoundPhase;
  incorrectAttempts: number;
  instructionReplayCount: number;
  exampleNumber: number;
}

export interface GuidedRoundOptions {
  hintAfter?: number;
  modelAfter?: number;
  recordProgress?: boolean;
  onRecordSupport?: (supportLevel: GuidedSupportLevel) => void;
}

export interface GuidedRoundController {
  getState: () => GuidedRoundState;
  attempt: (isCorrect: boolean) => GuidedRoundState;
  replayInstructions: () => GuidedRoundState;
  skip: () => GuidedRoundState;
  startNextExample: () => GuidedRoundState;
  registerCancellation: (cancel: () => void) => () => void;
  dispose: () => void;
}

const initialState = (exampleNumber = 1): GuidedRoundState => ({
  phase: 'independent',
  incorrectAttempts: 0,
  instructionReplayCount: 0,
  exampleNumber,
});

export function createGuidedRoundController(
  options: GuidedRoundOptions = {},
): GuidedRoundController {
  const hintAfter = Math.max(1, Math.floor(options.hintAfter ?? 1));
  const modelAfter = Math.max(hintAfter + 1, Math.floor(options.modelAfter ?? 2));
  let state = initialState();
  let disposed = false;
  const cancellations = new Set<() => void>();

  const supportLevel = (): GuidedSupportLevel =>
    state.phase === 'modelled' ? 'modelled' : state.phase === 'hinted' ? 'hinted' : 'independent';

  const attempt = (isCorrect: boolean): GuidedRoundState => {
    if (disposed || state.phase === 'corrected' || state.phase === 'skipped') return state;

    if (isCorrect) {
      const completedWith = supportLevel();
      state = { ...state, phase: 'corrected' };
      if (options.recordProgress) options.onRecordSupport?.(completedWith);
      return state;
    }

    const incorrectAttempts = state.incorrectAttempts + 1;
    const phase: GuidedRoundPhase =
      incorrectAttempts >= modelAfter
        ? 'modelled'
        : incorrectAttempts >= hintAfter
          ? 'hinted'
          : 'independent';
    state = { ...state, incorrectAttempts, phase };
    return state;
  };

  return {
    getState: () => state,
    attempt,
    replayInstructions: () => {
      if (!disposed && state.phase !== 'corrected' && state.phase !== 'skipped') {
        state = { ...state, instructionReplayCount: state.instructionReplayCount + 1 };
      }
      return state;
    },
    skip: () => {
      if (!disposed && state.phase !== 'corrected') state = { ...state, phase: 'skipped' };
      return state;
    },
    startNextExample: () => {
      if (!disposed && (state.phase === 'corrected' || state.phase === 'skipped')) {
        state = initialState(state.exampleNumber + 1);
      }
      return state;
    },
    registerCancellation: (cancel) => {
      if (disposed) {
        cancel();
        return () => undefined;
      }
      cancellations.add(cancel);
      return () => cancellations.delete(cancel);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancellations.forEach((cancel) => cancel());
      cancellations.clear();
    },
  };
}
