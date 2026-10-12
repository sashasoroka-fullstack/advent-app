import { FC, useState } from "react";
import { IUserInGroupData } from "../../constants";
import { DefaultUserAvatar } from "./DefaultUserAvatar";
import { UserNamesTooltip } from "./UserNamesTooltip";

interface IProps {
    users: IUserInGroupData[];
    index: number;
}

export const OverflowUserPointer: FC<IProps> = ({ users, index }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const names = users.map((u) => u.name).filter(Boolean);

    return (
        <div
            className="stacked-pointers__item stacked-pointers__item--overflow"
            style={{ zIndex: index + 1 }}
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
        >
            {isTooltipVisible && names.length > 0 && (
                <UserNamesTooltip names={names} />
            )}
            <DefaultUserAvatar />
        </div>
    );
};
