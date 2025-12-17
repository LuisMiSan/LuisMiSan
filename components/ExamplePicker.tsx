
import React from 'react';
import type { Example } from '../types';

interface ExamplePickerProps {
    onSelectExample: (example: Example) => void;
    examples: Example[];
}

export const ExamplePicker: React.FC<ExamplePickerProps> = ({ onSelectExample, examples }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-200 mb-2">Comienza con un Ejemplo</h2>
            <p className="text-center text-gray-400 mb-8 text-sm">¿No sabes por dónde empezar? Selecciona uno de estos escenarios personalizados.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {examples.map((example) => (
                    <button
                        key={example.id}
                        onClick={() => onSelectExample(example)}
                        className="text-left p-5 bg-blue-900/30 border border-blue-800 rounded-xl hover:bg-blue-900/60 hover:border-orange-500/50 transition-all duration-300 transform hover:-translate-y-1 group"
                    >
                        <h3 className="font-bold text-gray-100 group-hover:text-orange-400 transition-colors mb-2">{example.title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{example.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
