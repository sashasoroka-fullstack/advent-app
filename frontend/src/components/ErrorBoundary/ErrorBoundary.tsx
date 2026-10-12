import { Component, ReactNode } from "react";
import { logger } from "../../utils/logger";
import { StatusScreen } from "../StatusScreen/StatusScreen";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}
interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error): void {
        logger.error("ErrorBoundary", "React error caught", error);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <StatusScreen
                    variant="error"
                    title="Something went wrong"
                    message="An unexpected error occurred. Refresh the page to try again."
                    details={this.state.error?.stack
                        ? `${this.state.error.message}\n\n${this.state.error.stack}`
                        : this.state.error?.message}
                    action={{
                        label: "Reload",
                        onClick: () => window.location.reload(),
                    }}
                />
            );
        }
        return this.props.children;
    }
}
