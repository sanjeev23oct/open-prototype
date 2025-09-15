import React, { useState, useEffect } from 'react';
import { Undo, Redo, RotateCcw, History } from 'lucide-react';
import { useToast } from '../stores/toastStore';

interface UndoRedoManagerProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  className?: string;
}

interface HistoryState {
  id: string;
  timestamp: Date;
  description: string;
  htmlContent: string;
}

export const UndoRedoManager: React.FC<UndoRedoManagerProps> = ({
  iframeRef,
  className = ''
}) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const { success, error } = useToast();

  // Save current state to history
  const saveState = (description: string) => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    const htmlContent = doc.documentElement.outerHTML;

    const newState: HistoryState = {
      id: `state-${Date.now()}`,
      timestamp: new Date(),
      description,
      htmlContent
    };

    // Remove any states after current index (when undoing then making new changes)
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);

    // Limit history to 20 states
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setCurrentIndex(currentIndex + 1);
    }

    setHistory(newHistory);
  };

  // Restore state from history
  const restoreState = (state: HistoryState) => {
    if (!iframeRef.current?.contentDocument) return;

    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(state.htmlContent);
    doc.close();
  };

  // Undo last change
  const undo = () => {
    if (currentIndex <= 0) {
      error('Nothing to undo');
      return;
    }

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    restoreState(history[newIndex]);
    success(`Undone: ${history[currentIndex].description}`);
  };

  // Redo last undone change
  const redo = () => {
    if (currentIndex >= history.length - 1) {
      error('Nothing to redo');
      return;
    }

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    restoreState(history[newIndex]);
    success(`Redone: ${history[newIndex].description}`);
  };

  // Reset to initial state
  const resetToInitial = () => {
    if (history.length === 0) {
      error('No initial state to reset to');
      return;
    }

    setCurrentIndex(0);
    restoreState(history[0]);
    success('Reset to initial state');
  };

  // Jump to specific state
  const jumpToState = (index: number) => {
    if (index < 0 || index >= history.length) return;

    setCurrentIndex(index);
    restoreState(history[index]);
    success(`Jumped to: ${history[index].description}`);
    setShowHistory(false);
  };

  // Auto-save initial state when iframe loads
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    
    const handleLoad = () => {
      // Wait a bit for content to fully load
      setTimeout(() => {
        saveState('Initial state');
      }, 100);
    };

    iframe.addEventListener('load', handleLoad);
    
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <History className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">History</h3>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {history.length} states
          </span>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      {/* Controls */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </button>
            
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4 mr-2" />
              Redo
            </button>
          </div>
          
          <button
            onClick={resetToInitial}
            disabled={history.length === 0}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset to Initial State"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>

        {/* Current State Info */}
        {history.length > 0 && currentIndex >= 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                Current: {history[currentIndex]?.description}
              </div>
              <div className="text-gray-600 text-xs mt-1">
                {history[currentIndex]?.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      {showHistory && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">History Timeline</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((state, index) => (
                <button
                  key={state.id}
                  onClick={() => jumpToState(index)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-100 border-2 border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {state.description}
                      </div>
                      <div className="text-xs text-gray-600">
                        {state.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {index === currentIndex && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          Current
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Info */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Shortcuts:</span>
          <span className="ml-2">Ctrl+Z (Undo)</span>
          <span className="ml-3">Ctrl+Y (Redo)</span>
        </div>
      </div>
    </div>
  );

  // Expose saveState function for external use
  React.useImperativeHandle(React.createRef(), () => ({
    saveState
  }));
};