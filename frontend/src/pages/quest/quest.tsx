import { useMemo, useState } from "react";
import { GameButton } from "../../components/GameButton/GameButton";
import { SVGMap } from "../../components/Map";
import { QuestConfiguration } from "../../components/QuestConfiguration/QuestConfiguration";
import { UIConfigURLListener } from "../../components/UIConfigURLListener/UIConfigURLListener";
import { StatusScreen, ErrorBanner } from "../../components/StatusScreen/StatusScreen";
import { useUIConfig } from "../../context/UIConfigContext";
import { usersDataMapper } from "../../helpers/userDataMapper";
import { useQuestData } from "../../hooks/useQuestData";
import { useAuthContext } from "../../auth/AuthContext";
import { useHasPrivilegedRole } from "../../hooks/useHasPrivilegedRole";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import styles from "./quest.module.css";

export const Quest = () => {
    const { user } = useAuthContext();
    const hasPrivilegedRole = useHasPrivilegedRole();
    const { error: questError, isLoading: questLoading, selectedQuest } = useApiQuestContext();
    const { jsonData, error: dataError, isLoading: dataLoading } = useQuestData();
    const { uiConfig, isLoading: uiConfigLoading, error: uiConfigError } = useUIConfig();
    const [isGameButtonVisible, setIsGameButtonVisible] = useState(true);
    const userId = user?.profile?.sub;

    const mappedData = useMemo(() => {
        if (!jsonData?.length || !userId || !uiConfig?.steps?.positions?.length || !user?.profile) {
            return [];
        }
        return usersDataMapper(jsonData, user.profile, uiConfig.steps.positions);
    }, [jsonData, userId, uiConfig?.steps?.positions, user?.profile]);

    if (uiConfigError) {
        return (
            <StatusScreen
                variant="error"
                title="UI configuration error"
                message="The UI configuration failed to load. Check files in /ui-configs/."
                details={uiConfigError}
            />
        );
    }
    if (uiConfigLoading || !uiConfig) {
        return <StatusScreen variant="loading" title="Loading" message="Loading UI configuration…" />;
    }
    if (!hasPrivilegedRole && !questLoading && (questError || !selectedQuest)) {
        return (
            <StatusScreen
                variant="error"
                title="Quest unavailable"
                message={questError ?? "The active quest has not been selected yet. Ask an administrator."}
            />
        );
    }

    return (
        <div className={styles.page}>
            <UIConfigURLListener />
            {dataError ? <ErrorBanner message={dataError} /> : null}
            <img
                key={uiConfig.map.background}
                src={uiConfig.map.background}
                className={styles.background}
                alt=""
            />
            {isGameButtonVisible && <GameButton />}
            <SVGMap
                tableData={mappedData}
                loading={dataLoading}
                setIsGameButtonVisible={setIsGameButtonVisible}
            />
            {hasPrivilegedRole && <QuestConfiguration />}
        </div>
    );
};
