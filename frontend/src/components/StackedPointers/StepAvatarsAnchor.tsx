import { FC, ReactNode } from "react";
import { IMapTaskPosition } from "../../constants";
import "./StepAvatarsAnchor.css";

interface IProps {
    group: IMapTaskPosition;
    stepSize: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    children: ReactNode;
}

export const StepAvatarsAnchor: FC<IProps> = ({
    group,
    stepSize,
    onMouseEnter,
    onMouseLeave,
    children,
}) => (
    <div
        className="step-avatars-anchor"
        style={{
            left: `${group.cxStep}%`,
            top: `${group.cyStep}%`,
            width: stepSize,
            height: stepSize,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
        {children}
    </div>
);
