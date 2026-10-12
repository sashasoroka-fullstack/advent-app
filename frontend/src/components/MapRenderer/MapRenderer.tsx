import { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import styles from "./MapRenderer.module.css";

export interface MapPosition {
    id: string | number;
    cxPointers: number;
    cyPointers: number;
    cxStep: number;
    cyStep: number;
}
export interface MapRendererConfig {
    mapImage: string;
    mapAltText?: string;
    positions: MapPosition[];
    loading?: boolean;
    children?: ReactNode;
    overlayContent?: ReactNode;
    loadingIndicator?: ReactNode;
}
export interface PositionRenderProps {
    position: MapPosition;
    index: number;
}
export interface MapRendererProps extends MapRendererConfig {
    renderAtSteps?: (props: PositionRenderProps) => ReactNode;
    renderAtAvatars?: (props: PositionRenderProps) => ReactNode;
}
export const MapRenderer: FC<MapRendererProps> = ({
    mapImage,
    mapAltText = "Map",
    positions = [],
    loading = false,
    children,
    overlayContent,
    loadingIndicator,
    renderAtSteps,
    renderAtAvatars,
}) => {
    return (
        <div className={styles.root} data-map-canvas="true">
            {overlayContent}
            {loading && (
                <div className={styles.loading}>
                    {loadingIndicator || <div className={styles.loadingFallback}>Loading…</div>}
                </div>
            )}
            <div className={styles.layer}>
                {mapImage && mapImage.trim() !== "" ? (
                    <img
                        src={mapImage}
                        className={`${styles.mapImage} ${loading ? styles.mapImageLoading : ""}`}
                        alt={mapAltText}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                ) : (
                    <div className={styles.placeholder} />
                )}
                {children}
            </div>
            {positions.map((position, index) => (
                <motion.div key={position.id}>
                    {renderAtSteps && renderAtSteps({ position, index })}
                </motion.div>
            ))}
            {positions.map((position, index) => (
                <motion.div key={`avatars-${position.id}`}>
                    {renderAtAvatars && renderAtAvatars({ position, index })}
                </motion.div>
            ))}
        </div>
    );
};
