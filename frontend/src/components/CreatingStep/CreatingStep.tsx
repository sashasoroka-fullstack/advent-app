import { FC, useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useUIConfig } from "../../context/UIConfigContext";
import { ColoredPlanetIcon } from "../ColoredPlanetIcon";
import { useStepEditing } from "../../context/StepEditingContext";
import { isCircularSVG } from "../../utils/svgUtils";
import { useMapPointDrag } from "../Step/useMapPointDrag";
import styles from "../Step/Step.module.css";

interface IProps {
    step: {
        taskNumber: number;
        label?: string;
        cxPointers: number;
        cyPointers: number;
        cxStep: number;
        cyStep: number;
        icon: string;
        color?: string;
        size?: string;
    };
}

export const CreatingStep: FC<IProps> = ({ step }) => {
    const { uiConfig } = useUIConfig();
    const { creatingStepPosition, setCreatingStepPosition } = useStepEditing();
    const [tempPosition, setTempPosition] = useState<{
        cxStep: number;
        cyStep: number;
    } | null>(null);
    const stepRef = useRef<HTMLDivElement>(null);
    const [isCircularIcon, setIsCircularIcon] = useState<boolean>(false);

    const handleDragMove = useCallback((cxStep: number, cyStep: number) => {
        setTempPosition({ cxStep, cyStep });
        setCreatingStepPosition({ cxStep, cyStep });
    }, [setCreatingStepPosition]);

    const { isDragging, onMouseDown } = useMapPointDrag(stepRef, true, handleDragMove);

    useEffect(() => {
        if (!creatingStepPosition) {
            setCreatingStepPosition({ cxStep: step.cxStep, cyStep: step.cyStep });
        }
    }, []);

    useEffect(() => {
        if (!isDragging && tempPosition) {
            setTempPosition(null);
        }
    }, [isDragging, tempPosition]);

    useEffect(() => {
        if (!step.color && step.icon) {
            isCircularSVG(step.icon).then(setIsCircularIcon).catch(() => setIsCircularIcon(false));
        }
        else {
            setIsCircularIcon(false);
        }
    }, [step.color, step.icon]);

    if (!uiConfig) {
        return null;
    }

    const stepSize = step.size || "5%";
    const currentCxStep = tempPosition?.cxStep ?? creatingStepPosition?.cxStep ?? step.cxStep;
    const currentCyStep = tempPosition?.cyStep ?? creatingStepPosition?.cyStep ?? step.cyStep;
    const editingFilter = {
        filter: [
            "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))",
            "drop-shadow(0 0 15px rgba(255, 255, 255, 1)) drop-shadow(0 0 30px rgba(255, 255, 255, 0.9))",
            "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))",
        ],
    };

    return (
        <motion.div
            ref={stepRef}
            className={styles.marker}
            aria-label={step.label ? `New step ${step.taskNumber}: ${step.label}` : `New step ${step.taskNumber}`}
            style={{
                left: `${currentCxStep}%`,
                top: `${currentCyStep}%`,
                height: stepSize,
                width: stepSize,
                cursor: isDragging ? "grabbing" : "grab",
                zIndex: 1000,
            }}
            onMouseDown={onMouseDown}
        >
            {step.color ? (
                <motion.div
                    animate={editingFilter}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ColoredPlanetIcon
                        taskNumber={step.taskNumber}
                        label={step.label}
                        color={step.color}
                        size="100%"
                        style={{ height: "100%", width: "100%" }}
                    />
                </motion.div>
            ) : (
                <motion.div className={styles.iconWrap}>
                    <motion.img
                        src={step.icon}
                        alt=""
                        animate={editingFilter}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className={styles.icon}
                        style={{ borderRadius: isCircularIcon ? "50%" : "0%" }}
                    />
                    {step.label && <div className={styles.label}>{step.label}</div>}
                </motion.div>
            )}
        </motion.div>
    );
};
