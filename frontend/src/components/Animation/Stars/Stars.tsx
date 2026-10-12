import { motion } from "framer-motion";
import { useUIConfig } from "../../../context/UIConfigContext";
import { UIStarConfig } from "../../../services/uiConfigSchema";
import { useMemo } from "react";
export const Stars = () => {
    const { uiConfig } = useUIConfig();
    const stars = uiConfig?.animations?.stars || [];
    const starGroups = useMemo(() => {
        return stars.reduce((groups, star) => {
            const duration = star.duration;
            if (!groups[duration]) {
                groups[duration] = [];
            }
            groups[duration].push(star);
            return groups;
        }, {} as Record<number, UIStarConfig[]>);
    }, [stars]);
    if (!uiConfig?.animations?.stars?.length) {
        return null;
    }
    return (<div>
      {Object.entries(starGroups).map(([duration, starsInGroup]) => (<motion.div key={duration} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{
                ease: "linear",
                duration: parseFloat(duration),
                repeat: Infinity,
                repeatType: "reverse",
            }}>
          {starsInGroup.map((star, index) => (<img key={`${duration}-${index}`} src={star.image} style={{
                    position: "absolute",
                    top: star.top,
                    left: star.left,
                    height: star.height,
                    width: star.width,
                }} alt="Star"/>))}
        </motion.div>))}
    </div>);
};
