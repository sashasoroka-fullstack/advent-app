import { FC, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { routes } from "../../router/index";
import PathsEnum from "../../router/PathEnum";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuthContext } from "../../auth/AuthContext";
import { StatusScreen } from "../../components/StatusScreen/StatusScreen";
import styles from "./login.module.css";

interface LoginRedirectState {
    continueUri: string;
    extraQueryParams?: object;
}

export const Login: FC = () => {
    const { isAuthLoading, isAuthenticated, authMode, user, signIn, error } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    const hasInitiatedSignin = useRef(false);
    const returnUrl = new URLSearchParams(location.search).get("returnUrl");
    const userState = user?.state as LoginRedirectState;
    const continueUri = returnUrl !== PathsEnum.login && returnUrl;
    useEffect(() => {
        if (isAuthLoading)
            return;
        if (isAuthenticated) {
            window.history.replaceState({}, document.title, location.pathname);
            const destination = userState?.continueUri || continueUri || routes.quest.path;
            navigate(destination, { replace: true });
        }
        else if (!isAuthenticated && authMode === 'oidc' && !hasInitiatedSignin.current) {
            hasInitiatedSignin.current = true;
            const state: LoginRedirectState = {
                continueUri: continueUri || PathsEnum.quest,
            };
            signIn({ state }).catch((err) => {
                console.error("[Login] Sign in failed:", err);
                hasInitiatedSignin.current = false;
            });
        }
    }, [
        isAuthenticated,
        isAuthLoading,
        authMode,
        navigate,
        signIn,
        userState?.continueUri,
        location.pathname,
        continueUri,
    ]);
    if (isAuthLoading) {
        return (
            <StatusScreen variant="loading" message="Signing in…">
                <ProgressSpinner />
            </StatusScreen>
        );
    }
    if (error) {
        return (
            <StatusScreen
                variant="error"
                title="Authentication error"
                message={error.message}
                action={{
                    label: "Try again",
                    onClick: () => {
                        hasInitiatedSignin.current = false;
                        window.location.reload();
                    },
                }}
            />
        );
    }
    if (authMode === 'dev' && isAuthenticated) {
        return (
            <StatusScreen variant="loading" message="Opening quest…">
                <ProgressSpinner />
            </StatusScreen>
        );
    }
    return (
        <div className={styles.center}>
            <Panel header="Login" className="w-2">
                <div className="flex flex-column align-items-center gap-3 p-3">
                    <Button className="mr-4" label="Log in" type="submit" onClick={() => {
                        hasInitiatedSignin.current = true;
                        const state: LoginRedirectState = {
                            continueUri: continueUri || PathsEnum.quest,
                        };
                        signIn({ state }).catch((err) => {
                            console.error("[Login] Sign in failed:", err);
                            hasInitiatedSignin.current = false;
                        });
                    }}/>
                </div>
            </Panel>
        </div>
    );
};
