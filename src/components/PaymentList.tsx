import React, { useState, useMemo } from 'react';
import { Paiement, InstitutionSettings } from '../types';
import { formatCurrency, downloadCSV, formatDate } from '../services/api';
import {
  Search,
  Receipt,
  Download,
  Printer,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign,
  Tag,
} from 'lucide-react';

interface PaymentListProps {
  payments: Paiement[];
  settings: InstitutionSettings;
  onOpenPaymentModal: () => void;
  onViewReceipt: (payment: Paiement) => void;
  onCancelPayment: (payment: Paiement) => void;
  canRecordPayments: boolean;
  isAdmin: boolean;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  settings,
  onOpenPaymentModal,
  onViewReceipt,
  onCancelPayment,
  canRecordPayments,
  isAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const devise = settings.devise || 'FCFA';

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (modeFilter && p.modePaiement !== modeFilter) return false;
      if (dateDebut && p.datePaiement < dateDebut) return false;
      if (dateFin && p.datePaiement > dateFin) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mRecu = p.numeroRecu.toLowerCase().includes(q);
        const mMat = p.matricule.toLowerCase().includes(q);
        const mName = p.studentName.toLowerCase().includes(q);
        const mRef = p.referencePaiement?.toLowerCase().includes(q);
        const mMotif = p.motif?.toLowerCase().includes(q);
        if (!mRecu && !mMat && !mName && !mRef && !mMotif) return false;
      }
      return true;
    });
  }, [payments, modeFilter, dateDebut, dateFin, searchTerm]);

  const totalEncaisseSelection = filteredPayments.reduce(
    (acc, p) => acc + (Number(p.montant) || 0),
    0
  );

  const handleExportCSV = () => {
    const headers = [
      'N° Reçu',
      'Matricule',
      'Étudiant',
      'Filière',
      'Niveau',
      'Date Paiement',
      'Mode Paiement',
      'Référence',
      'Motif',
      `Montant Encaissé (${devise})`,
      'Solde Antérieur',
      'Nouveau Solde Restant',
      'Caissier / Agent',
    ];

    const rows = filteredPayments.map((p) => [
      p.numeroRecu,
      p.matricule,
      p.studentName,
      p.formation,
      p.niveau,
      p.datePaiement,
      p.modePaiement,
      p.referencePaiement,
      p.motif,
      String(p.montant),
      String(p.soldePrecedent),
      String(p.nouveauSolde),
      p.caissierNom,
    ]);

    downloadCSV(`journal-de-caisse-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Journal des Encaissements & Caisse Scolaire
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique exhaustif des transactions, reçus certifiés et ventilation par mode de règlement
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="export-payments-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter Journal (CSV)
          </button>

          {canRecordPayments && (
            <button
              id="new-payment-main-btn"
              onClick={onOpenPaymentModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Encaisser un Paiement
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="payments-search-input"
              type="text"
              placeholder="Rechercher reçu, matricule, nom, réf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Mode de paiement */}
          <div>
            <select
              id="payments-mode-filter-select"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700"
            >
              <option value="">Tous les modes de règlement</option>
              <option value="Espèces">Espèces</option>
              <option value="Virement bancaire">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Carte Bancaire">Carte Bancaire</option>
            </select>
          </div>

          {/* Date Début */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Du:</span>
            <input
              id="payments-date-start-input"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700"
            />
          </div>

          {/* Date Fin */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Au:</span>
            <input
              id="payments-date-end-input"
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700"
            />
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span>
              <strong>{filteredPayments.length}</strong> versement(s) répertorié(s)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-900 font-bold">
              Total Encaissé : {formatCurrency(totalEncaisseSelection, devise)}
            </span>
          </div>

          {(searchTerm || modeFilter || dateDebut || dateFin) && (
            <button
              id="reset-payments-filter-btn"
              onClick={() => {
                setSearchTerm('');
                setModeFilter('');
                setDateDebut('');
                setDateFin('');
              }}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Aucun versement enregistré pour le moment</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              La caisse est initialisée et prête. Les versements et reçus officiels apparaîtront ici dès les premiers encaissements.
            </p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Aucun paiement ne correspond aux critères sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-bold">
                  <th className="p-3.5">N° Reçu</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Étudiant(e)</th>
                  <th className="p-3.5">Filière</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Référence</th>
                  <th className="p-3.5 text-right">Montant Versé</th>
                  <th className="p-3.5 text-right">Reste Dû</th>
                  <th className="p-3.5">Caissier</th>
                  <th className="p-3.5 text-center">Reçu Officiel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-xs text-indigo-600">{p.numeroRecu}</td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{formatDate(p.datePaiement)}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{p.studentName}</span>
                      <span className="font-mono text-[11px] text-slate-400">{p.matricule}</span>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <span className="block font-medium">{p.formation}</span>
                      <span className="text-[11px] text-slate-400">{p.niveau}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.modePaiement}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{p.referencePaiement}</td>
                    <td className="p-3.5 text-right font-black text-indigo-900 text-sm">
                      {formatCurrency(p.montant, devise)}
                    </td>
                    <td className="p-3.5 text-right font-medium">
                      <span className={p.nouveauSolde === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {formatCurrency(p.nouveauSolde, devise)}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 text-[11px]">{p.caissierNom}</td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-view-receipt-${p.id}`}
                          onClick={() => onViewReceipt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Reçu
                        </button>

                        {isAdmin && (
                          <button
                            id={`btn-cancel-pay-${p.id}`}
                            onClick={() => onCancelPayment(p)}
                            title="Annuler cette transaction (Admin)"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
