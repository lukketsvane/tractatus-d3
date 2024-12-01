import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Resizable } from 'react-resizable';
import Draggable from 'react-draggable';

interface ContentWindowProps {
  selectedNode: {
    data: {
      key: string;
      content?: {
        [key: string]: string;
      };
    };
  } | null;
  language: 'en' | 'de';
  isPlaying: boolean;
  playSelectedNodeAudio: () => void;
  setLanguage: (lang: 'en' | 'de') => void;
  selectedContent: string;
  className?: string;
}

const ContentWindow: React.FC<ContentWindowProps> = ({
  selectedNode,
  language,
  isPlaying,
  playSelectedNodeAudio,
  setLanguage,
  selectedContent,
  className,
}) => {
  const [size, setSize] = useState({ width: 320, height: 200 });

  if (!selectedNode) return null;

  const onResize = (event: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    setSize({ width: size.width, height: size.height });
  };

  return (
    <Draggable handle=".handle" bounds="parent">
      <Resizable height={size.height} width={size.width} onResize={onResize}>
        <div 
          className={`fixed bottom-4 left-4 rounded-lg p-4 backdrop-blur-sm bg-black/80 border border-white/20 overflow-hidden z-40 ${className}`}
          style={{ width: `${size.width}px`, height: `${size.height}px` }}
        >
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 handle cursor-move">
              <h3 className="text-lg font-bold">{selectedNode.data.key}</h3>
              <div className="flex space-x-2 items-center">
                <button
                  onClick={playSelectedNodeAudio}
                  className="focus:outline-none mr-2"
                  disabled={!selectedNode || isPlaying}
                >
                  {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`${language === 'en' ? 'opacity-100' : 'opacity-50'} focus:outline-none`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('de')}
                  className={`${language === 'de' ? 'opacity-100' : 'opacity-50'} focus:outline-none`}
                >
                  DE
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto">
              <p className="text-sm">
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedContent) }} />
              </p>
            </div>
          </div>
        </div>
      </Resizable>
    </Draggable>
  );
};

export default ContentWindow;
