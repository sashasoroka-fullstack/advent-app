import { ReactNode } from "react";
import { UIConfigProvider } from "../../context/UIConfigContext";
import { ApiQuestProvider } from "../../context/ApiQuestContext";
import { QuestDataProvider } from "../../context/QuestDataContext";
import { StepEditingProvider } from "../../context/StepEditingContext";

export const QuestProviders = ({ children }: { children: ReactNode }) => (
  <UIConfigProvider>
    <ApiQuestProvider>
      <QuestDataProvider>
        <StepEditingProvider>{children}</StepEditingProvider>
      </QuestDataProvider>
    </ApiQuestProvider>
  </UIConfigProvider>
);
