import React from 'react';
import { CompanyProfile, Language } from '../types';
import { Building2, Users, Target, Activity } from 'lucide-react';

interface CompanyCardProps {
  profile: CompanyProfile;
  language: Language;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ profile, language }) => {
  const getMaturityColor = (level: string) => {
    // Basic mapping for color, even if text is spanish
    const l = level.toLowerCase();
    if (l.includes('none') || l.includes('ninguno')) return 'text-red-400 bg-red-400/10';
    if (l.includes('beginner') || l.includes('principiante')) return 'text-orange-400 bg-orange-400/10';
    if (l.includes('intermediate') || l.includes('intermedio')) return 'text-blue-400 bg-blue-400/10';
    if (l.includes('advanced') || l.includes('avanzado')) return 'text-emerald-400 bg-emerald-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  const t = {
    unknownSize: language === 'es' ? "Tamaño desconocido" : "Unknown size",
    maturity: language === 'es' ? "Madurez de IA" : "AI Maturity",
    challenges: language === 'es' ? "Desafíos Clave Identificados" : "Key Challenges Identified",
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-lg mb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
          </div>
          <p className="text-slate-400 leading-relaxed mb-4">{profile.summary}</p>
          
          <div className="flex flex-wrap gap-3">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-700/50 border border-slate-600 text-slate-300 text-sm">
                <Target className="w-4 h-4 text-purple-400" />
                {profile.industry}
             </div>
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-700/50 border border-slate-600 text-slate-300 text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                {profile.employeeCountEstimate || t.unknownSize}
             </div>
          </div>
        </div>

        <div className="md:w-80 flex-shrink-0">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" /> {t.maturity}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${getMaturityColor(profile.aiMaturityLevel)}`}>
                {profile.aiMaturityLevel}
              </span>
            </div>
            
            <div className="mt-4">
               <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">{t.challenges}</span>
               <ul className="space-y-2">
                  {profile.keyChallenges.map((challenge, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {challenge}
                    </li>
                  ))}
               </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};