import type { SplitTemplate, TrainingSplit } from '../../types';

export type AvailableSplit = {
  split: TrainingSplit;
  templateName: string;
  templateId: string;
  isCustom: boolean;
};

export type SplitPickerProps = {
  template?: SplitTemplate;
  suggestedSplit?: TrainingSplit | null;
  todayName?: string;
};

export type CustomSplitBuilderProps = {
  builtInTemplates?: SplitTemplate[];
  customTemplates?: SplitTemplate[];
};

export type CustomSplitEditorProps = {
  customTemplates?: SplitTemplate[];
  builtInTemplates?: SplitTemplate[];
};

