import type { SplitTemplate, WeeklySchedule } from '../../types';

export type TrainingSetupProps = {
  templates?: SplitTemplate[];
  currentTemplateId?: string;
  currentSchedule?: WeeklySchedule;
};

