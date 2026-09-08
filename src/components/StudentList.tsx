import React, { useState, useMemo } from 'react';
import { Etudiant, InstitutionSettings } from '../types';
import { formatCurrency, downloadCSV, formatDate } from '../services/api';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  CreditCard,
  Eye,
  Edit,
  Archive,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Printer,
  ChevronDown,
  Users,
  Plus,
} from 'lucide-react';

interface StudentListProps {
  students: Etudiant[];
  settings: InstitutionSettings;
  onOpenNewStudent: () => void;
  onSelectStudent: (student: Etudiant) => void;
  onEditStudent: (student: Etudiant) => void;
  onRecordPayment: (student: Etudiant) => void;
  onToggleArchive: (student: Etudiant) => void;
  onDeleteStudent: (student: Etudiant) => void;
  canManageStudents: boolean;
  canRecordPayments: boolean;
  isAdmin: boolean;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  settings,
  onOpenNewStudent,
  onSelectStudent,
  onEditStudent,
  onRecordPayment,
  onToggleArchive,
  onDeleteStudent,
  canManageStudents,
  canRecordPayments,
  isAdmin,
}) => {
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [formationFilter, setFormationFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [solvencyFilter, setSolvencyFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState<'actif' | 'archive' | 'tous'>('actif');

  const devise = settings.devise || 'FCFA';

  // Liste filtrée
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Statut actif/archivé
      if (statutFilter !== 'tous' && s.statut !== statutFilter) {
        return false;
      }

      // Recherche texte
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchMatricule = s.matricule?.toLowerCase().includes(q);
        const matchNom = s.nom?.toLowerCase().includes(q);
        const matchPrenom = s.prenom?.toLowerCase().includes(q);
        const matchTel = s.telephone?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        if (!matchMatricule && !matchNom && !matchPrenom && !matchTel && !matchEmail) {
          return false;
        }
      }

      // Formation
      if (formationFilter && s.formation !== formationFilter) {
        return false;
      }

      // Niveau
      if (niveauFilter && s.niveau !== niveauFilter) {
        return false;
      }

      // Solvabilité
      if (solvencyFilter && s.statutFinancier !== solvencyFilter) {
        return false;
      }

      return true;
    });
  }, [students, searchTerm, formationFilter, niveauFilter, solvencyFilter, statutFilter]);

  // Totaux de la sélection
  const totalFraisCohort = filteredStudents.reduce((acc, s) => acc + (s?.fraisFormation || 0), 0);
  const totalPayeCohort = filteredStudents.reduce((acc, s) => acc + (s?.totalPaye || 0), 0);
  const totalResteCohort = filteredStudents.reduce((acc, s) => acc + (s?.resteAPayer || 0), 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Sexe',
      'Téléphone',
      'Email',
      'Formation',
      'Niveau',
      'Année Académique',
      `Frais Total (${devise})`,
      `Déjà Payé (${devise})`,
      `Reste Dû (${devise})`,
      'Taux Règlement (%)',
      'Statut Solvabilité',
      'Statut Dossier',
    ];

    const rows = filteredStudents.map((s) => [
      s.matricule,
      s.nom,
      s.prenom,
      s.sexe,
      s.telephone,
      s.email,
      s.formation,
      s.niveau,
      s.anneeAcademique,
      String(s.fraisFormation),
      String(s.totalPaye || 0),
      String(s.resteAPayer || 0),
      `${s.tauxReglement || 0}%`,
      s.statutFinancier || '',
      s.statut,
    ]);

    downloadCSV(`listing-etudiants-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  const handlePrintListing = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Registre des Étudiants & Inscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des dossiers administratifs, scolarités et situations financières
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="print-students-listing-btn"
            onClick={handlePrintListing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Imprimer listing
          </button>

          <button
            id="export-students-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter CSV
          </button>

          {canManageStudents && (
            <button
              id="new-student-action-btn"
              onClick={onOpenNewStudent}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              + Nouvel Étudiant
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Recherche */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="student-search-filter-input"
              type="text"
              placeholder="Rechercher nom, matricule, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Formation */}
          <div>
            <select
              id="student-formation-filter-select"
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

          {/* Solvabilité */}
          <div>
            <select
              id="student-solvency-filter-select"
              value={solvencyFilter}
              onChange={(e) => setSolvencyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="">Tous les statuts de paiement</option>
              <option value="SOLVABLE">Solvable (100% payé)</option>
              <option value="PARTIEL">Paiement partiel (En cours)</option>
              <option value="NON_SOLVABLE">Non solvable (0% payé)</option>
            </select>
          </div>

          {/* Statut actif / archivé */}
          <div>
            <select
              id="student-status-filter-select"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700"
            >
              <option value="actif">Étudiants Actifs</option>
              <option value="archive">Dossiers Archivés</option>
              <option value="tous">Tous (Actifs & Archivés)</option>
            </select>
          </div>
        </div>

        {/* Quick summary line of current cohort */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span>
              <strong>{filteredStudents.length}</strong> étudiant(s) affiché(s)
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline">
              Frais cumulés : <strong>{formatCurrency(totalFraisCohort, devise)}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-indigo-900 font-bold">
              Total encaissé : {formatCurrency(totalPayeCohort, devise)}
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-rose-700 font-semibold">
              Reste à recouvrer : {formatCurrency(totalResteCohort, devise)}
            </span>
          </div>

          {(searchTerm || formationFilter || niveauFilter || solvencyFilter || statutFilter !== 'actif') && (
            <button
              id="reset-student-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setFormationFilter('');
                setNiveauFilter('');
                setSolvencyFilter('');
                setStatutFilter('actif');
              }}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Printable Listing Title (visible only during print) */}
      <div className="print-only hidden p-4 mb-4 border-b-2 border-slate-900">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold uppercase">{settings.nomEtablissement}</h1>
            <p className="text-xs text-slate-600">Listing officiel des étudiants - Année académique {settings.anneeEnCours}</p>
          </div>
          <div className="text-right text-xs">
            <p>Édité le {formatDate(new Date().toISOString())}</p>
            <p className="font-bold">{filteredStudents.length} étudiant(s) répertorié(s)</p>
          </div>
        </div>
      </div>

      {/* Main Student Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Aucun étudiant inscrit pour le moment</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Le registre académique est vierge. Cliquez sur le bouton ci-dessous pour enregistrer le premier dossier.
            </p>
            {canManageStudents && (
              <button
                id="empty-state-new-student-btn"
                onClick={onOpenNewStudent}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Inscrire un premier étudiant
              </button>
            )}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucun étudiant ne correspond aux critères</p>
            <p className="text-xs text-slate-400 mt-1">
              Modifiez vos mots-clés ou réinitialisez les filtres.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-bold">
                  <th className="p-3.5">Matricule</th>
                  <th className="p-3.5">Étudiant(e)</th>
                  <th className="p-3.5">Filière & Promotion</th>
                  <th className="p-3.5 text-right">Frais Scolarité</th>
                  <th className="p-3.5 text-right">Total Versé</th>
                  <th className="p-3.5 text-right">Reste Dû</th>
                  <th className="p-3.5 text-center">Progression</th>
                  <th className="p-3.5">Statut</th>
                  <th className="no-print p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isSolvable = s.statutFinancier === 'SOLVABLE';
                  const isPartiel = s.statutFinancier === 'PARTIEL';
                  const percent = s.tauxReglement || 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Matricule */}
                      <td className="p-3.5">
                        <button
                          onClick={() => onSelectStudent(s)}
                          className="font-mono font-bold text-xs text-indigo-600 hover:underline cursor-pointer"
                        >
                          {s.matricule}
                        </button>
                        {s.statut === 'archive' && (
                          <span className="block text-[9px] uppercase font-bold text-amber-600 mt-0.5">
                            Archivé
                          </span>
                        )}
                      </td>

                      {/* Étudiant */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {s.nom.slice(0, 1)}
                            {s.prenom.slice(0, 1)}
                          </div>
                          <div>
                            <button
                              onClick={() => onSelectStudent(s)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left block cursor-pointer text-xs"
                            >
                              {s.nom} {s.prenom}
                            </button>
                            <span className="text-[11px] text-slate-400 block">
                              {s.telephone || s.email || 'Sans contact'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Filière & Niveau */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {s.formation}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {s.niveau} ({s.anneeAcademique})
                        </span>
                      </td>

                      {/* Frais Scolarité */}
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {formatCurrency(s.fraisFormation, devise)}
                      </td>

                      {/* Total Payé */}
                      <td className="p-3.5 text-right font-bold text-indigo-900">
                        {formatCurrency(s.totalPaye, devise)}
                      </td>

                      {/* Reste Dû */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`font-bold ${
                            s.resteAPayer === 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(s.resteAPayer, devise)}
                        </span>
                      </td>

                      {/* Progression */}
                      <td className="p-3.5 text-center min-w-[100px]">
                        <span className="text-[10px] font-bold text-slate-600 block mb-1">
                          {percent}%
                        </span>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isSolvable
                                ? 'bg-emerald-500'
                                : isPartiel
                                ? 'bg-indigo-600'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Solvabilité */}
                      <td className="p-3.5">
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

                      {/* Actions */}
                      <td className="no-print p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`view-student-btn-${s.id}`}
                            onClick={() => onSelectStudent(s)}
                            title="Consulter la fiche complète"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canRecordPayments && (
                            <button
                              id={`record-payment-row-${s.id}`}
                              onClick={() => onRecordPayment(s)}
                              title="Encaisser un versement"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {canManageStudents && (
                            <button
                              id={`edit-student-row-${s.id}`}
                              onClick={() => onEditStudent(s)}
                              title="Modifier la fiche"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canManageStudents && (
                            <button
                              id={`archive-student-row-${s.id}`}
                              onClick={() => onToggleArchive(s)}
                              title={s.statut === 'archive' ? 'Réactiver' : 'Archiver'}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              id={`delete-student-row-${s.id}`}
                              onClick={() => onDeleteStudent(s)}
                              title="Supprimer définitivement"
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
    </div>
  );
};
