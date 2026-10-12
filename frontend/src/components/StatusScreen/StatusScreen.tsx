import { FC, ReactNode } from "react";
import styles from "./StatusScreen.module.css";

interface StatusScreenProps {
  title?: string;
  message?: string;
  details?: string;
  icon?: string;
  variant?: "error" | "loading" | "info";
  layout?: "page" | "overlay";
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export const StatusScreen: FC<StatusScreenProps> = ({
  title,
  message,
  details,
  icon,
  variant = "info",
  layout = "page",
  action,
  children,
}) => {
  return (
    <div
      className={`${styles.root} ${layout === "overlay" ? styles.overlay : styles.page}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      {title ? (
        <h1 className={`${styles.title} ${variant === "error" ? styles.titleError : ""}`}>
          {title}
        </h1>
      ) : null}
      {message ? <p className={styles.message}>{message}</p> : null}
      {details ? <pre className={styles.details}>{details}</pre> : null}
      {children}
      {action ? (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
};

export const ErrorBanner: FC<{ message: string }> = ({ message }) => (
  <div className={styles.banner} role="alert">
    {message}
  </div>
);
