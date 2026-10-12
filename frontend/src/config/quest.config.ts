import { tasksEnum } from "../constants";
import { logger } from "../utils/logger";
export type TaskType = "core" | "extra" | "finish";
export interface TaskConfig {
    id: number;
    label: tasksEnum;
    type: TaskType;
}
export interface FinishAnimationCoordinates {
    finalFinish: {
        top: string;
        left: string;
    };
    firstFinish: {
        top: string;
        left: string;
    };
}
export interface QuestConfig {
    name: string;
    taskCount: number;
    tasks: TaskConfig[];
    finalTaskIds: number[];
    firstFinishTaskId: number;
    finalFinishTaskId: number;
    finishAnimations: FinishAnimationCoordinates;
}
export const questConfig: QuestConfig = {
    name: "Well Being Quest",
    taskCount: 15,
    tasks: [
        {
            id: 0,
            label: tasksEnum.initialPosition,
            type: "core",
        },
        {
            id: 1,
            label: tasksEnum.todoList,
            type: "core",
        },
        {
            id: 2,
            label: tasksEnum.taskFromList,
            type: "core",
        },
        {
            id: 3,
            label: tasksEnum.freshAirWalk,
            type: "core",
        },
        {
            id: 4,
            label: tasksEnum.gratitudeList,
            type: "core",
        },
        {
            id: 5,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 6,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 7,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 8,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 9,
            label: tasksEnum.goodDeed,
            type: "finish",
        },
        {
            id: 10,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 11,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 12,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 13,
            label: tasksEnum.goodDeed,
            type: "extra",
        },
        {
            id: 14,
            label: tasksEnum.goodDeed,
            type: "finish",
        },
    ],
    finalTaskIds: [9, 14],
    firstFinishTaskId: 9,
    finalFinishTaskId: 14,
    finishAnimations: {
        finalFinish: {
            top: "38%",
            left: "245%",
        },
        firstFinish: {
            top: "130%",
            left: "-75%",
        },
    },
};
export const isFinishTask = (taskId: number): boolean => {
    if (taskId < 0 || taskId >= questConfig.taskCount) {
        logger.warn("QuestConfig", `isFinishTask called with invalid task ID: ${taskId}`);
        return false;
    }
    return questConfig.finalTaskIds.includes(taskId);
};
export const getTaskById = (taskId: number): TaskConfig | undefined => {
    if (taskId < 0 || taskId >= questConfig.taskCount) {
        logger.warn("QuestConfig", `getTaskById called with invalid task ID: ${taskId}`);
        return undefined;
    }
    return questConfig.tasks.find(task => task.id === taskId);
};
export const getTasksByType = (type: TaskType): TaskConfig[] => {
    if (!type) {
        logger.warn("QuestConfig", `getTasksByType called with invalid type: ${type}`);
        return [];
    }
    return questConfig.tasks.filter(task => task.type === type);
};
