import { tasksEnum } from "./enums";
export interface ITasksData {
    [tasksEnum.initialPosition]: number | null;
    [tasksEnum.todoList]: number | null;
    [tasksEnum.taskFromList]: number | null;
    [tasksEnum.freshAirWalk]: number | null;
    [tasksEnum.gratitudeList]: number | null;
    [tasksEnum.goodDeed]: number | null;
}
export interface IUserData {
    ["Email Address"]: string;
    [`Ім'я та прізвище`]: string;
    ["Соц мережі відмітки"]: number | null;
}
export interface IRowData extends IUserData, ITasksData {
}
export interface IUserDataWithPosition {
    id: string;
    email: string;
    taskNumber: number;
    socialNetworkPoint: number;
    name: string;
}
export interface IUserInGroupData {
    imageUrl: string;
    email: string;
    name: string;
    socialNetworkPoint: number;
    taskNumber: number;
    id?: string;
}
export interface IMapTaskPosition {
    taskTitle: tasksEnum;
    taskNumber: number;
    cxPointers: number;
    cyPointers: number;
    cxStep: number;
    cyStep: number;
    users: IUserInGroupData[];
    color?: string;
    size?: string;
}
