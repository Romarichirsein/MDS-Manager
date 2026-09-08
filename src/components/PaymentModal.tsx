import React, { useState, useEffect } from 'react';
import { Etudiant, Paiement, InstitutionSettings, ModePaiement } from '../types';
import { api, formatCurrency } from '../services/api';
import { X, DollarSign, CheckCircle2, AlertCircle, Search, Sparkles } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Paiement, student: Etudiant) => void;
  preselectedStudent?: Etudiant | null;
  studentsList: Etudiant[];
  settings: InstitutionSettings;
}

const MODES: ModePaiement[] = [
  'Espèces',
  'Virement bancaire',
  'Chèque',
  'Mobile Money',
  'Carte Bancaire',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedStudent,
  studentsList,
  settings,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || ''
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [montant, setMontant] = useState<number>(100000);
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [motif, setMotif] = useState('Frais de scolarité - Tranche');
  const [remarques, setRemarques] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id);
      const reste = preselectedStudent.resteAPayer ?? 0;
      setMontant(reste > 0 ? Math.min(reste, 200000) : 0);
      setMotif(reste <= 200000 && reste > 0 ? 'Frais de scolarité - Solde final' : 'Frais de scolarité - Versement');
      setReferencePaiement(`REF-${Date.now().toString(36).toUpperCase()}`);
    } else {
      setReferencePaiement(`REF-${Date.now().toString(36).toUpperCase()}`);
    }
  }, [preselectedStudent]);

  const currentStudent = studentsList.find((s) => s.id === selectedStudentId);

  // Filtrage des étudiants pour la liste déroulante avec recherche
  const filteredStudents = studentsList.filter((s) => {
    if (s.statut === 'archive') return false;
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.nom.toLowerCase().includes(q) ||
      s.prenom.toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q) ||
      s.formation.toLowerCase().includes(q)
    );
  });

  const handleSelectStudent = (s: Etudiant) => {
    setSelectedStudentId(s.id);
    const reste = s.resteAPayer ?? 0;
    setMontant(reste > 0 ? Math.min(reste, 250000) : 0);
    setMotif(reste <= 250000 && reste > 0 ? 'Frais de scolarité - Solde final' : 'Frais de scolarité - Acompte');
  };

  const handleApplyPreset = (percentage: number) => {
    if (!currentStudent) return;
    const reste = currentStudent.resteAPayer ?? 0;
    if (reste <= 0) return;
    if (percentage === 1) {
      setMontant(reste);
      setMotif('Frais de scolarité - Solde définitif');
    } else {
      const part = Math.round(reste * percentage);
      setMontant(part);
      setMotif(`Frais de scolarité - Tranche (${Math.round(percentage * 100)}%)`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStudentId) {
      setError('Veuillez sélectionner un étudiant.');
      return;
    }

    if (montant <= 0) {
      setError('Le montant du paiement doit être supérieur à zéro.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.recordPayment({
        studentId: selectedStudentId,
        montant: Number(montant),
        datePaiement,
        modePaiement,
        referencePaiement: referencePaiement.trim() || `REF-${Date.now().toString(36).toUpperCase()}`,
        motif,
        remarques,
      });

      onSuccess(res.payment, res.student);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l enregistrement du paiement.');
    } finally {
      setLoading(false);
    }
  };

  const devise = settings.devise || 'FCFA';
  const resteActuel = currentStudent?.resteAPayer ?? 0;
  const nouveauRestePrevu = Math.max(0, resteActuel - montant);

  if (!isOpen) return null;

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">Enregistrement d un Paiement Scolaire</h2>
              <p className="text-xs text-emerald-200">
                Encaissement et émission immédiate du reçu officiel
              </p>
            </div>
          </div>
          <button
            id="close-payment-modal-btn"
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sélection de l'étudiant si non pré-sélectionné */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Étudiant Bénéficiaire *
            </label>

            {!preselectedStudent ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="search-student-payment-input"
                    type="text"
                    placeholder="Rechercher par nom ou matricule..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50">
                  {filteredStudents.length === 0 ? (
                    <p className="p-3 text-xs text-slate-500 text-center">Aucun étudiant trouvé</p>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          selectedStudentId === s.id
                            ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                            : 'hover:bg-white text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-[11px] font-bold text-slate-600 mr-2">
                            {s.matricule}
                          </span>
                          <span>{s.nom} {s.prenom}</span>
                          <span className="text-[11px] text-slate-400 block">{s.formation} ({s.niveau})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] block font-bold text-amber-700">
                            Reste: {formatCurrency(s.resteAPayer, devise)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-slate-700 block">
                    {currentStudent?.matricule}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentStudent?.nom} {currentStudent?.prenom}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {currentStudent?.formation} - {currentStudent?.niveau}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Reste à payer</span>
                  <span className="text-sm font-extrabold text-amber-700">
                    {formatCurrency(currentStudent?.resteAPayer, devise)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* État financier en temps réel de l'étudiant sélectionné */}
          {currentStudent && (
            <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center mb-2.5">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">Total Scolarité</span>
                  <span className="font-bold text-slate-800">{formatCurrency(currentStudent?.fraisFormation, devise)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-emerald-600 block font-semibold">Déjà Versé</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(currentStudent?.totalPaye, devise)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-amber-600 block font-semibold">Reste Actuel</span>
                  <span className="font-bold text-amber-800">{formatCurrency(resteActuel, devise)}</span>
                </div>
              </div>

              {/* Raccourcis de calculs */}
              {resteActuel > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500 font-medium">Raccourcis de saisie :</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(0.25)}
                      className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(0.5)}
                      className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(1)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
                    >
                      Solde total (100%)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saisie financière */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Montant à encaisser ({devise}) *
              </label>
              <input
                id="payment-montant-input"
                type="number"
                min="1000"
                step="5000"
                value={montant}
                onChange={(e) => setMontant(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold text-emerald-900 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date du Paiement *</label>
              <input
                id="payment-date-input"
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mode de Paiement *</label>
              <select
                id="payment-mode-select"
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              >
                {MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Référence / N° Transaction</label>
              <input
                id="payment-ref-input"
                type="text"
                placeholder="ex: VIR-BICI-9921 ou OM-2025"
                value={referencePaiement}
                onChange={(e) => setReferencePaiement(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Motif du Paiement</label>
              <input
                id="payment-motif-input"
                type="text"
                placeholder="ex: Frais de scolarité - Tranche 1"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Commentaires / Remarques</label>
              <textarea
                id="payment-remarques-input"
                rows={1}
                placeholder="Remarques complémentaires du caissier..."
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Nouveau solde résultant */}
          {currentStudent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nouveau reste dû après ce versement :</span>
              </div>
              <span className={`font-extrabold text-sm ${nouveauRestePrevu === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                {formatCurrency(nouveauRestePrevu, devise)}
                {nouveauRestePrevu === 0 && ' (Soldé à 100%)'}
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              id="cancel-payment-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="confirm-payment-btn"
              type="submit"
              disabled={loading || !selectedStudentId}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              {loading ? 'Encaissement en cours...' : 'Valider et Générer le Reçu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
