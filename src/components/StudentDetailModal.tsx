import React, { useState, useEffect } from 'react';
import { Etudiant, Paiement, InstitutionSettings } from '../types';
import { api, formatCurrency, formatDate } from '../services/api';
import {
  X,
  CreditCard,
  Printer,
  Edit,
  Archive,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  FileText,
  CheckCircle,
  AlertTriangle,
  Receipt,
  UserCheck,
} from 'lucide-react';

interface StudentDetailModalProps {
  studentId: string;
  settings: InstitutionSettings;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Etudiant) => void;
  onRecordPayment: (student: Etudiant) => void;
  onViewReceipt: (payment: Paiement, student: Etudiant) => void;
  onPrintStatement: (student: Etudiant, payments: Paiement[]) => void;
  onStudentUpdated: (updated: Etudiant) => void;
  canRecordPayments: boolean;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  settings,
  isOpen,
  onClose,
  onEdit,
  onRecordPayment,
  onViewReceipt,
  onPrintStatement,
  onStudentUpdated,
  canRecordPayments,
}) => {
  const [student, setStudent] = useState<(Etudiant & { payments: Paiement[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentById(studentId);
      setStudent(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger la fiche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchDetails();
    }
  }, [studentId]);

  const handleToggleArchive = async () => {
    if (!student) return;
    try {
      const updated = await api.toggleArchiveStudent(student.id);
      setStudent({ ...student, ...updated });
      onStudentUpdated(updated);
    } catch (err: any) {
      alert('Erreur lors de l archivage');
    }
  };

  const devise = settings.devise || 'FCFA';

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-600 font-medium">Chargement du dossier étudiant...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
          <p className="text-sm text-slate-800 font-bold mb-3">{error || 'Étudiant introuvable'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const isSolvable = student.statutFinancier === 'SOLVABLE';
  const isPartiel = student.statutFinancier === 'PARTIEL';
  const progressPercent = student.tauxReglement || 0;

  return (
    <div
      id="student-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
              {student.nom.slice(0, 1)}
              {student.prenom.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  {student.nom} {student.prenom}
                </h2>
                <span className="font-mono text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md font-semibold">
                  {student.matricule}
                </span>
                {student.statut === 'archive' && (
                  <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">
                    Archivé
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {student.formation} • {student.niveau} ({student.anneeAcademique})
              </p>
            </div>
          </div>
          <button
            id="close-student-detail-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              {canRecordPayments && (
                <button
                  id="detail-record-payment-btn"
                  onClick={() => onRecordPayment(student)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Encaisser un versement
                </button>
              )}
              <button
                id="detail-print-statement-btn"
                onClick={() => onPrintStatement(student, student.payments || [])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Fiche Financière & Attestation
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="detail-edit-student-btn"
                onClick={() => onEdit(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                Modifier la fiche
              </button>
              <button
                id="detail-toggle-archive-btn"
                onClick={handleToggleArchive}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer ${
                  student.statut === 'archive'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                {student.statut === 'archive' ? 'Réactiver' : 'Archiver'}
              </button>
            </div>
          </div>

          {/* Financial Summary KPI Block */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Situation Financière & Solvabilité
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                  isSolvable
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isPartiel
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isSolvable ? (
                  <>
                    <CheckCircle className="w-3 h-3" /> Solvable (100% Réglé)
                  </>
                ) : isPartiel ? (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Acompte versé ({progressPercent}%)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Non Solvable (0% Réglé)
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Montant Exigé</p>
                <p className="text-base font-bold text-white">
                  {formatCurrency(student?.fraisFormation, devise)}
                </p>
              </div>
              <div className="border-x border-slate-800">
                <p className="text-[11px] text-emerald-400 uppercase tracking-wider mb-0.5">Déjà Réglé</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {formatCurrency(student?.totalPaye, devise)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Reste à Payer</p>
                <p
                  className={`text-base font-extrabold ${
                    student.resteAPayer === 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatCurrency(student.resteAPayer, devise)}
                </p>
              </div>
            </div>

            {/* Jauge de progression */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Progression du règlement</span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isSolvable ? 'bg-emerald-500' : isPartiel ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Student Profile Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                Parcours Académique
              </h3>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block">Filière :</span>
                  <span className="font-semibold text-slate-900">{student.formation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Niveau :</span>
                  <span className="font-semibold text-slate-900">{student.niveau}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Année académique :</span>
                  <span className="font-semibold text-slate-900">{student.anneeAcademique}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date d inscription :</span>
                  <span className="font-semibold text-slate-900">{formatDate(student.dateInscription)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Coordonnées & Contact
              </h3>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.email || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.adresse || 'Non renseignée'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Né(e) le {formatDate(student.dateNaissance)} ({student.sexe === 'M' ? 'Masculin' : 'Féminin'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {student.remarques && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Notes administratives :</span>
              <p>{student.remarques}</p>
            </div>
          )}

          {/* Payment History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Historique des Paiements ({student.payments?.length || 0})
              </h3>
              {canRecordPayments && (
                <button
                  id="detail-add-payment-link"
                  onClick={() => onRecordPayment(student)}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  + Enregistrer un versement
                </button>
              )}
            </div>

            {student.payments && student.payments.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                      <th className="p-3">N° Reçu</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Motif</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Référence</th>
                      <th className="p-3 text-right">Montant</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{pay.numeroRecu}</td>
                        <td className="p-3 text-slate-600">{formatDate(pay.datePaiement)}</td>
                        <td className="p-3 font-medium text-slate-800">{pay.motif}</td>
                        <td className="p-3 text-slate-600">{pay.modePaiement}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">{pay.referencePaiement}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-700">
                          {formatCurrency(pay.montant, devise)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            id={`view-receipt-row-${pay.id}`}
                            onClick={() => onViewReceipt(pay, student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3 h-3" /> Reçu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
                Aucun versement n a encore été effectué pour cet étudiant.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
