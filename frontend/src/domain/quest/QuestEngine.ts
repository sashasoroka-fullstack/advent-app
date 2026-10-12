import { questConfig } from "../../config";
import { QuestRowData, QuestUserProgress, QuestUserInGroup, QuestTaskPosition, QuestFinishConfig, QuestAnimationCoordinates, GroupedUsers, } from "./types";
import { finishScreenTypes } from "../../constants";
export class QuestEngine {
    private readonly avatarBaseUrl = "https://api.employee.leobit.co/photos-small";
    private generateAvatarUrl(userId: string): string {
        return `${this.avatarBaseUrl}/${userId}.png`;
    }
    private isValidEmail(email: string | null | undefined): boolean {
        return !!email && typeof email === "string" && email.includes("@");
    }
    private extractUserId(email: string): string {
        return email.split("@")[0];
    }
    private calculateTaskPosition(rowData: QuestRowData): number {
        const tasksArray = Object.keys(rowData)
            .filter((key) => {
            const cleanKey = key.trim().replace(/^["']|["']$/g, '');
            return /^\d+\./.test(cleanKey);
        })
            .sort((a, b) => {
            const cleanA = a.trim().replace(/^["']|["']$/g, '').replace(/^(\d+)\./, '$1');
            const cleanB = b.trim().replace(/^["']|["']$/g, '').replace(/^(\d+)\./, '$1');
            return parseInt(cleanA, 10) - parseInt(cleanB, 10);
        });
        const currentPosition = tasksArray.reduce((position, key) => {
            const value = (rowData as unknown as Record<string, string | number | null>)[key];
            return value !== null ? position + 1 : position;
        }, 0);
        return currentPosition > 0 ? currentPosition : 0;
    }
    getUserProgress(rowData: QuestRowData): QuestUserProgress | null {
        const email = rowData["Email Address"];
        if (!this.isValidEmail(email)) {
            return null;
        }
        const userId = this.extractUserId(email);
        let name = rowData[`Ім'я та прізвище`];
        if (!name || typeof name !== "string" || name.trim().length === 0 || name.trim() === `Ім'я та прізвище`) {
            const emailUsername = email.split("@")[0];
            name = emailUsername || email;
        }
        else {
            name = name.trim();
        }
        const socialNetworkPoint = rowData["Соц мережі відмітки"] ?? 0;
        const taskNumber = this.calculateTaskPosition(rowData);
        return {
            taskNumber,
            id: userId,
            email,
            socialNetworkPoint,
            name,
        };
    }
    getUserPosition(user: QuestUserProgress): number {
        return user.taskNumber;
    }
    isQuestFinished(user: QuestUserProgress): boolean {
        return questConfig.finalTaskIds.includes(user.taskNumber);
    }
    getFinishState(user: QuestUserProgress, isLoggedUser: boolean): QuestFinishConfig {
        if (!isLoggedUser) {
            return {
                type: "",
                taskNumber: 0,
                shouldShow: false,
            };
        }
        const taskNumber = user.taskNumber;
        if (taskNumber >= questConfig.firstFinishTaskId && taskNumber < questConfig.finalFinishTaskId) {
            return {
                type: finishScreenTypes.finish,
                taskNumber,
                shouldShow: true,
            };
        }
        if (taskNumber === questConfig.finalFinishTaskId) {
            return {
                type: finishScreenTypes.dzen,
                taskNumber,
                shouldShow: true,
            };
        }
        return {
            type: "",
            taskNumber: 0,
            shouldShow: false,
        };
    }
    getVisibleUsers(users: QuestUserProgress[], loggedUserId: string): QuestUserProgress[] {
        return users.filter((user) => {
            const isCurrentUserLoggedIn = user.id === loggedUserId;
            const isAtStartPosition = user.taskNumber === 0;
            if (isAtStartPosition && !isCurrentUserLoggedIn) {
                return false;
            }
            return true;
        });
    }
    groupUsersByPosition(users: QuestUserProgress[], loggedUserId: string, taskPositions: Partial<QuestTaskPosition>[]): QuestTaskPosition[] {
        const positions: QuestTaskPosition[] = JSON.parse(JSON.stringify(taskPositions));
        positions.forEach((position) => {
            position.users = [];
        });
        const visibleUsers = this.getVisibleUsers(users, loggedUserId);
        visibleUsers.forEach((userData) => {
            const imageUrl = this.generateAvatarUrl(userData.id);
            const { taskNumber, id, email, name, socialNetworkPoint } = userData;
            const position = positions.find((pos) => pos.taskNumber === taskNumber);
            if (!position) {
                return;
            }
            position.users.push({
                email,
                id,
                name,
                socialNetworkPoint,
                taskNumber,
                imageUrl,
            });
        });
        return positions;
    }
    shouldSeparateUser(taskNumber: number, userId: string, loggedUserId: string): boolean {
        const isLoggedUser = userId === loggedUserId;
        const isSpecialTask = questConfig.finalTaskIds.includes(taskNumber);
        return isLoggedUser && isSpecialTask;
    }
    isSpecialTask(taskNumber: number): boolean {
        return questConfig.finalTaskIds.includes(taskNumber);
    }
    filterUsersAtPosition(users: QuestUserInGroup[], loggedUserId: string, shouldSeparate: boolean): GroupedUsers {
        if (!shouldSeparate) {
            return {
                regularUsers: users,
                loggedUser: undefined,
            };
        }
        const regularUsers = users.filter((u) => u.id !== loggedUserId);
        const loggedUser = users.find((u) => u.id === loggedUserId);
        return {
            regularUsers,
            loggedUser,
        };
    }
    getFinishAnimationCoordinates(screenType: string, taskNumber: number): QuestAnimationCoordinates | null {
        if (screenType === finishScreenTypes.dzen) {
            return questConfig.finishAnimations.finalFinish;
        }
        if (screenType === finishScreenTypes.finish && taskNumber === questConfig.firstFinishTaskId) {
            return questConfig.finishAnimations.firstFinish;
        }
        return null;
    }
    evaluateAllUsersProgress(rowsData: QuestRowData[]): QuestUserProgress[] {
        const results = rowsData
            .map((rowData) => this.getUserProgress(rowData))
            .filter((progress): progress is QuestUserProgress => progress !== null);
        return results;
    }
}
export const questEngine = new QuestEngine();
