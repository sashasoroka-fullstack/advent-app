import { FC, useMemo } from "react";
import { UserPointer } from "./UserPointer";
import { OverflowUserPointer } from "./OverflowUserPointer";
import { motion } from "framer-motion";
import { IMapTaskPosition } from "../../constants";
import { useAuthContext } from "../../auth/AuthContext";
import { questEngine } from "../../domain";
import { useUIConfig } from "../../context/UIConfigContext";
import "./StackedPointers.css";

const MAX_VISIBLE_AVATARS = 5;

export interface StackedPointersProps {
    hoverIndex: number;
    groupIndex: number;
    isHover: boolean;
    group: IMapTaskPosition;
}

export const StackedPointers: FC<StackedPointersProps> = ({
    hoverIndex,
    groupIndex,
    isHover,
    group,
}) => {
    const { user } = useAuthContext();
    const { uiConfig } = useUIConfig();

    const { displayUsers, loggedUser } = useMemo(() => {
        if (group.users.length === 0) {
            return { displayUsers: [], loggedUser: undefined };
        }

        const loggedUserId = user?.profile.sub;
        if (!loggedUserId) {
            return { displayUsers: group.users, loggedUser: undefined };
        }

        const shouldSeparate = questEngine.isSpecialTask(group.taskNumber);
        const { regularUsers, loggedUser: foundLoggedUser } = questEngine.filterUsersAtPosition(
            group.users,
            loggedUserId,
            shouldSeparate,
        );

        return {
            displayUsers: foundLoggedUser
                ? [...regularUsers, foundLoggedUser]
                : regularUsers,
            loggedUser: foundLoggedUser,
        };
    }, [group.users, group.taskNumber, user?.profile.sub]);

    if (!uiConfig) {
        return null;
    }

    const shouldShowHover =
        hoverIndex === groupIndex &&
        isHover &&
        group.users.length <= uiConfig.pointers.maxBeforeModal;

    if (displayUsers.length === 0) {
        return null;
    }

    const hasOverflow = displayUsers.length > MAX_VISIBLE_AVATARS;
    const visibleUsers = hasOverflow
        ? displayUsers.slice(0, MAX_VISIBLE_AVATARS - 1)
        : displayUsers;
    const overflowUsers = hasOverflow
        ? displayUsers.slice(MAX_VISIBLE_AVATARS - 1)
        : [];
    const loggedUserInOverflow =
        loggedUser &&
        hasOverflow &&
        overflowUsers.some((u) => u.email === loggedUser.email);

    return (
        <motion.div
            className={`stacked-pointers${shouldShowHover ? " stacked-pointers--expanded" : ""}`}
            transition={{ duration: 0.2 }}
        >
            {visibleUsers.map((u, index) => (
                <UserPointer
                    key={u.email}
                    currentUserId={user?.profile.sub}
                    user={u}
                    index={index}
                    isLoggedUserPointer={loggedUser?.email === u.email}
                />
            ))}

            {hasOverflow && (
                <OverflowUserPointer
                    users={overflowUsers}
                    index={MAX_VISIBLE_AVATARS - 1}
                />
            )}

            {loggedUserInOverflow && (
                <UserPointer
                    key={`${loggedUser.email}-finish`}
                    currentUserId={user?.profile.sub}
                    user={loggedUser}
                    index={MAX_VISIBLE_AVATARS - 1}
                    hidden
                    isLoggedUserPointer
                />
            )}
        </motion.div>
    );
};
