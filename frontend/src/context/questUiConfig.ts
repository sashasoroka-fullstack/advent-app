import type { ApiQuest } from "../services/api/questsApi";
import type { UIConfigJSON } from "../services/uiConfigSchema";
import { EMPTY_QUEST_ANIMATIONS } from "../constants/uiAnimations";

export function resolveFallbackStepIcon(taskNumber: number, template: UIConfigJSON): string {
  if (!template.steps || template.steps.length === 0) {
    return "";
  }
  const exactStep = template.steps.find((step) => step.taskNumber === taskNumber);
  if (exactStep) {
    return exactStep.icon;
  }
  const byIndex = template.steps[taskNumber];
  if (byIndex) {
    return byIndex.icon;
  }
  return template.steps[0].icon;
}

export function questToUIConfig(quest: ApiQuest, template: UIConfigJSON): UIConfigJSON {
  const steps = (quest.steps || [])
    .slice()
    .sort((a, b) => a.taskNumber - b.taskNumber)
    .map((step) => ({
      taskNumber: step.taskNumber,
      label: step.label || `Step ${step.taskNumber}`,
      cxStep: step.cxStep,
      cyStep: step.cyStep,
      icon: step.iconMedia?.url || resolveFallbackStepIcon(step.taskNumber, template),
      color: step.color || undefined,
      size: step.size || "7%",
      apiStepId: step.id,
    }));

  return {
    ...template,
    name: quest.name,
    map: {
      ...template.map,
      background: quest.backgroundMedia?.url || template.map.background,
      mapSvg: quest.mapMedia?.url || template.map.mapSvg,
    },
    steps: steps.length > 0 ? steps : ([] as UIConfigJSON["steps"]),
    animations: EMPTY_QUEST_ANIMATIONS,
    googleSheetUrl: undefined,
  };
}
