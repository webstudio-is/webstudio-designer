import { useEffect } from "react";
import {
  useSelectedElement,
  useHoveredElement,
  useDragState,
} from "./nano-states";
import { useRootInstance } from "~/shared/nano-states";

const eventOptions = {
  passive: true,
};

export const useTrackHoveredElement = () => {
  const [rootInstance] = useRootInstance();
  const [, setHoveredElement] = useHoveredElement();
  const [selectedElement] = useSelectedElement();
  const [dragState] = useDragState();

  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
      const element = event.target;
      if (
        rootInstance === undefined ||
        !(element instanceof HTMLElement) ||
        element.dataset.outlineDisabled ||
        dragState === "dragging"
      ) {
        return;
      }
      setHoveredElement(element);
    };

    const handleMouseOut = () => {
      if (rootInstance === undefined || dragState === "dragging") return;
      setHoveredElement(undefined);
    };

    window.addEventListener("mouseover", handleMouseOver, eventOptions);
    window.addEventListener("mouseout", handleMouseOut, eventOptions);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, [rootInstance, selectedElement, setHoveredElement, dragState]);
};
