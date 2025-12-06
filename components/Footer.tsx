import React from 'react';
import { Language } from '../types';
import { Settings } from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onOpenAdmin }) => {
  const text = language === 'es' 
    ? 'Construido con Google Gemini API y React. Esta es una demo experimental de IA.'
    : 'Built with Google Gemini API & React. This is an experimental AI demo.';

  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-500 text-sm text-center md:text-left flex-1">
          {text}
        </p>
        
        <button 
          onClick={onOpenAdmin}
          className="text-slate-600 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-800"
          title={language === 'es' ? "Configuración de Agente" : "Agent Settings"}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
};