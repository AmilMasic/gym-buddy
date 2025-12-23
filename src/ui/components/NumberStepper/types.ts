export type NumberStepperProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  quickIncrements?: number[]; // Quick increment buttons (e.g., [10, 25, 45] for weight)
  quickDecrements?: number[]; // Quick decrement buttons (e.g., [10, 25, 45] renders as -10, -25, -45)
  allowDirectInput?: boolean; // Allow tapping the number to type directly
};

