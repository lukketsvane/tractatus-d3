import React from 'react';
import { Play, Pause } from 'lucide-react';
import DOMPurify from 'dompurify';

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
}

const ContentWindow: React.FC<ContentWindowProps> = ({
  selectedNode,
  language,
  isPlaying,
  playSelectedNodeAudio,
  setLanguage,
  selectedContent,
}) => {
  if (!selectedNode) return null;

  return (
    <div className="fixed bottom-4 left-4 w-80 h-36 rounded-lg p-4 backdrop-blur-sm bg-black/80 border border-white/20 overflow-y-auto z-40">
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
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
  );
};

export default ContentWindow;

