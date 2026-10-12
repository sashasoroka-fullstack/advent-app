import { FC, useEffect, useRef, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { IMapTaskPosition, tasksEnum } from "../constants";
import { FinishScreen } from "./FinishScreen/FinishScreen";
import { useUIConfig } from "../context/UIConfigContext";
import { Stars } from "./Animation/Stars/Stars";
import { Clouds } from "./Animation/Clouds/Clouds";
import { Girl } from "./Animation/Girl/Girl";
import { PointersModal } from "./PointersModal/PointersModal";
import { Step } from "./Step/Step";
import { StackedPointers } from "./StackedPointers/StackedPointers";
import { StepAvatarsAnchor } from "./StackedPointers/StepAvatarsAnchor";
import { MapRenderer, MapPosition } from "./MapRenderer";
import { EmptyState } from "./EmptyState/EmptyState";
import { CreatingStep } from "./CreatingStep/CreatingStep";
import { useStepEditing } from "../context/StepEditingContext";
import { MapFinishProvider, useMapFinish } from "./MapFinishContext";
import { calculatePointerPosition } from "../helpers/pointerPosition";
import styles from "./Map.module.css";

function getStepSize(group: IMapTaskPosition, stepPositions?: Array<{ taskNumber: number; size?: string }>): string {
    const stepConfig = stepPositions?.find((step) => step.taskNumber === group.taskNumber);
    return stepConfig?.size || group.size || "7%";
}

interface IProps {
    tableData?: IMapTaskPosition[];
    loading?: boolean;
    setIsGameButtonVisible: (value: boolean) => void;
}

export const SVGMap: FC<IProps> = (props) => (
    <MapFinishProvider>
        <SVGMapInner {...props} />
    </MapFinishProvider>
);

const SVGMapInner: FC<IProps> = ({ tableData, loading = false, setIsGameButtonVisible }) => {
    const { uiConfig } = useUIConfig();
    const { creatingStep, creatingStepPosition } = useStepEditing();
    const {
        finishScreenType,
        firstFinishScreenShow,
        handleCloseClick,
    } = useMapFinish();
    const myRef = useRef<HTMLDivElement>(null);
    const [isHover, setIsHover] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [hoverIndex, setHoverIndex] = useState(0);

    const handleOpenModal = () => {
        setIsModalVisible(true);
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const mapIsIntersecting = entries[0].isIntersecting && entries.length === 1;
            setIsGameButtonVisible(!mapIsIntersecting);
        });
        if (myRef.current) {
            observer.observe(myRef.current);
        }
        return () => observer.disconnect();
    }, [setIsGameButtonVisible]);

    const hasUserData = Boolean(tableData && tableData.length > 0);
    const positions: MapPosition[] = hasUserData
        ? tableData!.map((group) => {
            const { cxPointers, cyPointers } = calculatePointerPosition(group.cxStep, group.cyStep);
            return {
                id: `${group.taskNumber}`,
                cxPointers,
                cyPointers,
                cxStep: group.cxStep,
                cyStep: group.cyStep,
            };
        })
        : (uiConfig?.steps?.positions || []).map((step) => {
            const { cxPointers, cyPointers } = calculatePointerPosition(step.cxStep, step.cyStep);
            return {
                id: `${step.taskNumber}`,
                cxPointers,
                cyPointers,
                cxStep: step.cxStep,
                cyStep: step.cyStep,
            };
        });

    if (!uiConfig) {
        return null;
    }

    const hasStepsConfigured = uiConfig.steps?.positions && uiConfig.steps.positions.length > 0;
    const hasMapImage = uiConfig.map?.mapSvg && uiConfig.map.mapSvg.trim() !== "";
    const showEmptyState = !loading && (!tableData || tableData.length === 0) && !hasStepsConfigured && !hasMapImage;

    return (
        <>
            <div id="quest-map" ref={myRef} className={styles.anchor} />
            {showEmptyState ? (
                <EmptyState
                    title="No quest data"
                    message="No quest progress is available. Check the data source or try refreshing the page."
                />
            ) : (
                <MapRenderer
                    key={uiConfig.map.mapSvg}
                    mapImage={uiConfig.map.mapSvg}
                    mapAltText="Quest map showing wellness journey progress"
                    positions={positions}
                    loading={loading}
                    loadingIndicator={
                        <ProgressSpinner className={styles.loadingSpinner} strokeWidth="4" />
                    }
                    overlayContent={
                        finishScreenType && firstFinishScreenShow ? (
                            <FinishScreen screenType={finishScreenType} handleCloseClick={handleCloseClick} />
                        ) : undefined
                    }
                    renderAtSteps={({ index }) => {
                        if (hasUserData) {
                            const group = tableData![index];
                            if (!group) {
                                return null;
                            }
                            const opensModal = Boolean(
                                group.users && group.users.length > uiConfig.pointers.maxBeforeModal,
                            );
                            const hoverHandlers = {
                                onMouseEnter: () => {
                                    setIsHover(true);
                                    setHoverIndex(index);
                                },
                                onMouseLeave: () => {
                                    setIsHover(false);
                                    setHoverIndex(0);
                                },
                            };
                            const stepBody = (
                                <>
                                    {hoverIndex === index &&
                                        isModalVisible &&
                                        group.users.length > uiConfig.pointers.maxBeforeModal && (
                                            <PointersModal users={group.users} setIsModalVisible={setIsModalVisible} />
                                        )}
                                    <Step group={group} groupIndex={index} />
                                </>
                            );
                            if (opensModal) {
                                return (
                                    <button
                                        type="button"
                                        key={`step_${group.taskNumber}_${index}`}
                                        className={styles.stepHitButton}
                                        aria-label={`Show all users at step ${group.taskNumber}`}
                                        onClick={handleOpenModal}
                                        {...hoverHandlers}
                                    >
                                        {stepBody}
                                    </button>
                                );
                            }
                            return (
                                <div
                                    key={`step_${group.taskNumber}_${index}`}
                                    className={styles.stepHit}
                                    {...hoverHandlers}
                                >
                                    {stepBody}
                                </div>
                            );
                        }
                        const stepConfig = uiConfig?.steps?.positions?.[index];
                        if (!stepConfig) {
                            return null;
                        }
                        const { cxPointers, cyPointers } = calculatePointerPosition(stepConfig.cxStep, stepConfig.cyStep);
                        const minimalGroup: IMapTaskPosition = {
                            taskTitle: tasksEnum.initialPosition,
                            taskNumber: stepConfig.taskNumber,
                            cxPointers,
                            cyPointers,
                            cxStep: stepConfig.cxStep,
                            cyStep: stepConfig.cyStep,
                            users: [],
                            color: stepConfig.color,
                            size: stepConfig.size,
                        };
                        return (
                            <div key={`step_${stepConfig.taskNumber}_${index}`}>
                                <Step group={minimalGroup} groupIndex={index} />
                            </div>
                        );
                    }}
                    renderAtAvatars={({ index }) => {
                        if (!hasUserData) {
                            return null;
                        }
                        const group = tableData![index];
                        if (!group?.users?.length) {
                            return null;
                        }
                        const stepSize = getStepSize(group, uiConfig.steps?.positions);
                        return (
                            <StepAvatarsAnchor
                                group={group}
                                stepSize={stepSize}
                                onMouseEnter={() => {
                                    setIsHover(true);
                                    setHoverIndex(index);
                                }}
                                onMouseLeave={() => {
                                    setIsHover(false);
                                    setHoverIndex(0);
                                }}
                            >
                                <StackedPointers
                                    group={group}
                                    groupIndex={index}
                                    hoverIndex={hoverIndex}
                                    isHover={isHover}
                                />
                            </StepAvatarsAnchor>
                        );
                    }}
                >
                    <Stars />
                    <Clouds />
                    <Girl />
                    {creatingStep && creatingStepPosition && (() => {
                        const { cxPointers, cyPointers } = calculatePointerPosition(
                            creatingStepPosition.cxStep,
                            creatingStepPosition.cyStep,
                        );
                        return (
                            <CreatingStep
                                step={{
                                    taskNumber: creatingStep.taskNumber || 0,
                                    label: creatingStep.label,
                                    cxPointers,
                                    cyPointers,
                                    cxStep: creatingStepPosition.cxStep,
                                    cyStep: creatingStepPosition.cyStep,
                                    icon: creatingStep.icon || "/assets/icons/planet-base.svg",
                                    color: creatingStep.color,
                                    size: creatingStep.size || "5%",
                                }}
                            />
                        );
                    })()}
                </MapRenderer>
            )}
        </>
    );
};
