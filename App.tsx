import React, { useState, useEffect, useMemo } from 'react';
import { Hero } from './components/Hero';
import { CompanyCard } from './components/CompanyCard';
import { AutomationCard } from './components/AutomationCard';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { analyzeCompanyUrl } from './services/geminiService';
import { AppState, AnalysisResult, Language, AutomationIdea, SavedAnalysis, AdminSettings } from './types';
import { AlertCircle, ExternalLink, Save, FileText, Database, Trash2, Clock, Check, Filter } from 'lucide-react';

const DEFAULT_SETTINGS: AdminSettings = {
  roleDefinition: "Technical Automation Architect",
  techFocus: `- **Prioritize n8n** as the main orchestration tool (workflow automation).
    - **Focus on AI Agents** (LLMs acting as workers, not just chatbots).
    - **Use APIs** directly where possible for scalability.
    - Avoid suggesting simple "Zapier" or "Make" zaps unless it's for very basic triggers. Focus on robust, scalable architectures.
    - Suggestions should be practical but aim for professional scalability.`,
  customInstructions: ""
};

const App: React.FC = () => {
  // Default to Spanish ('es')
  const [language, setLanguage] = useState<Language>('es');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // State for the input field
  const [inputUrl, setInputUrl] = useState<string>('');
  // State for the currently analyzed URL (context)
  const [currentUrl, setCurrentUrl] = useState<string>('');
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAutomations, setSavedAutomations] = useState<AutomationIdea[]>([]);
  
  // Database State
  const [analysisHistory, setAnalysisHistory] = useState<SavedAnalysis[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');

  // Admin / Settings State
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);

  // Load saved automations, analysis history, and admin settings from localStorage on mount
  useEffect(() => {
    const savedAuto = localStorage.getItem('autoScout_saved');
    if (savedAuto) {
      try {
        setSavedAutomations(JSON.parse(savedAuto));
      } catch (e) {
        console.error("Failed to parse saved automations", e);
      }
    }

    const savedHistory = localStorage.getItem('autoScout_db');
    if (savedHistory) {
      try {
        setAnalysisHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse analysis history", e);
      }
    }

    const savedSettings = localStorage.getItem('autoScout_settings');
    if (savedSettings) {
      try {
        setAdminSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Compute unique industries for the filter
  const uniqueIndustries = useMemo(() => {
    const industries = analysisHistory.map(item => item.result.profile.industry);
    return Array.from(new Set(industries)).sort();
  }, [analysisHistory]);

  // Compute filtered history
  const filteredHistory = useMemo(() => {
    if (selectedIndustry === 'ALL') return analysisHistory;
    return analysisHistory.filter(item => item.result.profile.industry === selectedIndustry);
  }, [analysisHistory, selectedIndustry]);

  const handleToggleSaveAutomation = (idea: AutomationIdea) => {
    setSavedAutomations(prev => {
      const exists = prev.find(item => item.title === idea.title);
      let newSaved;
      if (exists) {
        // Remove if already saved
        newSaved = prev.filter(item => item.title !== idea.title);
      } else {
        // Add if not saved
        newSaved = [...prev, idea];
      }
      localStorage.setItem('autoScout_saved', JSON.stringify(newSaved));
      return newSaved;
    });
  };

  const handleSaveSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    localStorage.setItem('autoScout_settings', JSON.stringify(newSettings));
  };

  const handleResetSettings = () => {
    setAdminSettings(DEFAULT_SETTINGS);
    localStorage.setItem('autoScout_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  const handleAnalyze = async (url: string) => {
    setAppState(AppState.ANALYZING);
    setCurrentUrl(url);
    setError(null);
    setResult(null);
    setJustSaved(false);

    try {
      // Prepare context from analysis history (Knowledge Base)
      const historyContext = analysisHistory.map(item => {
        return `[Company: ${item.result.profile.name} | Industry: ${item.result.profile.industry} | Automations: ${item.result.automations.map(a => a.title).join(', ')}]`;
      }).join('\n');

      // Pass language, history context AND admin settings to the service
      const data = await analyzeCompanyUrl(url, language, historyContext, adminSettings);
      setResult(data);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while analyzing the website.");
      setAppState(AppState.ERROR);
    }
  };

  // --- Database / Save / Download Logic ---

  const handleSaveAnalysis = () => {
    if (!result) return;

    const newEntry: SavedAnalysis = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      url: currentUrl,
      result: result
    };

    const newHistory = [newEntry, ...analysisHistory];
    setAnalysisHistory(newHistory);
    localStorage.setItem('autoScout_db', JSON.stringify(newHistory));
    
    setJustSaved(true);
    setInputUrl(''); // Clear the input box
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDownloadAnalysis = () => {
    if (!result) return;
    
    const isEs = language === 'es';
    const date = new Date().toLocaleDateString();
    
    // Define labels for the Markdown
    const labels = {
      reportTitle: isEs ? 'Reporte de Automatización IA' : 'AI Automation Report',
      generatedBy: isEs ? 'Generado por AutoScout AI' : 'Generated by AutoScout AI',
      profile: isEs ? 'Perfil de la Empresa' : 'Company Profile',
      industry: isEs ? 'Industria' : 'Industry',
      employees: isEs ? 'Empleados Est.' : 'Est. Employees',
      maturity: isEs ? 'Nivel de Madurez IA' : 'AI Maturity Level',
      challenges: isEs ? 'Desafíos Clave' : 'Key Challenges',
      automations: isEs ? 'Estrategias de Automatización' : 'Automation Strategies',
      impact: isEs ? 'Impacto' : 'Impact',
      difficulty: isEs ? 'Dificultad' : 'Difficulty',
      tools: isEs ? 'Herramientas' : 'Tools',
      steps: isEs ? 'Pasos de Implementación' : 'Implementation Steps',
      rawData: isEs ? 'Datos Completos (JSON & Workflows)' : 'Full Data (JSON & Workflows)'
    };

    // Construct Markdown Content
    let md = `# ${labels.reportTitle}: ${result.profile.name}\n`;
    md += `**URL:** ${currentUrl}\n`;
    md += `**Date:** ${date}\n`;
    md += `_${labels.generatedBy}_\n\n`;

    md += `## ${labels.profile}\n\n`;
    md += `> ${result.profile.summary}\n\n`;
    md += `- **${labels.industry}:** ${result.profile.industry}\n`;
    md += `- **${labels.employees}:** ${result.profile.employeeCountEstimate}\n`;
    md += `- **${labels.maturity}:** ${result.profile.aiMaturityLevel}\n\n`;
    
    md += `### ${labels.challenges}\n`;
    result.profile.keyChallenges.forEach(c => md += `- ${c}\n`);
    md += `\n---\n\n`;

    md += `## ${labels.automations}\n\n`;
    result.automations.forEach((idea, idx) => {
      md += `### ${idx + 1}. ${idea.title}\n`;
      md += `**${labels.impact}:** ${idea.impact} | **${labels.difficulty}:** ${idea.difficulty}\n\n`;
      md += `${idea.description}\n\n`;
      md += `**${labels.tools}:** ${idea.tools.join(', ')}\n\n`;
      md += `**${labels.steps}:**\n`;
      idea.implementationSteps.forEach((step, sIdx) => md += `${sIdx + 1}. ${step}\n`);
      md += `\n`;
    });

    md += `\n---\n\n`;
    md += `## ${labels.rawData}\n`;
    md += `\`\`\`json\n`;
    md += JSON.stringify(result, null, 2);
    md += `\n\`\`\`\n`;

    // Create Blob and download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `${result.profile.name.replace(/\s+/g, '_')}_Analysis.md`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);

    setInputUrl(''); // Clear the input box
  };

  const handleDeleteHistoryItem = (id: string) => {
    const newHistory = analysisHistory.filter(item => item.id !== id);
    setAnalysisHistory(newHistory);
    localStorage.setItem('autoScout_db', JSON.stringify(newHistory));
  };

  const handleLoadHistoryItem = (item: SavedAnalysis) => {
    setResult(item.result);
    setCurrentUrl(item.url);
    setInputUrl(item.url); // Reflect the loaded URL in the input box
    setAppState(AppState.SUCCESS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Translations ---

  const t = {
    recTitle: language === 'es' ? 'Automatizaciones Recomendadas' : 'Recommended Automations',
    recSubtitle: language === 'es' 
      ? `Estrategias personalizadas "low-code" para mejorar la eficiencia de ${result?.profile.name || 'la empresa'}.`
      : `Tailored low-code strategies to improve efficiency for ${result?.profile.name || 'the company'}.`,
    failTitle: language === 'es' ? 'Análisis Fallido' : 'Analysis Failed',
    sources: language === 'es' ? 'Fuentes utilizadas para el análisis' : 'Sources used for analysis',
    btnSave: language === 'es' ? 'Guardar Análisis' : 'Save Analysis',
    btnDownload: language === 'es' ? 'Descargar Reporte (.md)' : 'Download Report (.md)',
    btnSaved: language === 'es' ? '¡Guardado!' : 'Saved!',
    dbTitle: language === 'es' ? 'Historial de Análisis (Base de Conocimiento)' : 'Analysis History (Knowledge Base)',
    dbEmpty: language === 'es' ? 'No hay análisis guardados en la base de datos.' : 'No analyses saved in the database.',
    load: language === 'es' ? 'Cargar' : 'Load',
    filterAll: language === 'es' ? 'Todas las Industrias' : 'All Industries',
    noResults: language === 'es' ? 'No hay resultados para este filtro.' : 'No results for this filter.',
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)}
        settings={adminSettings}
        onSave={handleSaveSettings}
        onReset={handleResetSettings}
        language={language}
      />

      <Hero 
        onAnalyze={handleAnalyze} 
        appState={appState} 
        language={language}
        setLanguage={setLanguage}
        url={inputUrl}
        setUrl={setInputUrl}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full">
        
        {appState === AppState.ERROR && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-red-400 mb-2">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">{t.failTitle}</h3>
            </div>
            <p className="text-red-300/80">{error}</p>
          </div>
        )}

        {appState === AppState.SUCCESS && result && (
          <div className="animate-fade-in-up">
            
            {/* Toolbar for Save/Download */}
            <div className="flex justify-end gap-3 mb-6">
              <button
                onClick={handleDownloadAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                {t.btnDownload}
              </button>
              
              <button
                onClick={handleSaveAnalysis}
                disabled={justSaved}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  justSaved 
                    ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                    : 'bg-blue-600 border-transparent hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                }`}
              >
                {justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {justSaved ? t.btnSaved : t.btnSave}
              </button>
            </div>

            <CompanyCard profile={result.profile} language={language} />

            <div className="my-10">
              <h3 className="text-2xl font-bold text-white mb-2">{t.recTitle}</h3>
              <p className="text-slate-400 mb-6">
                {t.recSubtitle}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.automations.map((idea, index) => {
                  const isSaved = savedAutomations.some(item => item.title === idea.title);
                  return (
                    <AutomationCard 
                      key={index} 
                      idea={idea} 
                      index={index} 
                      language={language}
                      isSaved={isSaved}
                      onToggleSave={() => handleToggleSaveAutomation(idea)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sources Section */}
            {result.sources.length > 0 && (
              <div className="border-t border-slate-800 pt-8 pb-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {t.sources}
                </h4>
                <div className="flex flex-wrap gap-4">
                  {result.sources.map((source, i) => (
                    <a 
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-slate-800 px-3 py-2 rounded-lg border border-slate-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Database / History Section */}
        <div className="mt-16 border-t border-slate-800 pt-10 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">{t.dbTitle}</h2>
            </div>

            {/* Industry Filter Dropdown */}
            {analysisHistory.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="bg-transparent text-slate-300 text-sm outline-none border-none cursor-pointer hover:text-white"
                >
                  <option value="ALL" className="bg-slate-800 text-slate-300">{t.filterAll}</option>
                  {uniqueIndustries.map((ind) => (
                    <option key={ind} value={ind} className="bg-slate-800 text-slate-300">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {analysisHistory.length === 0 ? (
            <div className="text-slate-500 italic text-sm text-center py-8 border border-slate-800 border-dashed rounded-xl">
              {t.dbEmpty}
            </div>
          ) : (
            <>
              {filteredHistory.length === 0 ? (
                <div className="text-slate-500 italic text-sm text-center py-8">
                  {t.noResults}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500/30 transition-all group relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="pr-6">
                           <h4 className="font-semibold text-white truncate">{item.result.profile.name}</h4>
                           <span className="text-xs text-blue-400 block truncate">{item.result.profile.industry}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors p-1 absolute top-3 right-3"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 mt-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </div>
                      <button 
                        onClick={() => handleLoadHistoryItem(item)}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
                      >
                        {t.load}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </main>

      <Footer language={language} onOpenAdmin={() => setShowAdmin(true)} />
    </div>
  );
};

export default App;