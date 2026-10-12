import { FC, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IUserInGroupData } from "../../constants";
import { questConfig } from "../../config";
import { useUIConfig } from "../../context/UIConfigContext";
import { UserTooltip } from "../UserTooltip/UserTooltip";
import { questEngine } from "../../domain";
import { DefaultUserAvatar } from "./DefaultUserAvatar";
import { useMapFinish } from "../MapFinishContext";

interface IProps {
    currentUserId?: string;
    user: IUserInGroupData;
    index: number;
    isLoggedUserPointer: boolean;
    hidden?: boolean;
}

export const UserPointer: FC<IProps> = ({
    currentUserId,
    user,
    index,
    isLoggedUserPointer,
    hidden = false,
}) => {
    const { uiConfig } = useUIConfig();
    const {
        setFinishScreenType,
        finishCoordinates,
        handleFinishAnimationComplete,
        setLoggedUserTaskNumber,
    } = useMapFinish();
    const pointerRef = useRef<HTMLDivElement>(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [hasCompletedFinishAnimation, setHasCompletedFinishAnimation] = useState(false);
    const { taskNumber, name, imageUrl, socialNetworkPoint, id } = user;
    const loggedUser = currentUserId === id;
    const hasActiveFinishCoordinates = Boolean(
        finishCoordinates?.top && finishCoordinates?.left,
    );
    const moveLoggedUserToFinish =
        loggedUser &&
        hasActiveFinishCoordinates &&
        questEngine.isSpecialTask(taskNumber) &&
        !hasCompletedFinishAnimation;

    const handleFinishScreenType = useCallback(() => {
        if (!loggedUser || !id) return;
        const userProgress = {
            taskNumber,
            id,
            email: user.email,
            name,
            socialNetworkPoint,
        };
        const finishConfig = questEngine.getFinishState(userProgress, loggedUser);
        if (finishConfig.shouldShow) {
            setFinishScreenType(finishConfig.type);
            if (finishConfig.taskNumber === questConfig.firstFinishTaskId) {
                setLoggedUserTaskNumber(finishConfig.taskNumber);
            }
        }
    }, [loggedUser, taskNumber, id, name, socialNetworkPoint, user.email, setFinishScreenType, setLoggedUserTaskNumber]);

    useEffect(() => {
        if (!hasActiveFinishCoordinates) {
            setHasCompletedFinishAnimation(false);
        }
    }, [hasActiveFinishCoordinates]);

    useEffect(() => {
        handleFinishScreenType();
    }, [handleFinishScreenType]);

    if (!uiConfig) {
        return null;
    }

    const showNameTooltip =
        !hidden && isTooltipVisible && name && index < uiConfig.pointers.maxVisibleInTooltip;

    const itemClassName = [
        "stacked-pointers__item",
        isLoggedUserPointer ? "stacked-pointers__item--logged-user" : "",
        moveLoggedUserToFinish ? "stacked-pointers__item--finishing" : "",
        hidden && !moveLoggedUserToFinish ? "stacked-pointers__item--hidden" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const avatar = imageUrl ? (
        <img
            src={imageUrl}
            alt={name ? `${name} avatar` : "User avatar"}
            className="stacked-pointers__avatar"
        />
    ) : (
        <DefaultUserAvatar />
    );

    if (moveLoggedUserToFinish) {
        return (
            <motion.div
                ref={pointerRef}
                key={imageUrl}
                className={itemClassName}
                animate={finishCoordinates}
                transition={{
                    duration: 2,
                    ease: "easeInOut",
                }}
                onAnimationComplete={() => {
                    setHasCompletedFinishAnimation(true);
                    handleFinishAnimationComplete();
                }}
                style={{
                    zIndex:
                        loggedUser && questEngine.isSpecialTask(taskNumber)
                            ? index + 101
                            : index + 1,
                }}
                onMouseEnter={hidden ? undefined : () => setIsTooltipVisible(true)}
                onMouseLeave={hidden ? undefined : () => setIsTooltipVisible(false)}
            >
                {showNameTooltip && (
                    <UserTooltip isLoggedUser={loggedUser} name={name} />
                )}
                {avatar}
            </motion.div>
        );
    }

    if (hidden) {
        return (
            <div ref={pointerRef} className={itemClassName} aria-hidden="true" />
        );
    }

    return (
        <div
            ref={pointerRef}
            className={itemClassName}
            style={{
                zIndex:
                    loggedUser && questEngine.isSpecialTask(taskNumber)
                        ? index + 101
                        : index + 1,
            }}
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
        >
            {showNameTooltip && (
                <UserTooltip isLoggedUser={loggedUser} name={name} />
            )}
            {avatar}
        </div>
    );
};
