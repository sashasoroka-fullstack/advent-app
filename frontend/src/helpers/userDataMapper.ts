import { IdTokenClaims } from "oidc-client-ts";
import { IRowData } from "../constants";
import { questEngine } from "../domain";
import { calculatePointerPosition } from "./pointerPosition";

export const usersDataMapper = (jsonData: IRowData[], user: IdTokenClaims, taskPositions: Array<{
    taskNumber: number;
    cxPointers: number;
    cyPointers: number;
    cxStep: number;
    cyStep: number;
    color?: string;
    size?: string;
}>) => {
    const usersProgress = questEngine.evaluateAllUsersProgress(jsonData);
    const usersMappedData = questEngine.groupUsersByPosition(usersProgress, user.sub, taskPositions);
    usersMappedData.forEach((mappedPosition) => {
        const { cxPointers, cyPointers } = calculatePointerPosition(mappedPosition.cxStep, mappedPosition.cyStep);
        mappedPosition.cxPointers = cxPointers;
        mappedPosition.cyPointers = cyPointers;
        const configPosition = taskPositions.find((pos) => pos.taskNumber === mappedPosition.taskNumber);
        if (configPosition?.color) {
            mappedPosition.color = configPosition.color;
        }
        if (configPosition?.size) {
            mappedPosition.size = configPosition.size;
        }
    });

    return usersMappedData;
};
