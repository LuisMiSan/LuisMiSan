import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Chat, Content, LiveServerMessage, Blob } from '@google/genai';
import { startChat, connectToLiveSession } from '../services/geminiService';
import type { ChatMessage, AppConfig } from '../types';
import { BotIcon } from './icons/BotIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';
import { encode, LiveAudioUtils } from '../utils/audioUtils';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

const CHAT_HISTORY_KEY = 'business-ai-solver-chat-history';

interface ChatWidgetProps {
    onAnalyzeRequest: (text: string) => void;
    config: AppConfig;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onAnalyzeRequest, config }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem(CHAT_HISTORY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (error) { console.error(error); }
        return [{ role: 'model', content: '¡Hola! Soy tu asistente de negocios personalizado. ¿En qué puedo ayudarte?' }];
    });
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Fix: Using 'any' for the promise type to avoid incorrect LiveSession import from @google/genai
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const currentInputTranscriptionRef = useRef<string>('');
    const currentOutputTranscriptionRef = useRef<string>('');

    useEffect(() => {
        if (isOpen && !chatRef.current) {
            const history: Content[] = messages
                .filter(m => m.role !== 'model' || m.content !== messages[0].content)
                .map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
            chatRef.current = startChat(history, config.chatSystemInstruction);
        }
    }, [isOpen, messages, config.chatSystemInstruction]);

    useEffect(() => {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const cleanupVoice = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try { (await sessionPromiseRef.current).close(); } catch (e) {}
        }
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();

        sessionPromiseRef.current = null;
        setIsVoiceMode(false);
        setIsListening(false);
        setIsSpeaking(false);
    }, []);

    const handleAnalyze = useCallback((content: string) => {
        onAnalyzeRequest(content);
        setIsOpen(false);
        cleanupVoice();
    }, [onAnalyzeRequest, cleanupVoice]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        if (chatRef.current) {
            try {
                const result = await chatRef.current.sendMessage(userMessage.content);
                setMessages(prev => [...prev, { role: 'model', content: result.text }]);
            } catch (error) {
                setMessages(prev => [...prev, { role: 'model', content: 'Lo siento, ocurrió un error.' }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleToggleVoiceMode = async () => {
        if (isVoiceMode) {
            await cleanupVoice();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;
                setIsVoiceMode(true);
                setIsListening(true);
                inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
                outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

                sessionPromiseRef.current = connectToLiveSession({
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            const input = e.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(input.length);
                            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
                            // Fix: Correct way to ensure data is sent after the promise resolves
                            sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ 
                                media: { 
                                    data: encode(new Uint8Array(int16.buffer)), 
                                    mimeType: 'audio/pcm;rate=16000' 
                                } 
                            }));
                        };
                        source.connect(processor);
                        processor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (m: LiveServerMessage) => {
                        if (m.serverContent?.inputTranscription) currentInputTranscriptionRef.current += m.serverContent.inputTranscription.text;
                        if (m.serverContent?.outputTranscription) { setIsSpeaking(true); currentOutputTranscriptionRef.current += m.serverContent.outputTranscription.text; }
                        const audio = m.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audio && outputAudioContextRef.current) {
                            setIsSpeaking(true);
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const buffer = await LiveAudioUtils.decodeAudioData(LiveAudioUtils.decode(audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.onended = () => { outputSourcesRef.current.delete(source); if (outputSourcesRef.current.size === 0) setIsSpeaking(false); };
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            outputSourcesRef.current.add(source);
                        }
                        if (m.serverContent?.turnComplete) {
                            if (currentInputTranscriptionRef.current.trim()) setMessages(prev => [...prev, { role: 'user', content: currentInputTranscriptionRef.current.trim() }]);
                            if (currentOutputTranscriptionRef.current.trim()) setMessages(prev => [...prev, { role: 'model', content: currentOutputTranscriptionRef.current.trim() }]);
                            currentInputTranscriptionRef.current = ''; currentOutputTranscriptionRef.current = '';
                        }
                    }
                }, config.chatSystemInstruction);
            } catch (error) { alert("Microphone access denied."); setIsVoiceMode(false); }
        }
    };

    if (!isOpen) return <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-40 ring-4 ring-orange-600/20"><BotIcon className="h-6 w-6" /></button>;

    return (
        <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] max-w-md h-[80vh] flex flex-col bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 z-50 overflow-hidden chat-widget-enter">
            <header className="flex items-center justify-between p-5 bg-slate-800/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-600 p-2 rounded-xl"><SparklesIcon className="text-white h-4 w-4"/></div>
                    <span className="font-bold text-gray-100">AI Assistant</span>
                </div>
                <button onClick={() => { setIsOpen(false); cleanupVoice(); }} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><CloseIcon className="h-5 w-5" /></button>
            </header>

            <div className="flex-grow p-5 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} fade-in`}>
                        <div className={`max-w-[85%] px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-800 text-gray-200 rounded-2xl rounded-tl-none border border-slate-700'}`}>
                            {msg.content}
                        </div>
                        {msg.role === 'model' && i !== 0 && (
                            <div className="mt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedMessageIndex(i); setTimeout(() => setCopiedMessageIndex(null), 2000); }} className="text-[10px] text-gray-500 hover:text-orange-400 flex items-center gap-1">
                                    {copiedMessageIndex === i ? <CheckIcon className="h-3 w-3 text-green-400"/> : <CopyIcon className="h-3 w-3" />}
                                    {copiedMessageIndex === i ? 'Listo' : 'Copiar'}
                                </button>
                                <button onClick={() => handleAnalyze(msg.content)} className="text-[10px] text-gray-500 hover:text-orange-400 flex items-center gap-1"><SparklesIcon className="h-3 w-3" />Analizar</button>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 bg-slate-800/30">
                {isVoiceMode ? (
                    <div className="flex flex-col items-center gap-3">
                         <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-blue-400 animate-ping' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{isSpeaking ? 'Model Speaking' : 'Listening...'}</span>
                         </div>
                         <button onClick={handleToggleVoiceMode} className="bg-red-600 p-4 rounded-full hover:scale-105 transition-all"><StopCircleIcon className="h-6 w-6 text-white" /></button>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="¿Dudas sobre tu negocio?" className="flex-grow p-3 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-600 focus:outline-none text-sm" />
                        <button type="button" onClick={handleToggleVoiceMode} className="p-3 text-gray-400 hover:text-orange-600"><MicrophoneIcon /></button>
                        <button type="submit" disabled={!inputValue.trim()} className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 disabled:opacity-50"><svg className="h-5 w-5 rotate-45" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
                    </form>
                )}
            </footer>
        </div>
    );
};