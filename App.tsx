import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ProblemSolver } from './components/ProblemSolver';
import { ChatWidget } from './components/ChatWidget';
import { SolutionDatabase } from './components/SolutionDatabase';
import { PasswordProtection } from './components/PasswordProtection';
import { AdminPanel } from './components/AdminPanel';
import type { SolutionRecord, AppConfig } from './types';
import { seedRecords } from './data/seedData';
import { examples as initialExamples } from './data/examples';

const SOLUTION_DATABASE_KEY = 'business-ai-solver-database';
const AUTH_KEY = 'growthmind-beta-auth';
const CONFIG_KEY = 'growthmind-app-config';

const defaultConfig: AppConfig = {
    appName: "GrowthMind AI",
    appDescription: "Nuestra IA analizará tu situación y te proporcionará posibles soluciones a medida.",
    footerText: "Esta es una versión beta con fines de prueba. No introduzcas datos comerciales críticos o sensibles. Toda la información generada se guarda únicamente en tu navegador.",
    aiSystemInstruction: "Analiza el siguiente problema empresarial. Proporciona un análisis detallado que incluya diagnóstico, impacto y soluciones a corto y largo plazo.",
    chatSystemInstruction: "Eres un asistente de negocios amigable y servicial. Responde preguntas de forma concisa.",
    // Fix: Using initialExamples directly as they now have valid IDs defined in data/examples.ts
    examples: initialExamples,
    businessAreas: [
        { id: 'marketing', label: 'Marketing Digital', group: 'Digital' },
        { id: 'ecommerce', label: 'E-commerce', group: 'Digital' },
        { id: 'social_media', label: 'Redes Sociales', group: 'Digital' },
        { id: 'content', label: 'Contenido y SEO', group: 'Digital' },
        { id: 'ux_ui', label: 'UX/UI', group: 'Digital' },
        { id: 'data_analytics', label: 'Analítica de Datos', group: 'Digital' },
        { id: 'general', label: 'General', group: 'Tradicional' },
        { id: 'sales', label: 'Ventas', group: 'Tradicional' },
        { id: 'logistics', label: 'Logística', group: 'Tradicional' },
        { id: 'hr', label: 'Recursos Humanos', group: 'Tradicional' },
        { id: 'finance', label: 'Finanzas', group: 'Tradicional' },
        { id: 'it', label: 'TI', group: 'Tradicional' },
    ]
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [config, setConfig] = useState<AppConfig>(() => {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved) : defaultConfig;
  });
  
  const [mainDescription, setMainDescription] = useState('');
  const problemSolverRef = useRef<HTMLDivElement>(null);

  const [solutionRecords, setSolutionRecords] = useState<SolutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SOLUTION_DATABASE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) { console.error(error); }
    return seedRecords;
  });

  useEffect(() => {
    localStorage.setItem(SOLUTION_DATABASE_KEY, JSON.stringify(solutionRecords));
  }, [solutionRecords]);

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  const handleSolutionGenerated = (recordData: Omit<SolutionRecord, 'id' | 'timestamp'>) => {
    const newRecord: SolutionRecord = {
      ...recordData,
      id: `sol-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setSolutionRecords(prev => [newRecord, ...prev]);
  };

  const handleDeleteRecord = (recordId: string) => {
    setSolutionRecords(prev => prev.filter(r => r.id !== recordId));
  };
  
  const handleAuthSuccess = () => {
    sessionStorage.setItem(AUTH_KEY, 'true');
    setIsAuthenticated(true);
  }
  
  const handleAnalyzeRequest = (text: string) => {
    setMainDescription(text);
    setIsAdminMode(false);
    setTimeout(() => {
        problemSolverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (!isAuthenticated) return <PasswordProtection onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="min-h-screen flex flex-col fade-in">
      <Header 
        isAdminMode={isAdminMode} 
        onToggleAdmin={() => setIsAdminMode(!isAdminMode)} 
        appName={config.appName}
      />
      
      <main className="flex-grow container mx-auto p-4 flex flex-col items-center">
        {isAdminMode ? (
            <AdminPanel config={config} onConfigChange={setConfig} />
        ) : (
            <>
                <ProblemSolver 
                  ref={problemSolverRef}
                  description={mainDescription}
                  onDescriptionChange={setMainDescription}
                  onSolutionGenerated={handleSolutionGenerated}
                  config={config}
                />
                <SolutionDatabase records={solutionRecords} onDeleteRecord={handleDeleteRecord} />
            </>
        )}
      </main>

      <ChatWidget onAnalyzeRequest={handleAnalyzeRequest} config={config} />
      
      <footer className="text-center p-8 text-blue-400 text-sm max-w-4xl mx-auto">
        <p className="mb-4 opacity-70">
            <strong>Aviso:</strong> {config.footerText}
        </p>
        <p className="font-medium">&copy; {new Date().getFullYear()} {config.appName}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;