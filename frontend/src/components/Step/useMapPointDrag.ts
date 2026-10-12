import { type MouseEvent as ReactMouseEvent, type RefObject, useCallback, useState } from "react";

export function findMapCanvas(from: HTMLElement | null): HTMLElement | null {
  return (from?.closest("[data-map-canvas]") as HTMLElement | null)
    ?? (document.querySelector("[data-map-canvas]") as HTMLElement | null);
}

export function useMapPointDrag(
  stepRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onMove: (cx: number, cy: number) => void,
): { isDragging: boolean; onMouseDown: (event: ReactMouseEvent) => void } {
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((event: ReactMouseEvent) => {
    if (!enabled) {
      return;
    }
    event.preventDefault();
    const mapCanvas = findMapCanvas(stepRef.current);
    const stepRect = stepRef.current?.getBoundingClientRect();
    if (!mapCanvas || !stepRect) {
      return;
    }
    setIsDragging(true);
    const containerRect = mapCanvas.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const current = mapCanvas.getBoundingClientRect();
      const newCx =
        ((stepRect.left - containerRect.left + (moveEvent.clientX - startX)) / current.width) * 100;
      const newCy =
        ((stepRect.top - containerRect.top + (moveEvent.clientY - startY)) / current.height) * 100;
      onMove(
        Math.max(0, Math.min(100, newCx)),
        Math.max(0, Math.min(100, newCy)),
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.body.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [enabled, onMove, stepRef]);

  return { isDragging, onMouseDown };
}
