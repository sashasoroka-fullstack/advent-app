import { IRowData, IUserDataWithPosition, IUserInGroupData, IMapTaskPosition } from "../../constants";
export type QuestRowData = IRowData;
export type QuestUserProgress = IUserDataWithPosition;
export type QuestUserInGroup = IUserInGroupData;
export type QuestTaskPosition = IMapTaskPosition;
export interface QuestFinishConfig {
    type: string;
    taskNumber: number;
    shouldShow: boolean;
}
export interface QuestAnimationCoordinates {
    top: string;
    left: string;
}
export interface GroupedUsers {
    regularUsers: QuestUserInGroup[];
    loggedUser: QuestUserInGroup | undefined;
}
export interface QuestUserState {
    userId: string;
    email: string;
    name: string;
    taskNumber: number;
    socialNetworkPoint: number;
    isFinished: boolean;
    finishState?: QuestFinishConfig;
}
