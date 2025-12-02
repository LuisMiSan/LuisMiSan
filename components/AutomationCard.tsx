import React, { useState } from 'react';
import { AutomationIdea, Language } from '../types';
import { Zap, BarChart, ChevronDown, ChevronUp, Wrench, ArrowRight, Bookmark } from 'lucide-react';

interface AutomationCardProps {
  idea: AutomationIdea;
  index: number;
  language: Language;
  isSaved: boolean;
  onToggleSave: () => void;
}

export const AutomationCard: React.FC<AutomationCardProps> = ({ 
  idea, 
  index, 
  language, 
  isSaved, 
  onToggleSave 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getImpactColor = (impact: string) => {
    // Map both English and Spanish return values
    if (impact.includes('High') || impact.includes('Alto')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (impact.includes('Medium') || impact.includes('Medio')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  const getDifficultyColor = (diff: string) => {
    if (diff.includes('Easy') || diff.includes('Fácil')) return 'text-green-400';
    if (diff.includes('Moderate') || diff.includes('Moderado')) return 'text-yellow-400';
    if (diff.includes('Advanced') || diff.includes('Avanzado')) return 'text-orange-400';
    return 'text-slate-400';
  };

  const t = {
    impact: language === 'es' ? 'Impacto' : 'Impact',
    setup: language === 'es' ? 'Configuración' : 'Setup',
    howTo: language === 'es' ? 'Cómo hacerlo' : 'How to do it',
    showLess: language === 'es' ? 'Mostrar menos' : 'Show Less',
    tools: language === 'es' ? 'Herramientas Recomendadas' : 'Recommended Tools',
    steps: language === 'es' ? 'Pasos de Implementación' : 'Implementation Steps',
    save: language === 'es' ? 'Guardar' : 'Save',
    saved: language === 'es' ? 'Guardado' : 'Saved',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold text-sm">
                {index + 1}
             </div>
             <h3 className="text-lg font-semibold text-white">{idea.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-md border ${getImpactColor(idea.impact)}`}>
              {idea.impact} {t.impact}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all ${
                isSaved 
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30' 
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
              }`}
              title={isSaved ? t.saved : t.save}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? t.saved : t.save}</span>
            </button>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {idea.description}
        </p>

        <div className="flex items-center justify-between text-sm">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-slate-500">
                <BarChart className="w-4 h-4" />
                <span className={getDifficultyColor(idea.difficulty)}>{idea.difficulty} {t.setup}</span>
             </div>
           </div>
           
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
           >
             {isExpanded ? t.showLess : t.howTo}
             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-slate-900/50 px-5 py-4 border-t border-slate-700/50">
          
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Wrench className="w-3 h-3" /> {t.tools}
            </h4>
            <div className="flex flex-wrap gap-2">
              {idea.tools.map((tool, i) => (
                <span key={i} className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div>
             <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> {t.steps}
             </h4>
             <ul className="space-y-2">
               {idea.implementationSteps.map((step, i) => (
                 <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}
    </div>
  );
};