import { motion } from "framer-motion";
import { useUIConfig } from "../../../context/UIConfigContext";
export const Girl = () => {
    const { uiConfig } = useUIConfig();
    if (!uiConfig || !uiConfig.animations?.character || !uiConfig.animations.character.enabled) {
        return null;
    }
    const { character } = uiConfig.animations;
    return (<div>
      <motion.img src={character.shadow} style={{
            position: "absolute",
            left: character.shadowPosition.left,
            top: character.shadowPosition.top,
            height: character.shadowPosition.height,
        }} alt="Shadow" initial={{ scale: character.shadowAnimation.scaleFrom }} animate={{ scale: character.shadowAnimation.scaleTo }} transition={{
            ease: "linear",
            duration: character.shadowAnimation.duration,
            repeat: Infinity,
            repeatType: "reverse",
        }}/>
      <motion.img src={character.image} style={{
            position: "absolute",
            left: character.position.left,
            top: character.position.top,
            height: character.position.height,
        }} alt="Girl" initial={{ translateY: character.animation.translateFrom }} animate={{ translateY: character.animation.translateTo }} transition={{
            ease: "linear",
            duration: character.animation.duration,
            repeat: Infinity,
            repeatType: "reverse",
        }}/>
    </div>);
};
