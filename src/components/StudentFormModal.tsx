import React, { useState, useEffect } from 'react';
import { Etudiant, InstitutionSettings, ModePaiement } from '../types';
import { api, formatCurrency } from '../services/api';
import { X, UserPlus, Save, AlertCircle, CreditCard, Sparkles } from 'lucide-react';

interface StudentFormModalProps {
  student?: Etudiant | null;
  studentToEdit?: Etudiant | null;
  settings: InstitutionSettings;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: Etudiant, paymentCreated?: any) => void;
}

const NIVEAUX = [
  'Licence 1 (L1)',
  'Licence 2 (L2)',
  'Licence 3 (L3)',
  'Master 1 (M1)',
  'Master 2 (M2)',
  'Doctorat (D1)',
];

const MODES: ModePaiement[] = [
  'Espèces',
  'Virement bancaire',
  'Chèque',
  'Mobile Money',
  'Carte Bancaire',
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  studentToEdit,
  settings,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const activeStudent = studentToEdit || student;
  const isEditing = Boolean(activeStudent);

  // Données de base
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');

  // Données académiques
  const [formation, setFormation] = useState(settings.filières[0]?.nom || 'Soins Infirmiers & Obstétricaux');
  const [niveau, setNiveau] = useState(NIVEAUX[0]);
  const [anneeAcademique, setAnneeAcademique] = useState(settings.anneeEnCours);
  const [fraisFormation, setFraisFormation] = useState<number>(
    (settings.filières[0] as any)?.fraisDefaut || (settings.filières[0] as any)?.fraisParDefaut || 650000
  );
  const [remarques, setRemarques] = useState('');

  // Premier acompte optionnel (pour nouvelle inscription)
  const [enregistrerAcompte, setEnregistrerAcompte] = useState(false);
  const [montantAcompte, setMontantAcompte] = useState<number>(0);
  const [modeAcompte, setModeAcompte] = useState<ModePaiement>('Espèces');
  const [refAcompte, setRefAcompte] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeStudent) {
      setMatricule(activeStudent.matricule);
      setNom(activeStudent.nom);
      setPrenom(activeStudent.prenom);
      setSexe(activeStudent.sexe);
      setDateNaissance(activeStudent.dateNaissance || '');
      setTelephone(activeStudent.telephone || '');
      setEmail(activeStudent.email || '');
      setAdresse(activeStudent.adresse || '');
      setFormation(activeStudent.formation);
      setNiveau(activeStudent.niveau);
      setAnneeAcademique(activeStudent.anneeAcademique || settings.anneeEnCours);
      setFraisFormation(activeStudent.fraisFormation || 0);
      setRemarques(activeStudent.remarques || '');
      setEnregistrerAcompte(false);
    } else {
      // Préparer un matricule automatique
      const currentYear = new Date().getFullYear();
      const randomSeq = Math.floor(100 + Math.random() * 900);
      setMatricule(`ETU-${currentYear}-${randomSeq}`);
      setNom('');
      setPrenom('');
      setSexe('M');
      setDateNaissance('');
      setTelephone('');
      setEmail('');
      setAdresse('');
      const defaultFiliere = settings.filières[0]?.nom || 'Soins Infirmiers & Obstétricaux';
      setFormation(defaultFiliere);
      setNiveau(NIVEAUX[0]);
      setAnneeAcademique(settings.anneeEnCours);
      const defaultFee = (settings.filières[0] as any)?.fraisDefaut || (settings.filières[0] as any)?.fraisParDefaut || 650000;
      setFraisFormation(defaultFee);
      setRemarques('');
      setEnregistrerAcompte(false);
      setMontantAcompte(0);
      setRefAcompte('');
    }
  }, [student, settings]);

  // Ajustement automatique des frais lors du changement de filière
  const handleFormationChange = (newFiliere: string) => {
    setFormation(newFiliere);
    if (!isEditing) {
      const match = settings.filières.find((f) => f.nom === newFiliere);
      if (match) {
        const fee = (match as any).fraisDefaut || (match as any).fraisParDefaut || 650000;
        setFraisFormation(fee);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nom.trim() || !prenom.trim()) {
      setError('Veuillez renseigner le nom et le prénom de l étudiant.');
      return;
    }

    if (fraisFormation <= 0) {
      setError('Le montant total des frais de formation doit être supérieur à zéro.');
      return;
    }

    if (!isEditing && enregistrerAcompte) {
      if (montantAcompte <= 0) {
        setError('Le montant de l acompte doit être supérieur à 0.');
        return;
      }
      if (montantAcompte > fraisFormation) {
        setError('L acompte ne peut pas excéder le montant total de la formation.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing && activeStudent) {
        const updated = await api.updateStudent(activeStudent.id, {
          matricule,
          nom,
          prenom,
          sexe,
          dateNaissance,
          telephone,
          email,
          adresse,
          formation,
          niveau,
          anneeAcademique,
          fraisFormation: Number(fraisFormation),
          remarques,
        });
        onSuccess(updated);
      } else {
        const payload: any = {
          matricule,
          nom,
          prenom,
          sexe,
          dateNaissance,
          telephone,
          email,
          adresse,
          formation,
          niveau,
          anneeAcademique,
          fraisFormation: Number(fraisFormation),
          remarques,
        };

        if (enregistrerAcompte && montantAcompte > 0) {
          payload.premierPaiement = {
            montant: Number(montantAcompte),
            modePaiement: modeAcompte,
            referencePaiement: refAcompte || `AC-${Date.now()}`,
          };
        }

        const res = await api.createStudent(payload);
        onSuccess(res.student, res.payment);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="student-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Modifier la Fiche Étudiant' : 'Nouvelle Inscription Administrative'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? `Matricule ${student?.matricule}`
                  : 'Enregistrement de l étudiant et paramétrage des frais'}
              </p>
            </div>
          </div>
          <button
            id="close-student-form-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identification & État Civil */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                1. Identification & État Civil
              </h3>
              {!isEditing && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" /> Matricule auto-généré
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Matricule Unique</label>
                <input
                  id="student-matricule-input"
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom de famille *</label>
                <input
                  id="student-nom-input"
                  type="text"
                  placeholder="ex: KOUAME"
                  value={nom}
                  onChange={(e) => setNom(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Prénom(s) *</label>
                <input
                  id="student-prenom-input"
                  type="text"
                  placeholder="ex: Stéphane Kevin"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Genre / Sexe</label>
                <select
                  id="student-sexe-select"
                  value={sexe}
                  onChange={(e) => setSexe(e.target.value as 'M' | 'F')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="M">Masculin (M)</option>
                  <option value="F">Féminin (F)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date de Naissance</label>
                <input
                  id="student-dob-input"
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone de contact</label>
                <input
                  id="student-tel-input"
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Adresse Email</label>
                <input
                  id="student-email-input"
                  type="email"
                  placeholder="etudiant@domaine.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Lieu de résidence / Adresse</label>
                <input
                  id="student-adresse-input"
                  type="text"
                  placeholder="Commune, Ville"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Données Académiques & Frais */}
          <div>
            <div className="border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                2. Formation, Niveau & Frais de Scolarité
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Filière / Spécialité *</label>
                <select
                  id="student-formation-select"
                  value={formation}
                  onChange={(e) => handleFormationChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                >
                  {settings.filières.map((f) => (
                    <option key={f.nom} value={f.nom}>
                      {f.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Niveau / Classe *</label>
                <select
                  id="student-niveau-select"
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                >
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Année Académique</label>
                <input
                  id="student-annee-input"
                  type="text"
                  value={anneeAcademique}
                  onChange={(e) => setAnneeAcademique(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Montant Total des Frais ({settings.devise}) *
                </label>
                <input
                  id="student-frais-input"
                  type="number"
                  min="0"
                  step="10000"
                  value={fraisFormation}
                  onChange={(e) => setFraisFormation(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Observations / Remarques</label>
                <textarea
                  id="student-remarques-input"
                  rows={2}
                  placeholder="Notes administratives particulières..."
                  value={remarques}
                  onChange={(e) => setRemarques(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Premier Encaissement Immédiat (Uniquement en création) */}
          {!isEditing && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="enable-acompte-checkbox"
                    type="checkbox"
                    checked={enregistrerAcompte}
                    onChange={(e) => setEnregistrerAcompte(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Encaisser un premier acompte lors de l inscription
                  </span>
                </label>
                {enregistrerAcompte && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Générera un reçu officiel N° REC
                  </span>
                )}
              </div>

              {enregistrerAcompte && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/60">
                  <div>
                    <label className="block text-xs font-medium text-emerald-900 mb-1">
                      Montant Versé ({settings.devise}) *
                    </label>
                    <input
                      id="acompte-montant-input"
                      type="number"
                      min="1000"
                      max={fraisFormation}
                      step="5000"
                      value={montantAcompte}
                      onChange={(e) => setMontantAcompte(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold bg-white text-emerald-950 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-900 mb-1">Mode de Paiement</label>
                    <select
                      id="acompte-mode-select"
                      value={modeAcompte}
                      onChange={(e) => setModeAcompte(e.target.value as ModePaiement)}
                      className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-900 mb-1">Réf. Transaction</label>
                    <input
                      id="acompte-ref-input"
                      type="text"
                      placeholder="ex: VIR-8921 ou ESP"
                      value={refAcompte}
                      onChange={(e) => setRefAcompte(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-3 text-xs text-emerald-800 bg-white p-2.5 rounded-lg border border-emerald-200 flex justify-between items-center">
                    <span>
                      Reste à devoir après versement :{' '}
                      <strong>{formatCurrency(Math.max(0, fraisFormation - montantAcompte), settings.devise)}</strong>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Taux de couverture : {Math.round((montantAcompte / (fraisFormation || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              id="cancel-student-form-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="submit-student-form-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading
                ? 'Traitement en cours...'
                : isEditing
                ? 'Enregistrer les modifications'
                : 'Valider et inscrire l étudiant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
