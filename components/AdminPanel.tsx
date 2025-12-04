import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Settings } from 'lucide-react';
import { AdminSettings, Language } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onSave: (settings: AdminSettings) => void;
  onReset: () => void;
  language: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave, 
  onReset,
  language 
}) => {
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);

  // Sync local state when settings prop changes or panel opens
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const t = {
    title: language === 'es' ? 'Configuración del Agente' : 'Agent Configuration',
    subtitle: language === 'es' ? 'Personaliza cómo piensa y responde la IA.' : 'Customize how the AI thinks and responds.',
    roleLabel: language === 'es' ? 'Rol del Agente' : 'Agent Role',
    rolePlaceholder: language === 'es' ? 'Ej: Experto en Automatización...' : 'Ex: Automation Expert...',
    techLabel: language === 'es' ? 'Enfoque Tecnológico' : 'Tech Stack Focus',
    techHelp: language === 'es' 
      ? 'Define qué herramientas debe priorizar (n8n, Make, Python, etc.)' 
      : 'Define which tools to prioritize (n8n, Make, Python, etc.)',
    customLabel: language === 'es' ? 'Instrucciones Adicionales' : 'Custom Instructions',
    customPlaceholder: language === 'es' ? 'Ej: Sé muy crítico con los costes...' : 'Ex: Be very critical about costs...',
    save: language === 'es' ? 'Guardar Cambios' : 'Save Changes',
    reset: language === 'es' ? 'Restaurar Por Defecto' : 'Reset to Defaults',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.title}</h2>
              <p className="text-sm text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="admin-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.roleLabel}
              </label>
              <input 
                type="text"
                value={localSettings.roleDefinition}
                onChange={(e) => setLocalSettings({...localSettings, roleDefinition: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={t.rolePlaceholder}
              />
            </div>

            {/* Tech Stack Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  {t.techLabel}
                </label>
                <span className="text-xs text-slate-500">{t.techHelp}</span>
              </div>
              <textarea 
                value={localSettings.techFocus}
                onChange={(e) => setLocalSettings({...localSettings, techFocus: e.target.value})}
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Custom Instructions Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.customLabel}
              </label>
              <textarea 
                value={localSettings.customInstructions}
                onChange={(e) => setLocalSettings({...localSettings, customInstructions: e.target.value})}
                className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder={t.customPlaceholder}
              />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-b-xl">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t.reset}
          </button>
          
          <button
            type="submit"
            form="admin-form"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            {t.save}
          </button>
        </div>

      </div>
    </div>
  );
};