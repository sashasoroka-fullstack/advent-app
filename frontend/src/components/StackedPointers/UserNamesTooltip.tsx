import { motion } from "framer-motion";
import { FC } from "react";

interface IProps {
    names: string[];
}

export const UserNamesTooltip: FC<IProps> = ({ names }) => {
    return (
        <motion.div
            className="stacked-pointers__names-tooltip"
            transition={{ ease: "easeOut", duration: 0.15 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
        >
            {names.map((name) => (
                <div key={name} className="stacked-pointers__names-tooltip-item">
                    {name}
                </div>
            ))}
        </motion.div>
    );
};
