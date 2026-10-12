export const POINTER_OFFSET_ABOVE_STEP = 11;

export function calculatePointerPosition(cxStep: number, cyStep: number): {
  cxPointers: number;
  cyPointers: number;
} {
  return {
    cxPointers: cxStep,
    cyPointers: Math.max(0, cyStep - POINTER_OFFSET_ABOVE_STEP),
  };
}
