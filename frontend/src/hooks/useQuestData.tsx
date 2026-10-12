import { useQuestDataContext } from "../context/QuestDataContext";

export const useQuestData = () => {
    const { data, error, isLoading } = useQuestDataContext();
    return { jsonData: data, error, isLoading };
};
