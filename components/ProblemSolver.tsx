
import React, { useState, forwardRef, useMemo } from 'react';
import type { BusinessArea, AnalysisResult, GroundedAnswer, Example, SolutionRecord, AppConfig } from '../types';
import { analyzeProblemWithThinking, analyzeProblemWithSearch } from '../services/geminiService';
import { SolutionDisplay } from './SolutionDisplay';
import { SparklesIcon } from './icons/SparklesIcon';
import { ExamplePicker } from './ExamplePicker';

interface ProblemSolverProps {
    onSolutionGenerated: (record: Omit<SolutionRecord, 'id' | 'timestamp'>) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
    config: AppConfig;
}

export const ProblemSolver = forwardRef<HTMLDivElement, ProblemSolverProps>(({ onSolutionGenerated, description, onDescriptionChange, config }, ref) => {
    const [area, setArea] = useState<BusinessArea>(config.businessAreas[0]?.id || 'general');
    const [companyType, setCompanyType] = useState('');
    const [niche, setNiche] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [useThinkingMode, setUseThinkingMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | GroundedAnswer | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !companyType.trim() || !niche.trim()) {
            setError('Por favor, completa todos los campos.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let response: AnalysisResult | GroundedAnswer;
            if (useSearch) {
                response = await analyzeProblemWithSearch(description, area);
            } else {
                response = await analyzeProblemWithThinking(description, area, config.aiSystemInstruction);
            }
            setResult(response);
            onSolutionGenerated({ companyType, niche, problemDescription: description, businessArea: area, result: response });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectExample = (example: Example) => {
        onDescriptionChange(example.description);
        setArea(example.area);
    };

    const groupedAreas = useMemo(() => {
        const digital = config.businessAreas.filter(a => a.group === 'Digital');
        const traditional = config.businessAreas.filter(a => a.group === 'Tradicional');
        return { digital, traditional };
    }, [config.businessAreas]);

    return (
        <div ref={ref} className="w-full max-w-4xl p-4 md:p-6 bg-blue-950/70 rounded-2xl border border-blue-800 slide-in-up">
            <ExamplePicker onSelectExample={handleSelectExample} examples={config.examples} />

            <div className="relative my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-blue-800" /></div>
                <div className="relative flex justify-center"><span className="bg-[#0c1434] px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Nueva Consulta</span></div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center text-gray-200">Describe tu problema</h2>
            <p className="text-center text-gray-400 mb-8">{config.appDescription}</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Describe el reto de tu negocio..."
                    className="w-full h-40 p-4 bg-blue-900/50 border border-blue-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-gray-600"
                    disabled={isLoading}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                        placeholder="Tipo de Empresa (ej: Fintech)"
                        className="w-full p-3 bg-blue-900/50 border border-blue-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder="Nicho de Mercado"
                        className="w-full p-3 bg-blue-900/50 border border-blue-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full p-3 bg-blue-900/50 border border-blue-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                        <optgroup label="Áreas Digitales">
                            {groupedAreas.digital.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                        </optgroup>
                        <optgroup label="Áreas de Negocio">
                            {groupedAreas.traditional.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                        </optgroup>
                    </select>

                    <div className="flex bg-blue-900/50 rounded-lg border border-blue-700 p-1">
                        <button type="button" onClick={() => {setUseThinkingMode(true); setUseSearch(false)}} className={`w-1/2 py-2 text-xs rounded-md transition-all ${useThinkingMode ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Consultoría</button>
                        <button type="button" onClick={() => {setUseThinkingMode(false); setUseSearch(true)}} className={`w-1/2 py-2 text-xs rounded-md transition-all ${useSearch ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Web Search</button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.01] shadow-lg disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? "Procesando Análisis..." : <><SparklesIcon className="h-5 w-5"/> Generar Informe IA</>}
                </button>
            </form>

            {error && <div className="mt-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">{error}</div>}
            
            <div className="mt-10">
                <SolutionDisplay result={result} isLoading={isLoading} />
            </div>
        </div>
    );
});
