import React, { useState } from 'react';
import { Search, Sparkles, Globe } from 'lucide-react';
import { AppState, Language } from '../types';

interface HeroProps {
  onAnalyze: (url: string) => void;
  appState: AppState;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Hero: React.FC<HeroProps> = ({ onAnalyze, appState, language, setLanguage }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  const isLoading = appState === AppState.ANALYZING;

  const t = {
    badge: language === 'es' ? 'Consultor de Negocios IA' : 'AI Business Consultant',
    titleStart: language === 'es' ? 'Transforma cualquier web en una' : 'Turn any website into an',
    titleEnd: language === 'es' ? 'Hoja de Ruta de Automatización' : 'Automation Roadmap',
    description: language === 'es' 
      ? 'Pega la URL de una empresa. Analizaremos su modelo de negocio y generaremos una lista personalizada de oportunidades de IA y automatización con herramientas "No-Code".'
      : 'Paste a company URL. We\'ll analyze their business model and generate a custom list of AI & automation opportunities using no-code tools.',
    placeholder: 'https://ejemplo-negocio.com',
    analyzeBtn: language === 'es' ? 'Analizar' : 'Analyze',
    scanning: language === 'es' ? 'Escaneando...' : 'Scanning...',
    free: language === 'es' ? 'Análisis Gratuito' : 'Free Analysis',
    powered: language === 'es' ? 'Potenciado por Gemini' : 'Powered by Gemini',
    live: language === 'es' ? 'Búsqueda en Vivo' : 'Live Web Search',
  };

  return (
    <div className="relative overflow-hidden bg-slate-900 pt-16 pb-12 text-center lg:pt-24 lg:pb-20">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-blue-500 transition-all text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          {language === 'es' ? 'Español' : 'English'}
        </button>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>{t.badge}</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
          {t.titleStart} <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            {t.titleEnd}
          </span>
        </h1>
        
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
          {t.description}
        </p>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
          <div className="relative flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              required
              className="block w-full rounded-l-lg bg-slate-800 border-0 py-4 pl-4 pr-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm sm:leading-6 shadow-xl"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center justify-center rounded-r-lg border border-transparent bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.scanning}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t.analyzeBtn} <Search className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> {t.free}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> {t.powered}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" /> {t.live}
          </span>
        </div>
      </div>
    </div>
  );
};