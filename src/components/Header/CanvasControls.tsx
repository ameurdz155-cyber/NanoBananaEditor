import React from 'react';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import { ZoomIn, ZoomOut, RotateCcw, Save, Eye, EyeOff, Eraser } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CanvasControlsProps {
  canvasZoom: number;
  canvasImage: string | null;
  selectedTool: string;
  brushSize: number;
  brushStrokesCount: number;
  showMasks: boolean;
  masksLabel: string;
  saveLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onBrushSizeChange: (size: number) => void;
  onClearBrushStrokes: () => void;
  onToggleMasks: () => void;
  onSave: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvasZoom,
  canvasImage,
  selectedTool,
  brushSize,
  brushStrokesCount,
  showMasks,
  masksLabel,
  saveLabel,
  onZoomIn,
  onZoomOut,
  onReset,
  onBrushSizeChange,
  onClearBrushStrokes,
  onToggleMasks,
  onSave,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-400 min-w-[60px] text-center">{Math.round(canvasZoom * 100)}%</span>
      <Button variant="outline" size="sm" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onReset}>
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" />

      {selectedTool === 'mask' && (
        <>
          <div className="flex items-center space-x-2 mr-2">
            <span className="text-xs text-gray-400">Brush:</span>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
              className="w-16 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xs text-gray-400 w-6 text-right">{brushSize}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClearBrushStrokes} disabled={brushStrokesCount === 0}>
            <Eraser className="h-4 w-4" />
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleMasks}
        className={cn(showMasks && 'bg-purple-500/10 border-purple-500/50')}
      >
        {showMasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        <span className="hidden sm:inline ml-2">{masksLabel}</span>
      </Button>

      {canvasImage && (
        <Button variant="secondary" size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{saveLabel}</span>
        </Button>
      )}
    </div>
  );
};
