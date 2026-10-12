import { motion } from "framer-motion";
import { useUIConfig } from "../../../context/UIConfigContext";
export const Clouds = () => {
    const { uiConfig } = useUIConfig();
    if (!uiConfig?.animations?.clouds?.length) {
        return null;
    }
    const { clouds } = uiConfig.animations;
    return (<div>
      {clouds.map((cloud, index) => (<motion.img key={index} src={cloud.image} style={{
                position: "absolute",
                top: cloud.top,
                left: cloud.left,
                height: cloud.height,
                width: cloud.width,
            }} alt="Cloud" initial={{ translateX: cloud.translateFrom }} animate={{ translateX: cloud.translateTo }} transition={{
                ease: "linear",
                duration: cloud.duration,
                repeat: Infinity,
                repeatType: "reverse",
            }}/>))}
    </div>);
};
