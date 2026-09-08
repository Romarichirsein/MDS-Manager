import React, { useState, useMemo } from 'react';
import { Etudiant, InstitutionSettings, Paiement } from '../types';
import { formatCurrency, downloadCSV, formatDate } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Printer,
  Download,
  Send,
  CreditCard,
  Eye,
  FileText,
  Mail,
  Copy,
  Check,
} from 'lucide-react';

interface SolvencyViewProps {
  students: Etudiant[];
  settings: InstitutionSettings;
  onSelectStudent: (student: Etudiant) => void;
  onRecordPayment: (student: Etudiant) => void;
  canRecordPayments: boolean;
}

export const SolvencyView: React.FC<SolvencyViewProps> = ({
  students,
  settings,
  onSelectStudent,
  onRecordPayment,
  canRecordPayments,
}) => {
  const [activeTab, setActiveTab] = useState<'tous_debiteurs' | 'zero_paiement' | 'partiel' | 'solvables'>('tous_debiteurs');
  const [searchTerm, setSearchTerm] = useState('');
  const [formationFilter, setFormationFilter] = useState('');

  // Modal de lettre de rappel / relance
  const [relanceStudent, setRelanceStudent] = useState<Etudiant | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const devise = settings.devise || 'FCFA';

  // Séparation selon la solvabilité (uniquement étudiants actifs)
  const activeStudents = useMemo(() => students.filter((s) => s.statut === 'actif'), [students]);

  const solvables = useMemo(() => activeStudents.filter((s) => s.statutFinancier === 'SOLVABLE'), [activeStudents]);
  const nonSolvables = useMemo(() => activeStudents.filter((s) => s.statutFinancier !== 'SOLVABLE'), [activeStudents]);
  const partiels = useMemo(() => activeStudents.filter((s) => s.statutFinancier === 'PARTIEL'), [activeStudents]);
  const zeroPaiement = useMemo(() => activeStudents.filter((s) => s.statutFinancier === 'NON_SOLVABLE'), [activeStudents]);

  // Montant total des impayés
  const totalImpayes = nonSolvables.reduce((acc, s) => acc + (s?.resteAPayer || 0), 0);
  const totalEncaisse = activeStudents.reduce((acc, s) => acc + (s?.totalPaye || 0), 0);
  const totalExigible = activeStudents.reduce((acc, s) => acc + (s?.fraisFormation || 0), 0);
  const tauxRecouvrement = totalExigible > 0 ? Math.round((totalEncaisse / totalExigible) * 100) : 100;

  // Liste selon l'onglet courant
  const currentList = useMemo(() => {
    let list: Etudiant[] = [];
    if (activeTab === 'tous_debiteurs') list = nonSolvables;
    else if (activeTab === 'zero_paiement') list = zeroPaiement;
    else if (activeTab === 'partiel') list = partiels;
    else if (activeTab === 'solvables') list = solvables;

    return list.filter((s) => {
      if (formationFilter && s.formation !== formationFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          s.matricule.toLowerCase().includes(q) ||
          s.nom.toLowerCase().includes(q) ||
          s.prenom.toLowerCase().includes(q) ||
          s.telephone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeTab, nonSolvables, zeroPaiement, partiels, solvables, formationFilter, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Filière',
      'Niveau',
      'Téléphone',
      `Frais Total (${devise})`,
      `Montant Réglé (${devise})`,
      `Reste Dû (${devise})`,
      'Taux Règlement',
      'Situation Solvabilité',
    ];

    const rows = currentList.map((s) => [
      s.matricule,
      s.nom,
      s.prenom,
      s.formation,
      s.niveau,
      s.telephone || '',
      String(s.fraisFormation),
      String(s.totalPaye || 0),
      String(s.resteAPayer || 0),
      `${s.tauxReglement || 0}%`,
      s.statutFinancier || '',
    ]);

    downloadCSV(`etat-solvabilite-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  // Copier le modèle de notification de rappel
  const handleCopyNotice = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Gestion de la Solvabilité & Recouvrement des Frais
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des étudiants à jour, des reliquats d impayés et production des états financiers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="print-solvency-btn"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Imprimer état officiel
          </button>
          <button
            id="export-solvency-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI Cards de Solvabilité */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total des impayés */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Impayés à Recouvrer
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight truncate">
              {formatCurrency(totalImpayes, devise)}
            </h2>
            <span className="text-rose-600 text-xs font-bold shrink-0">
              {nonSolvables.length} débiteurs
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Sur {activeStudents.length} étudiants inscrits actifs
          </p>
        </div>

        {/* Étudiants Solvables (100%) */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Solvables (100%)
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-3xl font-black text-emerald-600 tracking-tight">
              {solvables.length}
            </h2>
            <span className="text-slate-400 text-xs font-medium">
              {activeStudents.length > 0 ? Math.round((solvables.length / activeStudents.length) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-2">
            Frais de scolarité intégralement soldés
          </p>
        </div>

        {/* Paiements Partiels */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Paiements Partiels (Acomptes)
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-3xl font-black text-indigo-900 tracking-tight">
              {partiels.length}
            </h2>
            <span className="text-indigo-600 text-xs font-bold">
              En cours
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Ont effectué au moins 1 versement
          </p>
        </div>

        {/* Zéro Paiement */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Zéro Paiement Enregistré
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {zeroPaiement.length}
            </h2>
            <span className="text-rose-600 text-xs font-bold">
              Priorité
            </span>
          </div>
          <p className="text-[11px] text-rose-700 font-medium mt-2">
            Aucun versement de scolarité reçu
          </p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Navigation par Onglets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="tab-debiteurs-btn"
              onClick={() => setActiveTab('tous_debiteurs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'tous_debiteurs'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous Non à Jour ({nonSolvables.length})
            </button>

            <button
              id="tab-partiel-btn"
              onClick={() => setActiveTab('partiel')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'partiel'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Partiellement Payés ({partiels.length})
            </button>

            <button
              id="tab-zero-btn"
              onClick={() => setActiveTab('zero_paiement')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'zero_paiement'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Zéro Paiement ({zeroPaiement.length})
            </button>

            <button
              id="tab-solvables-btn"
              onClick={() => setActiveTab('solvables')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'solvables'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Solvables (100%) ({solvables.length})
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Taux de recouvrement : <strong className="text-indigo-900">{tauxRecouvrement}%</strong>
          </span>
        </div>

        {/* Filtres internes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="solvency-search-input"
              type="text"
              placeholder="Filtrer par nom, matricule, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              id="solvency-formation-filter-select"
              value={formationFilter}
              onChange={(e) => setFormationFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700"
            >
              <option value="">Toutes les filières</option>
              {settings.filières.map((f) => (
                <option key={f.nom} value={f.nom}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* En-tête imprimable */}
      <div className="print-only hidden p-4 mb-4 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold uppercase">{settings.nomEtablissement}</h1>
            <p className="text-xs text-slate-600">
              État de la Solvabilité & Suivi des Impayés - Année académique {settings.anneeEnCours}
            </p>
          </div>
          <div className="text-right text-xs">
            <p>Date d édition : {formatDate(new Date().toISOString())}</p>
            <p className="font-bold text-rose-700">Total impayés : {formatCurrency(totalImpayes, devise)}</p>
          </div>
        </div>
      </div>

      {/* Table des Étudiants selon Solvabilité */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-slate-800">Aucune donnée de scolarité à analyser</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              L état de solvabilité sera automatiquement généré en temps réel dès l inscription des premiers étudiants.
            </p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Aucun étudiant dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-bold">
                  <th className="p-3.5">Matricule</th>
                  <th className="p-3.5">Étudiant(e)</th>
                  <th className="p-3.5">Filière / Niveau</th>
                  <th className="p-3.5">Téléphone</th>
                  <th className="p-3.5 text-right">Frais Scolarité</th>
                  <th className="p-3.5 text-right">Déjà Réglé</th>
                  <th className="p-3.5 text-right">Montant Dû</th>
                  <th className="p-3.5 text-center">Taux</th>
                  <th className="no-print p-3.5 text-right">Opérations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((s) => {
                  const isSolvable = s.statutFinancier === 'SOLVABLE';
                  const percent = s.tauxReglement || 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-xs text-indigo-600">{s.matricule}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => onSelectStudent(s)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left block cursor-pointer"
                        >
                          {s.nom} {s.prenom}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{s.formation}</span>
                        <span className="text-[11px] text-slate-400 block">{s.niveau}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{s.telephone || '-'}</td>
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {formatCurrency(s.fraisFormation, devise)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-indigo-900">
                        {formatCurrency(s.totalPaye, devise)}
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`font-bold ${
                            s.resteAPayer === 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(s.resteAPayer, devise)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSolvable
                              ? 'bg-emerald-100 text-emerald-700'
                              : percent > 0
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {percent}%
                        </span>
                      </td>
                      <td className="no-print p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canRecordPayments && s.resteAPayer && s.resteAPayer > 0 ? (
                            <button
                              id={`solvency-pay-btn-${s.id}`}
                              onClick={() => onRecordPayment(s)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Encaisser
                            </button>
                          ) : null}

                          {s.resteAPayer && s.resteAPayer > 0 ? (
                            <button
                              id={`solvency-relance-btn-${s.id}`}
                              onClick={() => setRelanceStudent(s)}
                              title="Générer un avis de relance"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          ) : null}

                          <button
                            id={`solvency-view-btn-${s.id}`}
                            onClick={() => onSelectStudent(s)}
                            title="Voir dossier"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Relance / Lettre de Rappel de Paiement */}
      {relanceStudent && (
        <div
          id="relance-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-amber-900 text-white">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold">Avis de Relance & Rappel de Frais</h3>
              </div>
              <button
                onClick={() => setRelanceStudent(null)}
                className="p-1 text-amber-300 hover:text-white rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p>
                  <strong>Destinataire :</strong> {relanceStudent.nom} {relanceStudent.prenom} (Matricule : {relanceStudent.matricule})
                </p>
                <p>
                  <strong>Montant restant exigible :</strong>{' '}
                  <span className="font-extrabold text-rose-700">
                    {formatCurrency(relanceStudent.resteAPayer, devise)}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Texte officiel du rappel :
                </label>
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
{`AVIS DE RAPPEL DE SCOLARITÉ - ${settings.nomEtablissement}
Année Académique : ${settings.anneeEnCours}

Cher(e) ${relanceStudent.nom} ${relanceStudent.prenom} (Matricule: ${relanceStudent.matricule}),
Filière : ${relanceStudent.formation} (${relanceStudent.niveau})

Le service de la comptabilité vous informe que votre situation financière présente à ce jour un solde débiteur de ${formatCurrency(relanceStudent.resteAPayer, devise)}.

Frais exigibles : ${formatCurrency(relanceStudent.fraisFormation, devise)}
Montant déjà réglé : ${formatCurrency(relanceStudent.totalPaye, devise)}
Reste à régulariser : ${formatCurrency(relanceStudent.resteAPayer, devise)}

Merci de bien vouloir vous rapprocher de la caisse centrale de l'établissement ou d'effectuer votre règlement par virement ou Mobile Money dans les meilleurs délais pour régulariser votre inscription.

Contact Caisse : ${settings.telephone}
Email : ${settings.email}`}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  id="copy-notice-btn"
                  onClick={() =>
                    handleCopyNotice(
                      `AVIS DE RAPPEL DE SCOLARITÉ - ${settings.nomEtablissement}\nCher(e) ${relanceStudent.nom} ${relanceStudent.prenom} (${relanceStudent.matricule}),\nVotre solde restant à régler est de ${formatCurrency(relanceStudent.resteAPayer, devise)}.\nMerci de régulariser auprès de la caisse.\nContact: ${settings.telephone}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {copiedNotice ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedNotice ? 'Texte copié !' : 'Copier pour SMS/WhatsApp'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRelanceStudent(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
