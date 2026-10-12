import { FC } from "react";
import { StatusScreen } from "../StatusScreen/StatusScreen";

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
    title = "No data available",
    message = "There is no quest data to display at the moment. Please check back later.",
    icon = "📭",
}) => (
    <StatusScreen
        layout="overlay"
        variant="info"
        icon={icon}
        title={title}
        message={message}
    />
);
