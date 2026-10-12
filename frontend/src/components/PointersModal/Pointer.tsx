import { motion } from "framer-motion";
import { FC, useState } from "react";
import { IUserInGroupData } from "../../constants";
import { useUIConfig } from "../../context/UIConfigContext";
import { calcAvatarPositionAndSize } from "../../helpers/calcAvatarSize";
interface IProps {
    user: IUserInGroupData;
    usersCount: number;
    index: number;
}
export const Pointer: FC<IProps> = ({ user, usersCount, index }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const { uiConfig } = useUIConfig();
    const calculateElementSize = () => {
        const maxUsersPerRow = 5;
        const widthPercentage = usersCount <= maxUsersPerRow ? 100 / usersCount : 100 / maxUsersPerRow;
        const heightPercentage = usersCount <= maxUsersPerRow
            ? 100
            : 100 / Math.ceil(usersCount / maxUsersPerRow);
        return { width: `${widthPercentage}%`, height: `${heightPercentage}%` };
    };
    if (!uiConfig) {
        return null;
    }
    const pointerColors = uiConfig.pointers.colors.map(color => color.icons);
    return (<div style={{
            ...calculateElementSize(),
            display: "flex",
            justifyContent: "center",
        }}>
      <motion.img src={user.imageUrl} alt={`${user.name} avatar`} style={{
            position: "absolute",
            ...calcAvatarPositionAndSize(usersCount),
            borderRadius: "100%",
            zIndex: index + 1,
        }} onHoverStart={() => setIsTooltipVisible(true)} onHoverEnd={() => setIsTooltipVisible(false)}/>
      {isTooltipVisible && user.name && (<motion.div transition={{ ease: "linear", duration: 0.5 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0.5 }} style={{
                position: "absolute",
                height: "1%",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "black",
                padding: "1%",
                marginTop: 0,
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                fontFamily: "Roboto",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
            }}>
          {user.name}
        </motion.div>)}
      <img src={pointerColors[user.socialNetworkPoint][index % pointerColors[0].length]} style={{
            width: "100%",
        }}/>
    </div>);
};
