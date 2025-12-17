
import React from 'react';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { LayoutDashboardIcon } from './icons/LayoutDashboardIcon';

interface HeaderProps {
    isAdminMode: boolean;
    onToggleAdmin: () => void;
    appName: string;
}

export const Header: React.FC<HeaderProps> = ({ isAdminMode, onToggleAdmin, appName }) => {
  return (
    <header className="bg-blue-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-blue-800 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => isAdminMode && onToggleAdmin()}>
          <BrainCircuitIcon className="h-8 w-8 text-orange-400" />
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 text-transparent bg-clip-text">
            {appName}
          </h1>
          {isAdminMode && (
              <span className="bg-orange-600/20 text-orange-400 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-orange-600/30 ml-2">
                  Admin
              </span>
          )}
        </div>

        <button 
            onClick={onToggleAdmin}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm ${
                isAdminMode 
                ? 'bg-blue-800 text-white border border-blue-700 hover:bg-blue-700' 
                : 'bg-blue-900/50 text-blue-400 border border-transparent hover:border-blue-700 hover:text-white'
            }`}
        >
            {isAdminMode ? (
                <>
                    <LayoutDashboardIcon className="h-4 w-4" />
                    <span>Ver App</span>
                </>
            ) : (
                <>
                    <SettingsIcon className="h-4 w-4" />
                    <span>Admin</span>
                </>
            )}
        </button>
      </div>
    </header>
  );
};
