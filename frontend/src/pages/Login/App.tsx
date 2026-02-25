import { useState } from 'react';
import { LoginForm } from '../../components/LoginForm';
import { LanguageToggle } from '../../components/LanguageToggle';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const content = {
    en: {
      title: 'PARICHAY LOGIN',
      subtitle: 'Unified Productivity Access Portal',
      ministry: 'Ministry of Jal Shakti',
      footer: 'Government of India',
      secureConnection: 'Secure Connection',
    },
    hi: {
      title: 'परिचय लॉगिन',
      subtitle: 'एकीकृत उत्पादकता पहुंच पोर्टल',
      ministry: 'जल शक्ति मंत्रालय',
      footer: 'भारत सरकार',
      secureConnection: 'सुरक्षित कनेक्शन',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-blue-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0, 0, 0) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Language Toggle */}
      <LanguageToggle language={language} setLanguage={setLanguage} />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Government Logo and Header */}
        <div className="text-center mb-6">
          {/* Logo Placeholder */}
          <div className="mx-auto w-24 h-24 mb-4 bg-gradient-to-br from-orange-500 via-white to-green-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 text-white"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-blue-900 mb-2">{t.title}</h1>
          <p className="text-teal-700 mb-1">{t.subtitle}</p>
          <p className="text-blue-800 text-sm">{t.ministry}</p>
        </div>

        {/* Login Form */}
        <LoginForm language={language} />

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-green-600"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{t.secureConnection}</span>
          </div>
          <p className="text-sm text-gray-600">{t.footer}</p>
          <p className="text-xs text-gray-500 mt-2">© 2024 All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
