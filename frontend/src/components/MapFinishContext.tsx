import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { questEngine } from "../domain";

interface FinishCoordinates {
  top: string;
  left: string;
}

interface MapFinishContextValue {
  finishScreenType: string;
  firstFinishScreenShow: boolean;
  finishCoordinates: FinishCoordinates;
  setFinishScreenType: (value: string) => void;
  setLoggedUserTaskNumber: (value: number) => void;
  handleCloseClick: () => void;
  handleFinishAnimationComplete: () => void;
}

const MapFinishContext = createContext<MapFinishContextValue | undefined>(undefined);

export const MapFinishProvider = ({ children }: { children: ReactNode }) => {
  const [finishScreenType, setFinishScreenType] = useState("");
  const [firstFinishScreenShow, setFirstFinishScreenShow] = useState(true);
  const [loggedUserTaskNumber, setLoggedUserTaskNumber] = useState(0);
  const [finishCoordinates, setFinishCoordinates] = useState<FinishCoordinates>({
    top: "",
    left: "",
  });

  const handleFinishAnimationComplete = useCallback(() => {
    setFinishCoordinates({ top: "", left: "" });
  }, []);

  const handleCloseClick = useCallback(() => {
    const coordinates = questEngine.getFinishAnimationCoordinates(
      finishScreenType,
      loggedUserTaskNumber,
    );
    if (coordinates) {
      setFinishCoordinates(coordinates);
    }
    setFinishScreenType("");
    setFirstFinishScreenShow(false);
  }, [finishScreenType, loggedUserTaskNumber]);

  const value = useMemo<MapFinishContextValue>(() => ({
    finishScreenType,
    firstFinishScreenShow,
    finishCoordinates,
    setFinishScreenType,
    setLoggedUserTaskNumber,
    handleCloseClick,
    handleFinishAnimationComplete,
  }), [
    finishScreenType,
    firstFinishScreenShow,
    finishCoordinates,
    handleCloseClick,
    handleFinishAnimationComplete,
  ]);

  return (
    <MapFinishContext.Provider value={value}>{children}</MapFinishContext.Provider>
  );
};

export const useMapFinish = (): MapFinishContextValue => {
  const context = useContext(MapFinishContext);
  if (!context) {
    throw new Error("useMapFinish must be used within MapFinishProvider");
  }
  return context;
};
