import React from 'react';
import { Paiement, Etudiant, InstitutionSettings } from '../types';
import { formatCurrency, formatDate, numberToFrenchWords } from '../services/api';
import { Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { MDSLogo } from './MDSLogo';

interface PaymentReceiptModalProps {
  isOpen?: boolean;
  payment: Paiement | null;
  student?: Etudiant | null;
  settings: InstitutionSettings;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen = true,
  payment,
  student,
  settings,
  onClose,
}) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = student ? `${student.nom} ${student.prenom}` : payment.studentName;
  const matricule = student ? student.matricule : payment.matricule;
  const formation = student ? student.formation : payment.formation;
  const niveau = student ? student.niveau : payment.niveau;
  const annee = student ? student.anneeAcademique : settings.anneeEnCours;

  const devise = settings.devise || 'FCFA';
  const montantEnLettres = numberToFrenchWords(payment.montant);

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Actions bar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold">Reçu Officiel de Paiement</h3>
              <p className="text-xs text-slate-400">N° {payment.numeroRecu}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimer le reçu
            </button>
            <button
              id="close-receipt-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="printable-sheet p-8 bg-white text-slate-900 font-sans text-sm">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1 bg-[#1B365D] rounded-xl shadow-xs">
                    <MDSLogo variant="emblem" size="sm" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-[#E52320] uppercase tracking-wider block">
                      Centre Médical
                    </span>
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">
                      {settings.nomEtablissement}
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic mb-2">{settings.slogan}</p>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>{settings.adresse}</p>
                  <p>Tél: {settings.telephone} | Email: {settings.email}</p>
                </div>
              </div>

              <div className="text-right border border-slate-200 p-3 rounded-lg bg-slate-50 min-w-[200px]">
                <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
                  Reçu de Caisse
                </span>
                <p className="text-base font-extrabold text-emerald-800 tracking-wide mt-0.5">
                  {payment.numeroRecu}
                </p>
                <div className="text-xs text-slate-600 mt-2">
                  <p>Date: <span className="font-medium">{formatDate(payment.datePaiement)}</span></p>
                  <p>Année: <span className="font-medium">{annee}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Identity Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Identification de l Étudiant(e)
            </h2>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Matricule officiel :</span>
                <span className="font-bold text-slate-900">{matricule}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Nom et Prénom(s) :</span>
                <span className="font-bold text-slate-900">{studentName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Filière / Spécialité :</span>
                <span className="font-medium text-slate-800">{formation}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Niveau / Promotion :</span>
                <span className="font-medium text-slate-800">{niveau}</span>
              </div>
            </div>
          </div>

          {/* Payment Detail Table */}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Détails de l Opération Financière
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <th className="p-3">Désignation / Motif</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Réf. Transaction</th>
                    <th className="p-3 text-right">Montant Versé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-900">
                      {payment.motif}
                      {payment.remarques && (
                        <span className="block text-xs text-slate-500 mt-0.5">{payment.remarques}</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">{payment.modePaiement}</td>
                    <td className="p-3 font-mono text-xs text-slate-600">{payment.referencePaiement}</td>
                    <td className="p-3 text-right font-bold text-emerald-700 text-base">
                      {formatCurrency(payment.montant, devise)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Montant en lettres */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 mb-6">
            <span className="font-bold">Somme arrêtée en toutes lettres : </span>
            <span className="italic capitalize">{montantEnLettres} {devise}.</span>
          </div>

          {/* Solde Situation */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-100 rounded-xl mb-6 text-center">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Solde Précédent Dû</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatCurrency(payment.soldePrecedent, devise)}
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[11px] text-emerald-600 uppercase tracking-wider block font-bold">Montant Réglé</span>
              <span className="font-bold text-emerald-700 text-base">
                - {formatCurrency(payment.montant, devise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold">Reste à Devoir</span>
              <span className={`text-base font-extrabold ${payment.nouveauSolde === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatCurrency(payment.nouveauSolde, devise)}
              </span>
            </div>
          </div>

          {/* Signatures and Stamp */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs items-end">
            <div className="text-center">
              <p className="font-medium text-slate-600 mb-8">L Étudiant(e) / Le Tuteur</p>
              <p className="text-[11px] text-slate-400 italic">(Signature pour acquit)</p>
            </div>

            <div className="text-center flex flex-col items-center justify-center">
              <div className="border-2 border-dashed border-emerald-600 text-emerald-800 rounded-xl p-2.5 max-w-[170px] text-[10px] leading-tight flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="font-extrabold tracking-wider uppercase">CAISSE CENTRALE</span>
                <span className="font-medium mt-0.5">QUITTANCE CERTIFIÉE</span>
                <span className="text-[9px] text-emerald-600 font-mono mt-0.5">{payment.numeroRecu}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="font-medium text-slate-600 mb-1">Le Caissier / Comptable</p>
              <p className="text-xs font-bold text-slate-800">{payment.caissierNom}</p>
              <div className="h-8 flex items-center justify-center">
                <span className="font-serif italic text-emerald-800 text-sm opacity-80">C. Koffi</span>
              </div>
              <p className="text-[10px] text-slate-400 italic">Signature & Date de validation</p>
            </div>
          </div>

          {/* Footer notice */}
          <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Ce reçu certifié tient lieu de justificatif de paiement. À conserver précieusement pour toute réclamation administrative ou académique.
          </div>
        </div>
      </div>
    </div>
  );
};
