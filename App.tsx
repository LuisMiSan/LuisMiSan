import React, { useState, useEffect, useRef } from 'react';
import { analyzeFoodImage, getQuickTip } from './services/geminiService';
import { NutritionAnalysis, AppView, Recipe } from './types';
import MacrosChart from './components/PieChart';
import ChatBot from './components/ChatBot';

function App() {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickTip, setQuickTip] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Load a quick tip on mount using the Lite model
    getQuickTip().then(setQuickTip);
  }, []);

  // Cleanup stream on unmount or view change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const runAnalysis = async (base64Data: string, displaySrc: string) => {
    setImageSrc(displaySrc);
    setView(AppView.ANALYSIS);
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeFoodImage(base64Data);
      setAnalysis(result);
    } catch (err) {
      setError("No pudimos analizar la imagen. Intenta con una foto más clara.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        await runAnalysis(base64Data, base64String);
      };

      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setView(AppView.CAMERA);
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setView(AppView.HOME);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        
        stopCamera();
        runAnalysis(base64Data, dataUrl);
      }
    }
  };

  const resetApp = () => {
    stopCamera(); // Ensure camera is stopped if resetting
    setView(AppView.HOME);
    setImageSrc(null);
    setAnalysis(null);
    setError(null);
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-indigo-100 pb-20 md:pb-0 relative overflow-x-hidden font-inter">
      
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-white via-white/50 to-transparent"></div>
          
          {/* Animated Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[100px] animate-pulse"></div>
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Glass Navigation - Hidden in Camera View */}
      {view !== AppView.CAMERA && (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={resetApp}>
            <div className="relative">
               <div className="absolute inset-0 bg-blue-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
               <div className="relative w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/20">
                  <span className="material-icons-round text-lg">lens</span>
               </div>
            </div>
            <span className="font-bold text-2xl tracking-tighter text-gray-900">SnapCal<span className="text-blue-600">.</span></span>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 bg-gray-100/80 backdrop-blur-md px-1 p-1 rounded-full border border-gray-200/50">
              <span className="px-3 py-1 bg-white rounded-full shadow-sm text-xs font-bold text-gray-800">Cámara</span>
              <span className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">Historial</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50/80 backdrop-blur-sm border border-emerald-100/50 px-3 py-1.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Gemini 3 Pro
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`relative z-10 w-full mx-auto ${view === AppView.CAMERA ? 'h-screen p-0 max-w-none' : 'max-w-md pt-8 px-5 md:max-w-2xl'}`}>
        
        {view === AppView.CAMERA && (
          <div className="relative h-full w-full bg-black flex flex-col animate-fade-in-up">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-20">
               <button 
                  onClick={stopCamera}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
               >
                  <span className="material-icons-round">close</span>
               </button>
               <div className="px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Modo Escáner</span>
               </div>
            </div>

            {/* Scan Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-[80%] aspect-square border-2 border-white/30 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl -mb-1 -mr-1"></div>
                    <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 left-0 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-10 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent z-20 pb-16">
               <button 
                  onClick={takePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all shadow-lg shadow-black/30 group"
               >
                  <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform"></div>
               </button>
            </div>
          </div>
        )}

        {view === AppView.HOME && (
          <div className="flex flex-col items-center pt-8 md:pt-16 space-y-12 animate-fade-in-up">
            
            {/* Hero Section */}
            <div className="text-center space-y-8 relative max-w-xl mx-auto">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm mb-4 animate-bounce-slow">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-xs font-bold text-blue-900 tracking-wide uppercase">Nueva Tecnología de IA</span>
               </div>

              <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                Come mejor.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                  Vive mejor.
                </span>
              </h1>
              
              <p className="text-lg text-gray-500 font-medium max-w-xs mx-auto md:max-w-md leading-relaxed">
                Analiza calorías, macros y obtén recetas saludables con solo una foto. 
                <span className="block mt-2 text-indigo-600 font-semibold">{quickTip ? `💡 ${quickTip}` : ''}</span>
              </p>
            </div>

            {/* Scanner Card and Upload Option */}
            <div className="w-full max-w-sm flex flex-col gap-6 items-center">
                {/* Main Action: Camera */}
                <div 
                    onClick={startCamera}
                    className="w-full relative group perspective-1000 cursor-pointer"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                    
                    <div className="relative flex flex-col items-center justify-between w-full aspect-[3/4] md:aspect-[4/5] bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden transition-all duration-500 transform group-hover:scale-[1.02] border border-gray-100">
                        {/* Animated Scan Line */}
                        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent absolute top-0 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan"></div>
                        </div>

                        {/* Card Header */}
                        <div className="w-full h-3/5 bg-gradient-to-b from-blue-50 to-white relative flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            
                            {/* Circle Pulse UI */}
                            <div className="relative z-10">
                                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-10"></div>
                                <div className="absolute inset-[-20px] bg-indigo-500 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
                                
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/10 border-4 border-white z-20 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-round text-6xl text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">
                                        photo_camera
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="w-full h-2/5 p-8 flex flex-col items-center justify-center text-center bg-white z-10">
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Sacar Foto</h3>
                            <p className="text-sm text-gray-500 font-medium mb-6">
                                Usa la cámara para un análisis instantáneo.
                            </p>
                            <div className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-gray-900/20 group-hover:bg-blue-600 group-hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2">
                                <span>Abrir Cámara</span>
                                <span className="material-icons-round text-sm">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Action: Upload */}
                <label className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                    <span className="material-icons-round text-lg">photo_library</span>
                    Subir desde galería
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 pb-8">
                {['Google Cloud', 'Gemini AI', 'Health Secure'].map((brand, i) => (
                    <span key={i} className="text-xs font-bold uppercase tracking-widest text-gray-400">{brand}</span>
                ))}
            </div>
          </div>
        )}

        {view === AppView.ANALYSIS && (
          <div className="pb-24 space-y-6 animate-fade-in-up">
            {/* Image Preview Card */}
            <div className="bg-white p-3 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden group">
                <div className="aspect-video w-full rounded-[1.5rem] overflow-hidden bg-gray-100 relative">
                    {imageSrc && (
                        <img 
                            src={imageSrc} 
                            alt="Uploaded food" 
                            className="w-full h-full object-cover"
                        />
                    )}
                    {/* Floating Back Button */}
                    <button 
                        onClick={resetApp}
                        className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-lg"
                    >
                        <span className="material-icons-round">arrow_back</span>
                    </button>
                </div>
            </div>

            {loading && (
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl border border-white text-center space-y-6 animate-pulse">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-[6px] border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="material-icons-round absolute inset-0 flex items-center justify-center text-blue-600 text-3xl animate-pulse">restaurant</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Analizando...</h3>
                        <p className="text-gray-500 mt-2 font-medium">Nuestra IA está identificando ingredientes<br/> y calculando macros.</p>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center text-red-600">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl">error_outline</span>
                    </div>
                    <p className="font-medium">{error}</p>
                    <button onClick={resetApp} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors">Intentar de nuevo</button>
                </div>
            )}

            {analysis && !loading && (
                <div className="space-y-6">
                    
                    {/* Main Stats Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                        
                        <div className="relative z-10">
                            {/* Header with Confidence Score */}
                            <div className="flex flex-col items-center mb-8 gap-2">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Análisis Nutricional</h2>
                                
                                {/* Confidence Score Badge */}
                                {analysis.confidenceScore && (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm transition-all ${
                                        analysis.confidenceScore >= 80 ? 'bg-green-50 border-green-100 text-green-700' :
                                        analysis.confidenceScore >= 50 ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                                        'bg-red-50 border-red-100 text-red-700'
                                    }`}>
                                        <span className="relative flex h-2 w-2">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            analysis.confidenceScore >= 80 ? 'bg-green-400' : 
                                            analysis.confidenceScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                                        }`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                            analysis.confidenceScore >= 80 ? 'bg-green-500' : 
                                            analysis.confidenceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></span>
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">
                                            IA Precisión: {analysis.confidenceScore}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative">
                                    <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 tracking-tighter">
                                        {analysis.calories}
                                    </h3>
                                    <span className="absolute -right-10 top-4 text-xl font-bold text-gray-400 rotate-[-10deg]">kcal</span>
                                </div>
                                <span className="text-sm font-bold text-indigo-500 mt-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">Estimado por porción</span>
                            </div>

                            <div className="mt-4">
                                <MacrosChart data={analysis.macros} />
                                <div className="grid grid-cols-3 gap-3 mt-8">
                                    {[
                                        { label: 'Proteína', val: analysis.macros.protein, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                                        { label: 'Carbos', val: analysis.macros.carbs, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
                                        { label: 'Grasa', val: analysis.macros.fat, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' }
                                    ].map((macro, idx) => (
                                        <div key={idx} className={`flex flex-col items-center p-4 ${macro.bg} rounded-3xl border border-white shadow-sm transition-transform hover:scale-105`}>
                                            <div className={`w-2 h-2 ${macro.color} rounded-full mb-3`}></div>
                                            <span className={`text-2xl font-black ${macro.text}`}>{macro.val}g</span>
                                            <span className="text-[10px] font-bold uppercase text-gray-400 mt-1">{macro.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients & Healthy Swaps */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                <span className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                                    <span className="material-icons-round text-lg">restaurant</span>
                                </span>
                                Ingredientes
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {analysis.ingredients.map((ing, idx) => (
                                    <span key={idx} className="bg-gray-50 text-gray-700 border border-gray-100 px-3 py-1.5 rounded-xl text-sm font-semibold">
                                        {ing}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                <span className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                                    <span className="material-icons-round text-lg">eco</span>
                                </span>
                                Mejoras
                            </h3>
                            <ul className="space-y-3">
                                {analysis.healthySwaps.map((swap, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 bg-green-50/50 p-3 rounded-2xl border border-green-100/50">
                                        <span className="material-icons-round text-green-500 text-base mt-0.5 shrink-0">check_circle</span>
                                        <span className="font-semibold">{swap}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Alternative Recipes */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500 opacity-20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                        
                        <h3 className="font-black text-white mb-8 flex items-center gap-3 text-2xl relative z-10">
                            <span className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                                <span className="material-icons-round">auto_fix_high</span>
                            </span>
                            Versiones Ligeras
                        </h3>
                        
                        <div className="space-y-4 relative z-10">
                            {analysis.healthierRecipes.map((recipe, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setSelectedRecipe(recipe)}
                                    className="w-full text-left flex justify-between items-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] group shadow-lg"
                                >
                                    <div>
                                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                            {recipe.name}
                                            <span className="material-icons-round text-lg opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">arrow_forward</span>
                                        </h4>
                                        <p className="text-sm text-blue-100/90 mt-1 font-medium">{recipe.description}</p>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-xl ml-4 shrink-0 shadow-sm">
                                        <span className="text-sm font-black text-indigo-600">{recipe.calories} kcal</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            )}
          </div>
        )}
      </main>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" 
                onClick={() => setSelectedRecipe(null)}
            ></div>
            
            {/* Modal Card */}
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[85vh] overflow-y-auto relative shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 sm:p-10 text-white relative shrink-0">
                    <button 
                        onClick={() => setSelectedRecipe(null)}
                        className="absolute top-6 right-6 w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                    <div className="mt-2">
                        <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold mb-4 border border-white/10">
                            {selectedRecipe.calories} CALORÍAS
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                            {selectedRecipe.name}
                        </h2>
                        <p className="text-blue-100 mt-3 font-medium leading-relaxed opacity-90 text-lg">
                            {selectedRecipe.description}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 sm:p-10 space-y-10 bg-white">
                    {/* Ingredients */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl flex items-center gap-3 mb-5">
                            <span className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <span className="material-icons-round text-lg">shopping_basket</span>
                            </span>
                            Ingredientes
                        </h3>
                        <ul className="grid grid-cols-1 gap-3">
                            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                                selectedRecipe.ingredients.map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-700">
                                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0"></div>
                                        {item}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-400 italic text-sm">No hay ingredientes detallados.</li>
                            )}
                        </ul>
                    </div>

                    {/* Instructions */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl flex items-center gap-3 mb-5">
                            <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <span className="material-icons-round text-lg">menu_book</span>
                            </span>
                            Preparación
                        </h3>
                        <div className="space-y-4">
                             {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                                selectedRecipe.instructions.map((step, i) => (
                                    <div key={i} className="flex gap-5 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-200 z-10">
                                                {i + 1}
                                            </div>
                                            {i !== selectedRecipe.instructions.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-100 my-2 group-hover:bg-blue-200 transition-colors"></div>
                                            )}
                                        </div>
                                        <div className="pb-6 pt-1">
                                            <p className="text-gray-600 leading-relaxed text-sm font-medium">
                                                {step}
                                            </p>
                                        </div>
                                    </div>
                                ))
                             ) : (
                                <p className="text-gray-400 italic text-sm">No hay instrucciones detalladas.</p>
                             )}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                    <button 
                        onClick={() => setSelectedRecipe(null)}
                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Entendido</span>
                        <span className="material-icons-round text-sm">check</span>
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* Chatbot fixed at bottom */}
      <ChatBot />

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

export default App;