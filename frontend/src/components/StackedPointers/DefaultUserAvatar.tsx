import { FC } from "react";

export const DefaultUserAvatar: FC = () => (
    <div className="stacked-pointers__avatar stacked-pointers__avatar--default" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" fill="#9ca3af" />
            <path
                d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
                fill="#9ca3af"
            />
        </svg>
    </div>
);
