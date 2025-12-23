import type { WorkoutSet } from '../../../types';

export type SetInputProps = {
  set: WorkoutSet;
  showRPE?: boolean;
  unit?: string;
  lastSet?: WorkoutSet | null;
  onLogSet?: (set: WorkoutSet) => void;
};

