import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  Etudiant,
  Paiement,
  DashboardStats,
  InstitutionSettings,
  ActivityLog,
} from './types';
import { api } from './services/api';

// Components
import { Navigation, NavigationTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { SolvencyView } from './components/SolvencyView';
import { PaymentList } from './components/PaymentList';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';

// Modals
import { StudentFormModal } from './components/StudentFormModal';
import { PaymentModal } from './components/PaymentModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { StudentFinancialStatementModal } from './components/StudentFinancialStatementModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { AppSplashScreen } from './components/AppSplashScreen';
import { MDSLogo } from './components/MDSLogo';

import { RefreshCw, AlertCircle, Menu, Search, Plus, DollarSign, LogOut, ExternalLink } from 'lucide-react';

function getTabFromPath(pathname: string): NavigationTab {
  const p = (pathname || '').toLowerCase().replace(/\/$/, '');
  if (p === '/etudiants' || p === '/students') return 'students';
  if (p === '/paiements' || p === '/payments') return 'payments';
  if (p === '/solvabilite' || p === '/solvency') return 'solvency';
  if (p === '/logs' || p === '/audit-logs') return 'logs';
  if (p === '/parametres' || p === '/settings') return 'settings';
  return 'dashboard';
}

function getPathFromTab(tab: NavigationTab): string {
  switch (tab) {
    case 'students':
      return '/etudiants';
    case 'payments':
      return '/paiements';
    case 'solvency':
      return '/solvabilite';
    case 'logs':
      return '/logs';
    case 'settings':
      return '/parametres';
    case 'dashboard':
    default:
      return '/dashboard';
  }
}

function MainApp() {
  const { user, loading: authLoading, logout, canManageStudents, canRecordPayments, isAdmin } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Navigation par URL
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/login';
  });

  const navigate = useCallback((path: string, replace = false) => {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
  }, []);

  // Écoute de l'historique du navigateur (Précédent / Suivant)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronisation de redirection d'authentification
  useEffect(() => {
    if (authLoading) return;

    const rawPath = window.location.pathname || '/';
    const cleanPath = rawPath.toLowerCase().replace(/\/$/, '');

    if (!user) {
      // Non connecté -> on atterrit obligatoirement sur /login
      if (cleanPath !== '/login') {
        navigate('/login', true);
      }
    } else {
      // Connecté -> si sur racine ou /login, aller sur /dashboard
      if (cleanPath === '' || cleanPath === '/' || cleanPath === '/login') {
        navigate('/dashboard', true);
      }
    }
  }, [user, authLoading, navigate]);

  const currentTab = getTabFromPath(currentPath);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  // Core Data
  const [students, setStudents] = useState<Etudiant[]>([]);
  const [payments, setPayments] = useState<Paiement[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<InstitutionSettings>({
    nomEtablissement: 'MDS Manager (Main du Secours)',
    anneeEnCours: '2024-2025',
    devise: 'FCFA',
    mentionBasPageRecu: 'Reçu officiel certifié conforme par la Caisse MDS Manager (Main du Secours). Conservez ce document pour tout recours.',
    telephone: '+225 27 22 45 80 00',
    email: 'lamaindusecour@gmail.com',
    adresse: 'Avenue Centrale MDS, Campus Principal',
    filières: [
      { nom: 'Génie Logiciel & Informatique', fraisDefaut: 1200000 },
      { nom: 'Management & Gestion des Entreprises', fraisDefaut: 950000 },
      { nom: 'Comptabilité, Contrôle & Audit', fraisDefaut: 1000000 },
      { nom: 'Droit des Affaires & Fiscalité', fraisDefaut: 900000 },
      { nom: 'Marketing Digital & Communication', fraisDefaut: 850000 },
      { nom: 'Cybersécurité & Réseaux Télécoms', fraisDefaut: 1350000 },
    ],
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // State flags
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals visibility & payload
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Etudiant | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudentTarget, setPaymentStudentTarget] = useState<Etudiant | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Paiement | null>(null);
  const [receiptStudent, setReceiptStudent] = useState<Etudiant | null>(null);

  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementStudent, setStatementStudent] = useState<Etudiant | null>(null);
  const [statementPayments, setStatementPayments] = useState<Paiement[]>([]);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Load all data from API
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [studentsData, paymentsData, statsData, settingsData] = await Promise.all([
        api.getStudents(),
        api.getPayments(),
        api.getDashboardStats(),
        api.getSettings(),
      ]);

      setStudents(studentsData);
      setPayments(paymentsData);
      setStats(statsData);
      setSettings(settingsData);

      // Load logs if available
      try {
        const logsData = await api.getAuditLogs();
        setLogs(logsData);
      } catch (e) {
        console.warn('Logs could not be loaded', e);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Impossible de charger les données du serveur.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for Student operations
  const handleOpenNewStudent = () => {
    setStudentToEdit(null);
    setIsStudentFormOpen(true);
  };

  const handleEditStudent = (student: Etudiant) => {
    setStudentToEdit(student);
    setIsStudentFormOpen(true);
  };

  const handleStudentFormSuccess = (student: Etudiant, payment?: Paiement) => {
    loadData(true);
    if (payment) {
      setReceiptPayment(payment);
      setReceiptStudent(student);
      setIsReceiptOpen(true);
    }
  };

  const handleSelectStudent = (student: Etudiant) => {
    setDetailStudentId(student.id);
    setIsDetailOpen(true);
  };

  const handleToggleArchive = async (student: Etudiant) => {
    try {
      await api.toggleArchiveStudent(student.id);
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l archivage');
    }
  };

  const handleDeleteStudent = async (student: Etudiant) => {
    if (!confirm(`Confirmez-vous la suppression définitive du dossier de ${student.nom} ${student.prenom} ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await api.deleteStudent(student.id);
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  // Handlers for Payment operations
  const handleOpenPaymentModal = (student?: Etudiant) => {
    setPaymentStudentTarget(student || null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (payment: Paiement, student: Etudiant) => {
    loadData(true);
    setReceiptPayment(payment);
    setReceiptStudent(student);
    setIsReceiptOpen(true);
  };

  const handleViewReceipt = (payment: Paiement, student?: Etudiant) => {
    const s = student || students.find((st) => st.id === payment.studentId);
    setReceiptPayment(payment);
    setReceiptStudent(s || null);
    setIsReceiptOpen(true);
  };

  const handleCancelPayment = async (payment: Paiement) => {
    if (!confirm(`Êtes-vous certain de vouloir annuler le paiement N° ${payment.numeroRecu} de ${payment.montant} ${settings.devise} ? Le solde de l'étudiant sera réajusté.`)) {
      return;
    }
    try {
      await api.cancelPayment(payment.id);
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Impossible d annuler ce paiement');
    }
  };

  // Handlers for Financial Statement
  const handlePrintStatement = (student: Etudiant, studentPayments: Paiement[]) => {
    setStatementStudent(student);
    setStatementPayments(studentPayments);
    setIsStatementOpen(true);
  };

  const tabTitles: Record<NavigationTab, string> = {
    dashboard: 'Tableau de bord de solvabilité',
    students: 'Registre des Étudiants & Inscriptions',
    solvency: 'Solvabilité & Rapports de Recouvrement',
    payments: 'Journal des Paiements & Caisse',
    logs: "Journal d'Audit des Opérations",
    settings: "Paramètres de l'Établissement",
  };

  if (showSplash || authLoading) {
    return (
      <AppSplashScreen
        minDurationMs={1300}
        onLoaded={() => {
          if (!authLoading) {
            setShowSplash(false);
          }
        }}
      />
    );
  }

  // Si non connecté ou sur la route /login, afficher la page de connexion
  if (!user || currentPath === '/login') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          navigate('/dashboard');
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(t) => {
          navigate(getPathFromTab(t));
          setIsMobileOpen(false);
        }}
        settings={settings}
        onOpenNewStudent={handleOpenNewStudent}
        onOpenPaymentModal={() => handleOpenPaymentModal()}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Top Header */}
        <header className="no-print h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block lg:hidden">
              <MDSLogo variant="emblem" size="xs" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{tabTitles[currentTab]}</span>
                <span className="hidden md:inline-block px-2 py-0.5 bg-slate-100 text-indigo-700 text-[10px] font-mono font-bold rounded-md border border-slate-200">
                  {getPathFromTab(currentTab)}
                </span>
              </h1>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {settings.nomEtablissement} • Année {settings.anneeEnCours}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Rechercher un matricule..."
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value);
                  if (currentTab !== 'students') navigate('/etudiants');
                }}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-52 lg:w-60 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {canManageStudents && (
              <button
                onClick={handleOpenNewStudent}
                className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Nouvel Étudiant</span>
                <span className="sm:hidden">Inscription</span>
              </button>
            )}

            {canRecordPayments && (
              <button
                onClick={() => handleOpenPaymentModal()}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                Encaisser
              </button>
            )}

            <button
              id="refresh-data-btn"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Actualiser les données"
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Header user badge & logout */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[140px]" title={user.nom}>
                    {user.nom}
                  </p>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase">{user.role}</span>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Déconnexion"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Container */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => loadData()}
                className="px-3 py-1.5 bg-rose-700 text-white font-bold rounded-lg hover:bg-rose-800 transition-colors cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-600">
                Synchronisation de la base de données de l établissement...
              </p>
            </div>
          ) : (
            <div>
              {currentTab === 'dashboard' && stats && (
                <Dashboard
                  stats={stats}
                  settings={settings}
                  onOpenNewStudent={handleOpenNewStudent}
                  onOpenPaymentModal={() => handleOpenPaymentModal()}
                  onSelectStudent={handleSelectStudent}
                  onViewReceipt={handleViewReceipt}
                  onNavigateToStudents={() => navigate('/etudiants')}
                  onNavigateToPayments={() => navigate('/paiements')}
                  onNavigateToSolvency={() => navigate('/solvabilite')}
                  canManageStudents={canManageStudents}
                  canRecordPayments={canRecordPayments}
                />
              )}

              {currentTab === 'students' && (
                <StudentList
                  students={students}
                  settings={settings}
                  onOpenNewStudent={handleOpenNewStudent}
                  onSelectStudent={handleSelectStudent}
                  onEditStudent={handleEditStudent}
                  onRecordPayment={(s) => handleOpenPaymentModal(s)}
                  onToggleArchive={handleToggleArchive}
                  onDeleteStudent={handleDeleteStudent}
                  canManageStudents={canManageStudents}
                  canRecordPayments={canRecordPayments}
                  isAdmin={isAdmin}
                />
              )}

              {currentTab === 'solvency' && (
                <SolvencyView
                  students={students}
                  settings={settings}
                  onSelectStudent={handleSelectStudent}
                  onRecordPayment={(s) => handleOpenPaymentModal(s)}
                  canRecordPayments={canRecordPayments}
                />
              )}

              {currentTab === 'payments' && (
                <PaymentList
                  payments={payments}
                  settings={settings}
                  onOpenPaymentModal={() => handleOpenPaymentModal()}
                  onViewReceipt={handleViewReceipt}
                  onCancelPayment={handleCancelPayment}
                  canRecordPayments={canRecordPayments}
                  isAdmin={isAdmin}
                />
              )}

              {currentTab === 'logs' && (
                <AuditLogsView logs={logs} onRefresh={() => loadData(true)} />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onUpdateSettings={(newS) => setSettings(newS)}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          )}
        </main>

        {/* Live sync footer */}
        <footer className="no-print py-3 border-t border-slate-200 bg-white px-6 sm:px-8 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>
              © {new Date().getFullYear()} {settings.nomEtablissement} • Système MDS Manager (Main du Secours)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Base de données connectée
            </span>
          </div>
        </footer>
      </div>

      {/* Modals Container */}
      {isStudentFormOpen && (
        <StudentFormModal
          isOpen={isStudentFormOpen}
          onClose={() => setIsStudentFormOpen(false)}
          onSuccess={handleStudentFormSuccess}
          studentToEdit={studentToEdit}
          settings={settings}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          preselectedStudent={paymentStudentTarget}
          studentsList={students}
          settings={settings}
        />
      )}

      {isReceiptOpen && receiptPayment && (
        <PaymentReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          payment={receiptPayment}
          student={receiptStudent}
          settings={settings}
        />
      )}

      {isStatementOpen && statementStudent && (
        <StudentFinancialStatementModal
          isOpen={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
          student={statementStudent}
          payments={statementPayments}
          settings={settings}
        />
      )}

      {detailStudentId && (
        <StudentDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setDetailStudentId(null);
          }}
          studentId={detailStudentId}
          settings={settings}
          onEdit={(s) => {
            setIsDetailOpen(false);
            handleEditStudent(s);
          }}
          onRecordPayment={(s) => {
            setIsDetailOpen(false);
            handleOpenPaymentModal(s);
          }}
          onViewReceipt={(p, s) => {
            setIsDetailOpen(false);
            handleViewReceipt(p, s);
          }}
          onPrintStatement={(s, p) => {
            setIsDetailOpen(false);
            handlePrintStatement(s, p);
          }}
          onStudentUpdated={() => loadData(true)}
          canRecordPayments={canRecordPayments}
        />
      )}

      {isLoginOpen && (
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
