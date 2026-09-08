import React, { useEffect, useState } from 'react';
import { MDSLogo } from './MDSLogo';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AppSplashScreenProps {
  onLoaded?: () => void;
  minDurationMs?: number;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  onLoaded,
  minDurationMs = 1400,
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Chargement du noyau MDS Manager...');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(48);
      setStatusText('Vérification des protocoles de sécurité...');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Connexion aux bases institutionnelles...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Système prêt');
      setIsDone(true);
    }, minDurationMs);

    const t4 = setTimeout(() => {
      if (onLoaded) {
        onLoaded();
      }
    }, minDurationMs + 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [minDurationMs, onLoaded]);

  return (
    <div
      id="app-splash-screen"
      className={`fixed inset-0 z-99999 flex flex-col items-center justify-center bg-[#0F1E36] text-white transition-opacity duration-500 ease-out select-none ${
        isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Halo d'ambiance d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00B0FF]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#E52320]/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Cadre circulaire frame ultra professionnel */}
        <div className="relative w-44 h-44 flex items-center justify-center mb-6">
          {/* Anneau SVG de chargement rotatif haute précision */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Piste de fond */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#1B365D"
              strokeWidth="4"
              strokeDasharray="4 6"
            />
            {/* Anneau d'accent rotatif cyan */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#00B0FF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="440"
              strokeDashoffset={440 - (440 * progress) / 100}
              className="transition-all duration-300 ease-out"
            />
            {/* Marqueur laser rotatif rouge */}
            <circle
              cx="80"
              cy="80"
              r="76"
              fill="none"
              stroke="#E52320"
              strokeWidth="2"
              strokeDasharray="20 180"
              className="animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </svg>

          {/* Anneau interne orbital */}
          <div
            className="absolute inset-3 rounded-full border border-cyan-400/20 animate-spin"
            style={{ animationDuration: '8s', animationDirection: 'reverse' }}
          />

          {/* Cœur avec le Logo officiel MDS */}
          <div className="relative w-28 h-28 rounded-full bg-[#152B4D] border border-cyan-500/30 flex items-center justify-center shadow-2xl shadow-cyan-500/20 overflow-hidden">
            <MDSLogo variant="emblem" size="lg" className="scale-110 drop-shadow-md animate-pulse" />
          </div>
        </div>

        {/* Typographie institutionnelle */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-[#E52320] font-black uppercase tracking-[0.25em] text-xs mb-0.5">
            Centre Médical
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#00B0FF] tracking-tight">
            La Main du Secours
          </h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-1">
            Plateforme de Gestion Intégrée & Suivi de Caisse
          </p>
        </div>

        {/* Barre de progression circulaire / linéaire ultra fine */}
        <div className="w-64 bg-slate-800/80 rounded-full h-1.5 p-0.5 border border-slate-700/60 overflow-hidden mb-3">
          <div
            className="h-full bg-linear-to-r from-[#E52320] via-[#00B0FF] to-cyan-300 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Statut textuel */}
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300/90 h-5">
          {progress >= 100 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
          )}
          <span className="truncate">{statusText}</span>
        </div>

        <div className="mt-8 flex items-center gap-1.5 text-[10px] text-slate-500 tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>MDS MANAGER v2.4 • CERTIFIÉ CONFORME</span>
        </div>
      </div>
    </div>
  );
};
