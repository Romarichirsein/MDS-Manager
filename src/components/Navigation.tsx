import React from 'react';
import { useAuth } from '../context/AuthContext';
import { InstitutionSettings } from '../types';
import { MDSLogo } from './MDSLogo';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  UserCheck,
  Plus,
  DollarSign,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'solvency'
  | 'payments'
  | 'logs'
  | 'settings';

interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  settings: InstitutionSettings;
  onOpenNewStudent: () => void;
  onOpenPaymentModal: () => void;
  onOpenLogin: () => void;
  onLogout?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  settings,
  onOpenNewStudent,
  onOpenPaymentModal,
  onOpenLogin,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout, canManageStudents, canRecordPayments } = useAuth();

  const navItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'students', label: 'Étudiants', icon: Users },
    { id: 'payments', label: 'Paiements & Caisse', icon: CreditCard },
    { id: 'solvency', label: 'Solvabilité & Rapports', icon: FileText },
    { id: 'logs', label: 'Journal d Audit', icon: Shield },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    onTabChange(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#1B365D] rounded-xl shadow-md ring-1 ring-cyan-500/30">
              <MDSLogo variant="emblem" size="sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tight leading-none text-sm">
                MDS MANAGER
              </span>
              <span className="text-[#00B0FF] text-[10px] font-bold tracking-wider mt-1">
                Centre Médical
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institution banner */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/60">
          <p className="text-[11px] font-bold text-indigo-400 truncate" title={settings.nomEtablissement}>
            {settings.nomEtablissement}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-400 font-medium">
              Année {settings.anneeEnCours}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-600 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white font-medium border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick actions inside sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {canManageStudents && (
            <button
              id="sidebar-new-student-btn"
              onClick={() => {
                onOpenNewStudent();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Nouvel Étudiant
            </button>
          )}

          {canRecordPayments && (
            <button
              id="sidebar-new-pay-btn"
              onClick={() => {
                onOpenPaymentModal();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Encaisser versement
            </button>
          )}
        </div>

        {/* User Account footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  {((user.nom || (user as any).name || 'U') as string)
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'U'}
                </div>
                <div className="text-xs overflow-hidden">
                  <p className="text-white font-medium truncate" title={user.nom || (user as any).name || 'Utilisateur'}>
                    {user.nom || (user as any).name || 'Utilisateur'}
                  </p>
                  <p className="text-slate-500 text-[10px] capitalize">{user.role?.toLowerCase() || 'compte'}</p>
                </div>
              </div>
              <button
                id="sidebar-logout-btn"
                onClick={() => {
                  logout();
                  if (onLogout) onLogout();
                }}
                title="Déconnexion"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="sidebar-login-btn"
              onClick={() => {
                onOpenLogin();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Se Connecter
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
