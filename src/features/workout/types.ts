import type { ActiveWorkout, Exercise, WorkoutExercise } from '../../types';

export type ActiveWorkoutViewProps = {
  activeWorkout: ActiveWorkout;
  exercises: Exercise[];
  showRPE?: boolean;
  unit?: string;
  splitName?: string;
};

export type ExerciseCardProps = {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  exerciseInfo?: Exercise | null;
  showRPE?: boolean;
  unit?: string;
  onToggleComplete?: (exerciseIndex: number, isCompleted: boolean) => void;
};

export type WorkoutTimerProps = {
	startTime: Date;
};

