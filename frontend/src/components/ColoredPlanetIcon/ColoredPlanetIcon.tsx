import React, { useMemo } from "react";
interface ColoredPlanetIconProps {
    taskNumber: number;
    label?: string;
    color?: string;
    size?: string;
    style?: React.CSSProperties;
}
const hexToRgb = (hex: string): {
    r: number;
    g: number;
    b: number;
} | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
};
const lightenColor = (hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent));
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};
const darkenColor = (hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    const r = Math.max(0, Math.round(rgb.r * (1 - percent)));
    const g = Math.max(0, Math.round(rgb.g * (1 - percent)));
    const b = Math.max(0, Math.round(rgb.b * (1 - percent)));
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};
const isLightColor = (hex: string): boolean => {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return false;
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
};
export const ColoredPlanetIcon: React.FC<ColoredPlanetIconProps> = ({ taskNumber, label, color = "#6366F1", size = "100%", style = {}, }) => {
    const svgContent = useMemo(() => {
        const lightColor = lightenColor(color, 0.3);
        const darkColor = darkenColor(color, 0.2);
        const strokeColor = darkenColor(color, 0.4);
        const craterColor = lightenColor(color, 0.15);
        const textColor = isLightColor(color) ? "#2b2b2b" : "#ffffff";
        const gradientId = `planetGrad-${taskNumber}-${color.replace("#", "")}`;
        return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: size, height: size, ...style }}>
        <defs>
          <radialGradient id={gradientId}>
            <stop offset="0%" style={{ stopColor: lightColor, stopOpacity: 1 }}/>
            <stop offset="100%" style={{ stopColor: darkColor, stopOpacity: 1 }}/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill={`url(#${gradientId})`} stroke={strokeColor} strokeWidth="2"/>
        <circle cx="32" cy="38" r="9" fill={craterColor} opacity="0.6"/>
        <circle cx="64" cy="54" r="7" fill={craterColor} opacity="0.5"/>
        <circle cx="48" cy="62" r="5" fill={craterColor} opacity="0.4"/>
        <circle cx="55" cy="35" r="4" fill="#ffffff" opacity="0.3"/>
        <text x="50" y="58" fontSize="32" fontWeight="bold" fill={textColor} textAnchor="middle" fontFamily="Arial, sans-serif">
          {label || taskNumber}
        </text>
      </svg>);
    }, [taskNumber, label, color, size, style]);
    return <div style={{ display: "inline-block", lineHeight: 0 }}>{svgContent}</div>;
};
