import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./auth/auth-provider.tsx";
import { assertValidConfig } from "./utils/configValidator";
import { logStartupInfo } from "./utils/logger";
import { questConfig } from "./config/quest.config";
import { isDevMode } from "./auth/authConfig";
import { getDataSourceType } from "./services/questDataServiceFactory";
try {
    assertValidConfig(questConfig);
}
catch (error) {
    const root = document.getElementById("root");
    if (root) {
        root.innerHTML = `
      <div class="boot-error">
        <h1>Configuration error</h1>
        <p>The application configuration is invalid and cannot start.</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
        <p>Check <code>src/config/quest.config.ts</code> and fix the errors above.</p>
      </div>
    `;
    }
    throw error;
}
logStartupInfo({
    mode: isDevMode() ? "DEV" : "PROD",
    dataProvider: getDataSourceType() || "None",
    questName: questConfig.name,
    taskCount: questConfig.taskCount,
});
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>);
