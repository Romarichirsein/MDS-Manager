import React from 'react';
import { DashboardStats, InstitutionSettings, Paiement, Etudiant } from '../types';
import { formatCurrency, formatDate } from '../services/api';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  ShieldAlert,
  CreditCard,
  PieChart,
  Layers,
  Plus,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  settings: InstitutionSettings;
  onOpenNewStudent: () => void;
  onOpenPaymentModal: () => void;
  onSelectStudent: (student: Etudiant) => void;
  onViewReceipt: (payment: Paiement) => void;
  onNavigateToStudents: () => void;
  onNavigateToPayments: () => void;
  onNavigateToSolvency: () => void;
  canManageStudents: boolean;
  canRecordPayments: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  settings,
  onOpenNewStudent,
  onOpenPaymentModal,
  onSelectStudent,
  onViewReceipt,
  onNavigateToStudents,
  onNavigateToPayments,
  onNavigateToSolvency,
  canManageStudents,
  canRecordPayments,
}) => {
  const devise = settings.devise || 'FCFA';

  const nonSolvablesTotal = stats.totalPartiels + stats.totalNonSolvables;
  const solvablesPercent =
    stats.totalActifs > 0 ? Math.round((stats.totalSolvables / stats.totalActifs) * 100) : 0;
  const nonSolvablesPercent =
    stats.totalActifs > 0 ? Math.round((nonSolvablesTotal / stats.totalActifs) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* 4 Primary Geometric Balance KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Étudiants */}
        <div
          onClick={onNavigateToStudents}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Étudiants
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalInscrits.toLocaleString()}
            </h2>
            <span className="text-indigo-600 text-xs font-bold">
              +{stats.nouveauxCeMois} ce mois
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {stats.totalActifs} actifs • {stats.totalArchives} archivés
          </div>
        </div>

        {/* Solvables */}
        <div
          onClick={onNavigateToSolvency}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Solvables (À Jour)
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-3xl font-black text-emerald-600 tracking-tight">
              {stats.totalSolvables.toLocaleString()}
            </h2>
            <span className="text-slate-400 text-xs font-medium">
              {solvablesPercent}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Frais 100% soldés
          </div>
        </div>

        {/* Non Solvables */}
        <div
          onClick={onNavigateToSolvency}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Non Solvables (Retard)
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-3xl font-black text-rose-600 tracking-tight">
              {nonSolvablesTotal.toLocaleString()}
            </h2>
            <span className="text-slate-400 text-xs font-medium">
              {nonSolvablesPercent}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-medium">
            {stats.totalPartiels} partiels • {stats.totalNonSolvables} impayés
          </div>
        </div>

        {/* Recettes Globales */}
        <div
          onClick={onNavigateToPayments}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Recettes Globales
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl lg:text-3xl font-black text-indigo-900 tracking-tight truncate" title={formatCurrency(stats.montantTotalEncaisse, devise)}>
              {formatCurrency(stats.montantTotalEncaisse, devise)}
            </h2>
            <span className="text-slate-400 text-xs uppercase font-bold shrink-0">
              {devise}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-medium">
            {stats.tauxRecouvrementGlobal}% de l objectif budgétaire
          </div>
        </div>
      </div>

      {/* Main 3-Column Split from Geometric Balance Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Table of Inscriptions & Payment Registry */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Dernières Inscriptions & Statuts (Design Table) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 text-sm">Dernières Inscriptions & Statuts</h3>
              <button
                onClick={onNavigateToStudents}
                className="text-indigo-600 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                Voir tout
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Matricule</th>
                    <th className="px-6 py-3">Nom complet</th>
                    <th className="px-6 py-3">Formation</th>
                    <th className="px-6 py-3">Montant Payé</th>
                    <th className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {stats.derniersEtudiants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-400">
                        Aucune inscription enregistrée
                      </td>
                    </tr>
                  ) : (
                    stats.derniersEtudiants.slice(0, 5).map((stu) => {
                      const isSolvable = stu.statutFinancier === 'SOLVABLE';
                      const isPartiel = stu.statutFinancier === 'PARTIEL';
                      return (
                        <tr
                          key={stu.id}
                          onClick={() => onSelectStudent(stu)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">
                            {stu.matricule}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800 text-xs">
                            {stu.nom} {stu.prenom}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[180px]">
                            {stu.formation}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 text-xs">
                            {formatCurrency(stu.totalPaye, devise)}
                          </td>
                          <td className="px-6 py-4">
                            {isSolvable ? (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                                À Jour
                              </span>
                            ) : isPartiel ? (
                              <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase">
                                Retard
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase">
                                Impayé
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Derniers Paiements Enregistrés */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Derniers Paiements de Caisse</h3>
              </div>
              <button
                onClick={onNavigateToPayments}
                className="text-indigo-600 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                Journal complet
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.derniersPaiements.length === 0 ? (
                <p className="px-6 py-8 text-center text-xs text-slate-400">
                  Aucun versement enregistré
                </p>
              ) : (
                stats.derniersPaiements.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {p.numeroRecu}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{p.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatDate(p.datePaiement)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{p.modePaiement}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{p.referencePaiement}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-indigo-900 text-sm">
                        {formatCurrency(p.montant, devise)}
                      </span>
                      <button
                        onClick={() => onViewReceipt(p)}
                        title="Imprimer le reçu de caisse"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Situation Globale Card + Activity & Breakdown */}
        <div className="flex flex-col gap-6">
          {/* Dark Indigo Situation Globale Card */}
          <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1">Situation Globale</h3>
              <p className="text-indigo-300 text-xs mb-6">
                Année Académique {settings.anneeEnCours}
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-indigo-200">Objectif Recouvrement</span>
                    <span className="font-bold text-white">
                      {stats.tauxRecouvrementGlobal}%
                    </span>
                  </div>
                  <div className="w-full bg-indigo-950/60 rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${stats.tauxRecouvrementGlobal}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-indigo-800/80">
                  <div>
                    <p className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider">
                      Reste à percevoir
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5 truncate" title={formatCurrency(stats.montantRestantARecouvrer, devise)}>
                      {formatCurrency(stats.montantRestantARecouvrer, devise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider">
                      Budget Attendu
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5 truncate" title={formatCurrency(stats.montantTotalAttendu, devise)}>
                      {formatCurrency(stats.montantTotalAttendu, devise)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Geometric Accent Circle */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-800 rounded-full opacity-20 pointer-events-none" />
          </div>

          {/* Activity Journal (Journal d'Activité) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">Journal d'Activité</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="text-slate-800">
                    <span className="font-bold">Caisse :</span> Dernier encaissement enregistré avec succès
                  </p>
                  <p className="text-slate-400 mt-0.5 text-[10px]">Temps réel</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="text-slate-800">
                    <span className="font-bold">Inscriptions :</span> {stats.totalActifs} étudiants actifs répertoriés
                  </p>
                  <p className="text-slate-400 mt-0.5 text-[10px]">{stats.nouveauxCeMois} nouveaux ce mois</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div className="text-xs">
                  <p className="text-slate-800">
                    <span className="font-bold text-rose-700">Alerte :</span> {stats.totalNonSolvables} étudiants sans aucun versement
                  </p>
                  <p className="text-slate-400 mt-0.5 text-[10px]">Relances recommandées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par Mode de Règlement */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Règlements par Mode</h3>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {Object.entries(stats.repartitionParMode).map(([mode, rawAmount]) => {
                const montant = Number(rawAmount) || 0;
                const share =
                  stats.montantTotalEncaisse > 0
                    ? Math.round((montant / stats.montantTotalEncaisse) * 100)
                    : 0;
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600">{mode}</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(montant, devise)} ({share}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
