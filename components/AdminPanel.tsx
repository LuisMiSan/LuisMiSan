
import React, { useState } from 'react';
import type { AppConfig, Example, BusinessAreaConfig } from '../types';
import { SaveIcon } from './icons/SaveIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { SettingsIcon } from './icons/SettingsIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';

interface AdminPanelProps {
    config: AppConfig;
    onConfigChange: (newConfig: AppConfig) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, onConfigChange }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'examples' | 'areas'>('general');
    const [localConfig, setLocalConfig] = useState<AppConfig>(config);

    const handleSave = () => {
        onConfigChange(localConfig);
        alert('Configuración guardada correctamente.');
    };

    const updateField = (field: keyof AppConfig, value: any) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
    };

    const addExample = () => {
        const newEx: Example = { id: `ex-${Date.now()}`, title: 'Nuevo Ejemplo', description: '', area: 'general' };
        updateField('examples', [newEx, ...localConfig.examples]);
    };

    const removeExample = (id: string) => {
        updateField('examples', localConfig.examples.filter(e => e.id !== id));
    };

    const updateExample = (id: string, field: keyof Example, value: string) => {
        updateField('examples', localConfig.examples.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    return (
        <div className="w-full max-w-6xl mt-8 flex flex-col md:flex-row gap-8 slide-in-up">
            {/* Sidebar Tabs */}
            <aside className="w-full md:w-64 flex flex-col gap-2">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'general' ? 'bg-orange-600 text-white shadow-lg' : 'bg-blue-900/40 text-gray-400 hover:bg-blue-900'}`}
                >
                    <SettingsIcon className="h-5 w-5" />
                    <span className="font-medium">General</span>
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-orange-600 text-white shadow-lg' : 'bg-blue-900/40 text-gray-400 hover:bg-blue-900'}`}
                >
                    <SparklesIcon className="h-5 w-5" />
                    <span className="font-medium">IA & Prompts</span>
                </button>
                <button 
                    onClick={() => setActiveTab('examples')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'examples' ? 'bg-orange-600 text-white shadow-lg' : 'bg-blue-900/40 text-gray-400 hover:bg-blue-900'}`}
                >
                    <DatabaseIcon className="h-5 w-5" />
                    <span className="font-medium">Escenarios/Ejemplos</span>
                </button>
                
                <div className="mt-8 pt-8 border-t border-blue-800">
                    <button 
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                    >
                        <SaveIcon className="h-5 w-5" />
                        Guardar Todo
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-grow bg-blue-950/50 rounded-2xl border border-blue-800 p-6 md:p-8 min-h-[500px]">
                {activeTab === 'general' && (
                    <div className="space-y-6 fade-in">
                        <h2 className="text-2xl font-bold text-gray-100 mb-6">Configuración General</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de la Aplicación</label>
                            <input 
                                type="text" 
                                value={localConfig.appName}
                                onChange={(e) => updateField('appName', e.target.value)}
                                className="w-full p-3 bg-blue-900 border border-blue-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Descripción del Formulario</label>
                            <input 
                                type="text" 
                                value={localConfig.appDescription}
                                onChange={(e) => updateField('appDescription', e.target.value)}
                                className="w-full p-3 bg-blue-900 border border-blue-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Texto del Footer (Aviso)</label>
                            <textarea 
                                value={localConfig.footerText}
                                onChange={(e) => updateField('footerText', e.target.value)}
                                className="w-full h-32 p-3 bg-blue-900 border border-blue-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="space-y-6 fade-in">
                        <h2 className="text-2xl font-bold text-gray-100 mb-6">Configuración de Inteligencia Artificial</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Instrucción de Sistema (Consultor Principal)</label>
                            <p className="text-xs text-blue-400 mb-2">Define cómo debe comportarse el análisis avanzado de Gemini.</p>
                            <textarea 
                                value={localConfig.aiSystemInstruction}
                                onChange={(e) => updateField('aiSystemInstruction', e.target.value)}
                                className="w-full h-40 p-3 bg-blue-900 border border-blue-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Instrucción de Sistema (Chat Rápido)</label>
                            <textarea 
                                value={localConfig.chatSystemInstruction}
                                onChange={(e) => updateField('chatSystemInstruction', e.target.value)}
                                className="w-full h-32 p-3 bg-blue-900 border border-blue-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'examples' && (
                    <div className="space-y-6 fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-100">Escenarios de Ejemplo</h2>
                            <button onClick={addExample} className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
                                <PlusIcon className="h-4 w-4" />
                                Añadir Ejemplo
                            </button>
                        </div>
                        
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {localConfig.examples.map((ex) => (
                                <div key={ex.id} className="p-4 bg-blue-900/30 border border-blue-800 rounded-xl relative group">
                                    <button 
                                        onClick={() => removeExample(ex.id)}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2Icon className="h-4 w-4" />
                                    </button>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Título</label>
                                            <input 
                                                type="text" 
                                                value={ex.title} 
                                                onChange={(e) => updateExample(ex.id, 'title', e.target.value)}
                                                className="w-full bg-blue-900/50 border border-blue-700 p-2 rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Área</label>
                                            <select 
                                                value={ex.area}
                                                onChange={(e) => updateExample(ex.id, 'area', e.target.value)}
                                                className="w-full bg-blue-900/50 border border-blue-700 p-2 rounded text-sm"
                                            >
                                                {localConfig.businessAreas.map(ba => (
                                                    <option key={ba.id} value={ba.id}>{ba.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Descripción del Problema</label>
                                        <textarea 
                                            value={ex.description}
                                            onChange={(e) => updateExample(ex.id, 'description', e.target.value)}
                                            className="w-full bg-blue-900/50 border border-blue-700 p-2 rounded text-sm h-20"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
