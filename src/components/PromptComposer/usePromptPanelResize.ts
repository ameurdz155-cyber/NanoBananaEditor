import { useCallback } from 'react';
import { MIN_PANEL_WIDTH, MAX_PANEL_WIDTH } from './constants';

interface UsePromptPanelResizeProps {
  setPromptPanelWidth: (width: number) => void;
  showPromptPanel: boolean;
}

export const usePromptPanelResize = ({
  setPromptPanelWidth,
  showPromptPanel,
}: UsePromptPanelResizeProps) => {
  const handleResizeStart = useCallback(
    (_startX: number) => {
      if (!showPromptPanel) return;

      const clampWidth = (width: number) => Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));

      const updateWidth = (event: MouseEvent | TouchEvent) => {
        const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const newWidth = clampWidth(currentX);
        setPromptPanelWidth(newWidth);
      };

      const stopResize = () => {
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', updateWidth);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', updateWidth);
        document.removeEventListener('touchend', stopResize);
      };

      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', updateWidth);
      document.addEventListener('mouseup', stopResize);
      document.addEventListener('touchmove', updateWidth);
      document.addEventListener('touchend', stopResize);
    },
    [showPromptPanel, setPromptPanelWidth]
  );

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      handleResizeStart(event.clientX);
    },
    [handleResizeStart]
  );

  const handleResizeTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 1) {
        handleResizeStart(event.touches[0].clientX);
      }
    },
    [handleResizeStart]
  );

  return {
    handleResizeMouseDown,
    handleResizeTouchStart,
  };
};
