import React from 'react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const text = language === 'es' 
    ? 'Construido con Google Gemini API y React. Esta es una demo experimental de IA.'
    : 'Built with Google Gemini API & React. This is an experimental AI demo.';

  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm">
          {text}
        </p>
      </div>
    </footer>
  );
};