import type { WorkoutSet } from '../../../types';

export type SetInputProps = {
  set: WorkoutSet;
  showRPE?: boolean;
  unit?: string;
  distanceUnit?: string;
  lastSet?: WorkoutSet | null;
  onLogSet?: (set: WorkoutSet) => void;
  // Tracking flags - determine which inputs to show
  trackWeight?: boolean;
  trackReps?: boolean;
  trackTime?: boolean;
  trackDistance?: boolean;
};

