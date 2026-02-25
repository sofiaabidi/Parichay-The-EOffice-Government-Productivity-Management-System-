import { Globe } from 'lucide-react';
import { Button } from './ui/button';

interface LanguageToggleProps {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
}

export function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1 flex items-center gap-1">
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('en')}
          className={`rounded-full h-8 px-3 ${
            language === 'en'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Globe className="w-3 h-3 mr-1" />
          EN
        </Button>
        <Button
          variant={language === 'hi' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('hi')}
          className={`rounded-full h-8 px-3 ${
            language === 'hi'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Globe className="w-3 h-3 mr-1" />
          हिं
        </Button>
      </div>
    </div>
  );
}
