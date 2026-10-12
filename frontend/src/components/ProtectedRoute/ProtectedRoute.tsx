import { FC, ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProgressSpinner } from "primereact/progressspinner";
import PathsEnum from "../../router/PathEnum";
import { useAuthContext } from "../../auth/AuthContext";
import { StatusScreen } from "../StatusScreen/StatusScreen";

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isAuthLoading } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (isAuthLoading)
            return;
        if (!isAuthenticated) {
            const currentPath = location.pathname;
            if (currentPath !== PathsEnum.login) {
                navigate(PathsEnum.login + `?returnUrl=${encodeURIComponent(currentPath)}`, { replace: true });
            }
        }
    }, [isAuthenticated, isAuthLoading, navigate, location.pathname]);
    if (isAuthLoading) {
        return (
            <StatusScreen variant="loading" message="Loading…">
                <ProgressSpinner />
            </StatusScreen>
        );
    }
    if (!isAuthenticated) {
        return null;
    }
    return <>{children}</>;
};
