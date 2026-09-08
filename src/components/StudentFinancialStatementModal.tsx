import React from 'react';
import { Etudiant, Paiement, InstitutionSettings } from '../types';
import { formatCurrency, formatDate } from '../services/api';
import { Printer, X, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { MDSLogo } from './MDSLogo';

interface Props {
  isOpen?: boolean;
  student: Etudiant | null;
  payments: Paiement[];
  settings: InstitutionSettings;
  onClose: () => void;
}

export const StudentFinancialStatementModal: React.FC<Props> = ({
  isOpen = true,
  student,
  payments = [],
  settings,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  const devise = settings.devise || 'FCFA';
  const totalFrais = student?.fraisFormation || 0;
  const totalPaye = (payments || []).reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
  const resteAPayer = Math.max(0, totalFrais - totalPaye);
  const isSolvable = resteAPayer === 0 && totalFrais > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="financial-statement-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold">Fiche Financière & Situation Comptable</h3>
              <p className="text-xs text-slate-400">
                {student.nom} {student.prenom} ({student.matricule})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="print-statement-btn"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimer l état financier
            </button>
            <button
              id="close-statement-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="printable-sheet p-8 bg-white text-slate-900 font-sans text-sm">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6">
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
                <p className="text-xs text-slate-600">{settings.adresse} | Tél: {settings.telephone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-700 uppercase">
                  Service de la Comptabilité
                </span>
                <p className="text-xs text-slate-500 mt-2">
                  Date d émission : {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 underline decoration-blue-500 decoration-2 underline-offset-4">
              ÉTAT FINANCIER INDIVIDUEL DE L ÉTUDIANT
            </h2>
            <p className="text-xs text-slate-500 mt-1">Année académique : {student.anneeAcademique}</p>
          </div>

          {/* Student Profile Card */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <div>
              <p className="text-xs text-slate-500">Matricule :</p>
              <p className="font-mono font-bold text-slate-900">{student.matricule}</p>
              <p className="text-xs text-slate-500 mt-2">Nom et Prénom(s) :</p>
              <p className="font-bold text-slate-900">{student.nom} {student.prenom}</p>
              <p className="text-xs text-slate-500 mt-2">Date de naissance :</p>
              <p className="text-slate-800">{formatDate(student.dateNaissance)} ({student.sexe === 'M' ? 'Masculin' : 'Féminin'})</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Filière d étude :</p>
              <p className="font-semibold text-slate-900">{student.formation}</p>
              <p className="text-xs text-slate-500 mt-2">Niveau académique :</p>
              <p className="font-medium text-slate-800">{student.niveau}</p>
              <p className="text-xs text-slate-500 mt-2">Contact téléphonique :</p>
              <p className="text-slate-800">{student.telephone || 'Non renseigné'}</p>
            </div>
          </div>

          {/* Financial Summary Dashboard */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-slate-100 rounded-xl mb-6 text-center">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Frais Exigibles</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(totalFrais, devise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-600 uppercase tracking-wider block font-bold">Total Encaissé</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(totalPaye, devise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Reste à Régler</span>
              <span className={`font-bold text-sm ${resteAPayer === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatCurrency(resteAPayer, devise)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Statut Règlement</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full mt-1 ${
                  isSolvable
                    ? 'bg-emerald-100 text-emerald-800'
                    : totalPaye > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isSolvable ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> SOLVABLE (100%)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> {totalPaye > 0 ? 'PARTIELLEMENT À JOUR' : 'NON SOLVABLE'}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Detailed Payments Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Historique Chronologique des Règlements
            </h3>
            {payments.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
                Aucun versement n a été enregistré à ce jour pour cet étudiant.
              </div>
            ) : (
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-200/70 text-slate-800 font-bold">
                    <th className="border border-slate-200 p-2.5 text-left">N° Reçu</th>
                    <th className="border border-slate-200 p-2.5 text-left">Date</th>
                    <th className="border border-slate-200 p-2.5 text-left">Motif</th>
                    <th className="border border-slate-200 p-2.5 text-left">Mode</th>
                    <th className="border border-slate-200 p-2.5 text-left">Référence</th>
                    <th className="border border-slate-200 p-2.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 font-mono font-semibold text-slate-900">
                        {p.numeroRecu}
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-700">{formatDate(p.datePaiement)}</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{p.motif}</td>
                      <td className="border border-slate-200 p-2 text-slate-700">{p.modePaiement}</td>
                      <td className="border border-slate-200 p-2 font-mono text-[11px] text-slate-600">
                        {p.referencePaiement}
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-bold text-emerald-800">
                        {formatCurrency(p.montant, devise)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={5} className="border border-slate-200 p-2.5 text-right uppercase">
                      Total des Versements Enregistrés :
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-emerald-800 text-sm">
                      {formatCurrency(totalPaye, devise)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Certification notice & Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 mt-8 text-xs">
            <div>
              <p className="text-slate-600 leading-relaxed">
                Je soussigné, Responsable de la Comptabilité et de la Caisse, certifie que le présent état financier
                reflète fidèlement la situation comptable de l étudiant(e) à la date indiquée.
              </p>
              <p className="mt-4 font-bold text-slate-800">Fait à Abidjan, le {formatDate(new Date().toISOString())}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="font-bold text-slate-800 mb-1">{settings.directeurTitre}</p>
              <p className="text-slate-700 mb-8">{settings.directeurNom}</p>
              <div className="border border-slate-300 rounded-lg p-2 text-center text-[10px] text-slate-500 w-44">
                [ Cachet & Signature de l Établissement ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
