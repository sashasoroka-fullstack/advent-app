import React, { createContext, useContext, useState, ReactNode } from "react";
interface StepEditingContextType {
    editingStepIndex: number | null;
    setEditingStepIndex: (index: number | null) => void;
    editingStepPosition: {
        cxStep: number;
        cyStep: number;
    } | null;
    setEditingStepPosition: (position: {
        cxStep: number;
        cyStep: number;
    } | null) => void;
    onStepPositionUpdate: ((index: number, cxStep: number, cyStep: number) => void) | null;
    setOnStepPositionUpdate: (callback: ((index: number, cxStep: number, cyStep: number) => void) | null) => void;
    creatingStep: Partial<{
        taskNumber: number;
        label?: string;
        cxPointers?: number;
        cyPointers?: number;
        cxStep: number;
        cyStep: number;
        icon: string;
        color?: string;
        size?: string;
    }> | null;
    setCreatingStep: (step: Partial<{
        taskNumber: number;
        label?: string;
        cxPointers?: number;
        cyPointers?: number;
        cxStep: number;
        cyStep: number;
        icon: string;
        color?: string;
        size?: string;
    }> | null) => void;
    creatingStepPosition: {
        cxStep: number;
        cyStep: number;
    } | null;
    setCreatingStepPosition: (position: {
        cxStep: number;
        cyStep: number;
    } | null) => void;
}
const StepEditingContext = createContext<StepEditingContextType | undefined>(undefined);
interface StepEditingProviderProps {
    children: ReactNode;
}
export const StepEditingProvider: React.FC<StepEditingProviderProps> = ({ children }) => {
    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
    const [editingStepPosition, setEditingStepPosition] = useState<{
        cxStep: number;
        cyStep: number;
    } | null>(null);
    const [onStepPositionUpdate, setOnStepPositionUpdate] = useState<((index: number, cxStep: number, cyStep: number) => void) | null>(null);
    const [creatingStep, setCreatingStep] = useState<Partial<{
        taskNumber: number;
        label?: string;
        cxPointers?: number;
        cyPointers?: number;
        cxStep: number;
        cyStep: number;
        icon: string;
        color?: string;
        size?: string;
    }> | null>(null);
    const [creatingStepPosition, setCreatingStepPosition] = useState<{
        cxStep: number;
        cyStep: number;
    } | null>(null);
    return (<StepEditingContext.Provider value={{
            editingStepIndex,
            setEditingStepIndex,
            editingStepPosition,
            setEditingStepPosition,
            onStepPositionUpdate,
            setOnStepPositionUpdate,
            creatingStep,
            setCreatingStep,
            creatingStepPosition,
            setCreatingStepPosition,
        }}>
      {children}
    </StepEditingContext.Provider>);
};
export const useStepEditing = (): StepEditingContextType => {
    const context = useContext(StepEditingContext);
    if (context === undefined) {
        throw new Error("useStepEditing must be used within a StepEditingProvider");
    }
    return context;
};
