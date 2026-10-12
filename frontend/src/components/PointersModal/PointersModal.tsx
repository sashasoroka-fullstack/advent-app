import { FC } from "react";
import { IUserInGroupData } from "../../constants";
import { motion } from "framer-motion";
import { Pointer } from "./Pointer";
interface IProps {
    users: IUserInGroupData[];
    setIsModalVisible: (value: boolean) => void;
}
export const PointersModal: FC<IProps> = ({ users, setIsModalVisible }) => {
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };
    return (<motion.div initial="hidden" animate="visible" exit="hidden" variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: { opacity: 1, scale: 1 },
        }} transition={{
            duration: 0.5,
            type: "tween",
        }} style={{
            position: "absolute",
            top: "22%",
            left: 0,
            right: 0,
            margin: "auto",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexWrap: "wrap",
            backgroundColor: "rgba(50,50,50, 0.7)",
            borderRadius: "10px",
            width: "70%",
            height: "60%",
            zIndex: 100,
            padding: "2% 1%",
        }} onHoverEnd={() => {
            setIsModalVisible(false);
        }}>
      <motion.div className="close-screen-btn-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} style={{
            position: "absolute",
            top: "3%",
            right: "5%",
            cursor: "pointer",
            height: "5%",
        }}>
        <motion.div className="close-screen-btn" style={{ fontSize: "300%" }} onClick={handleCloseModal}>
          &times;
        </motion.div>
      </motion.div>
      {users.map((u: IUserInGroupData, index: number) => (<Pointer key={u.email} user={u} usersCount={users.length} index={index}/>))}
    </motion.div>);
};
