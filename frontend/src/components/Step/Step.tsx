import { FC, useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useUIConfig } from "../../context/UIConfigContext";
import { IMapTaskPosition, IUserInGroupData } from "../../constants";
import { useAuthContext } from "../../auth/AuthContext";
import { ColoredPlanetIcon } from "../ColoredPlanetIcon";
import { useStepEditing } from "../../context/StepEditingContext";
import { isCircularSVG } from "../../utils/svgUtils";
import { useMapPointDrag } from "./useMapPointDrag";
import styles from "./Step.module.css";

interface IProps {
    group: IMapTaskPosition;
    groupIndex: number;
}

export const Step: FC<IProps> = ({ group, groupIndex }) => {
    const { user } = useAuthContext();
    const { uiConfig } = useUIConfig();
    const { editingStepIndex, editingStepPosition, setEditingStepPosition, onStepPositionUpdate } = useStepEditing();
    const [tempPosition, setTempPosition] = useState<{
        cxStep: number;
        cyStep: number;
    } | null>(null);
    const stepRef = useRef<HTMLDivElement>(null);
    const stepConfigIndex = uiConfig?.steps?.positions?.findIndex((step) => step.taskNumber === group.taskNumber) ?? -1;
    const stepConfig = stepConfigIndex !== -1 && uiConfig?.steps?.positions
        ? uiConfig.steps.positions[stepConfigIndex]
        : null;
    const stepLabel = stepConfig?.label;
    const isEditing = useMemo(() => {
        if (editingStepIndex === null)
            return false;
        if (editingStepIndex < 0)
            return false;
        if (!uiConfig?.steps?.positions || editingStepIndex >= uiConfig.steps.positions.length)
            return false;
        return uiConfig.steps.positions[editingStepIndex]?.taskNumber === group.taskNumber;
    }, [editingStepIndex, uiConfig?.steps?.positions, group.taskNumber]);
    const [isCircularIcon, setIsCircularIcon] = useState<boolean>(false);
    const iconUrl: string = !group.color && stepConfig && 'icon' in stepConfig && typeof stepConfig.icon === 'string' && stepConfig.icon
        ? stepConfig.icon
        : (uiConfig?.steps?.images?.[groupIndex] || "");

    const handleDragMove = useCallback((cxStep: number, cyStep: number) => {
        setTempPosition({ cxStep, cyStep });
        setEditingStepPosition({ cxStep, cyStep });
        if (onStepPositionUpdate && stepConfigIndex !== -1) {
            onStepPositionUpdate(stepConfigIndex, cxStep, cyStep);
        }
    }, [onStepPositionUpdate, setEditingStepPosition, stepConfigIndex]);

    const { isDragging, onMouseDown } = useMapPointDrag(stepRef, isEditing, handleDragMove);

    useEffect(() => {
        if (!group.color && iconUrl && iconUrl.trim() !== "") {
            isCircularSVG(iconUrl).then(setIsCircularIcon).catch(() => setIsCircularIcon(false));
        }
        else {
            setIsCircularIcon(false);
        }
    }, [group.color, iconUrl, groupIndex]);

    useEffect(() => {
        if (isEditing && !isDragging && !tempPosition && !editingStepPosition) {
            setEditingStepPosition({ cxStep: group.cxStep, cyStep: group.cyStep });
        }
    }, [isEditing, group.cxStep, group.cyStep, isDragging, tempPosition, editingStepPosition, setEditingStepPosition]);

    useEffect(() => {
        if (!isEditing) {
            setTempPosition(null);
        }
    }, [isEditing]);

    if (!uiConfig) {
        return null;
    }

    const stepShadow = groupIndex < uiConfig.steps.shadow.greenThreshold
        ? uiConfig.steps.shadow.green
        : uiConfig.steps.shadow.purple;
    const currentUserAtPosition = user?.profile?.sub && group.users
        ? group.users.find((u: IUserInGroupData) => u.id === user.profile.sub)
        : undefined;
    const stepSize = stepConfig?.size || group.size || "7%";
    const shouldUseEditingPosition = isEditing && editingStepPosition &&
        (Math.abs(editingStepPosition.cxStep - group.cxStep) > 0.1 ||
            Math.abs(editingStepPosition.cyStep - group.cyStep) > 0.1);
    const currentCxStep = shouldUseEditingPosition
        ? (tempPosition?.cxStep ?? editingStepPosition?.cxStep ?? group.cxStep)
        : group.cxStep;
    const currentCyStep = shouldUseEditingPosition
        ? (tempPosition?.cyStep ?? editingStepPosition?.cyStep ?? group.cyStep)
        : group.cyStep;

    const ariaLabel = stepLabel
        ? `Step ${group.taskNumber}: ${stepLabel}`
        : `Step ${group.taskNumber}`;

    const editingFilter = {
        filter: [
            "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))",
            "drop-shadow(0 0 15px rgba(255, 255, 255, 1)) drop-shadow(0 0 30px rgba(255, 255, 255, 0.9))",
            "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))",
        ],
    };
    const idleFilter = { filter: "none" };
    const editingTransition = { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const };
    const idleTransition = { duration: 0.1, repeat: 0 };

    return (
        <motion.div
            ref={stepRef}
            className={styles.marker}
            aria-label={ariaLabel}
            style={{
                left: `${currentCxStep}%`,
                top: `${currentCyStep}%`,
                height: stepSize,
                width: stepSize,
                cursor: isDragging ? "grabbing" : isEditing ? "grab" : "pointer",
                zIndex: isEditing ? 1000 : 1,
            }}
            whileHover={!isEditing ? { scale: 1.1, transition: { duration: 0.5, type: "linear" } } : {}}
            onMouseDown={onMouseDown}
        >
            {group.color ? (
                <motion.div
                    animate={isEditing ? editingFilter : idleFilter}
                    transition={isEditing ? editingTransition : idleTransition}
                >
                    <ColoredPlanetIcon
                        taskNumber={group.taskNumber}
                        label={stepLabel}
                        color={group.color}
                        size="100%"
                        style={{ height: "100%", width: "100%" }}
                    />
                </motion.div>
            ) : (
                <motion.div className={styles.iconWrap}>
                    <motion.img
                        src={iconUrl}
                        alt=""
                        animate={isEditing ? editingFilter : idleFilter}
                        transition={isEditing ? editingTransition : idleTransition}
                        className={styles.icon}
                        style={{ borderRadius: isCircularIcon ? "50%" : "0%" }}
                    />
                    {stepLabel && stepLabel.trim() !== "" && (
                        <div className={styles.label}>{stepLabel}</div>
                    )}
                </motion.div>
            )}
            {groupIndex !== 0 && currentUserAtPosition && (
                <>
                    <motion.img
                        src={stepShadow}
                        className={styles.shadowInner}
                        alt=""
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            ease: "linear",
                            duration: 3,
                            delay: 1,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                    />
                    <motion.img
                        src={stepShadow}
                        className={styles.shadowOuter}
                        alt=""
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            ease: "linear",
                            duration: 2,
                            delay: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                    />
                </>
            )}
        </motion.div>
    );
};
