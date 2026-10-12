import { motion } from "framer-motion";
import { FC } from "react";

interface IProps {
    name: string;
    isLoggedUser: boolean;
}

export const UserTooltip: FC<IProps> = ({ name, isLoggedUser }) => {
    return (
        <motion.div
            transition={{ ease: "easeOut", duration: 0.15 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                fontFamily: "Inter, Roboto, system-ui, sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                zIndex: isLoggedUser ? 102 : 50,
                pointerEvents: "none",
            }}
        >
            {name}
        </motion.div>
    );
};
