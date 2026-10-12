import { FC } from "react";
import { motion } from "framer-motion";
import { useUIConfig } from "../../context/UIConfigContext";
import { finishScreenTypes } from "../../constants";
import styles from "./FinishScreen.module.css";

interface IProps {
    screenType: string;
    handleCloseClick: () => void;
}

export const FinishScreen: FC<IProps> = ({ screenType, handleCloseClick }) => {
    const { uiConfig } = useUIConfig();
    if (!uiConfig) {
        return null;
    }
    const finishScreenImage = screenType === finishScreenTypes.finish
        ? uiConfig.finishScreens.finish
        : uiConfig.finishScreens.dzen;
    return (
        <div className={styles.screen}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
            <motion.button
                type="button"
                className={styles.close}
                aria-label="Close finish screen"
                onClick={handleCloseClick}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                &times;
            </motion.button>
            <motion.img
                src={finishScreenImage}
                className={styles.image}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            />
            </motion.div>
        </div>
    );
};
