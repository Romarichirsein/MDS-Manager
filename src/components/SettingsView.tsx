import React, { useState } from 'react';
import { InstitutionSettings, FiliereConfig } from '../types';
import { api, formatCurrency } from '../services/api';
import {
  getStoredSanityConfig,
  saveStoredSanityConfig,
  testSanityConnection,
  SanityConfig,
} from '../services/sanity';
import {
  Settings as SettingsIcon,
  Save,
  Building2,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Coins,
  ShieldCheck,
  Database,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface SettingsViewProps {
  settings: InstitutionSettings;
  onUpdateSettings: (newSettings: InstitutionSettings) => void;
  isAdmin: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  isAdmin,
}) => {
  const [formData, setFormData] = useState<InstitutionSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Nouvelles filières
  const [newFiliereNom, setNewFiliereNom] = useState('');
  const [newFiliereFrais, setNewFiliereFrais] = useState(600000);

  // Configuration Sanity CMS
  const [sanityConfig, setSanityConfig] = useState<SanityConfig>(() => getStoredSanityConfig());
  const [sanityTesting, setSanityTesting] = useState(false);
  const [sanityResult, setSanityResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSanity = async () => {
    setSanityTesting(true);
    setSanityResult(null);
    try {
      saveStoredSanityConfig(sanityConfig);
      const res = await testSanityConnection(sanityConfig);
      setSanityResult(res);
    } catch (err: any) {
      setSanityResult({
        success: false,
        message: err.message || 'Erreur de connexion à Sanity.',
      });
    } finally {
      setSanityTesting(false);
    }
  };

  const handleSaveSanity = () => {
    saveStoredSanityConfig(sanityConfig);
    setSanityResult({
      success: true,
      message: 'Paramètres Sanity enregistrés avec succès dans le stockage local.',
    });
  };

  const [syncingSanity, setSyncingSanity] = useState(false);
  const handleSyncSanity = async () => {
    setSyncingSanity(true);
    setSanityResult(null);
    try {
      saveStoredSanityConfig(sanityConfig);
      const res = await fetch('/api/sanity/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanityConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSanityResult({
          success: true,
          message: data.message || 'Synchronisation vers Sanity réussie !',
        });
      } else {
        setSanityResult({
          success: false,
          message: data.message || 'Erreur lors de la synchronisation Sanity.',
        });
      }
    } catch (err: any) {
      setSanityResult({
        success: false,
        message: err.message || 'Impossible de joindre le serveur pour synchroniser Sanity.',
      });
    } finally {
      setSyncingSanity(false);
    }
  };

  const handleAddFiliere = () => {
    if (!newFiliereNom.trim()) return;
    const exists = formData.filières.some(
      (f) => f.nom.toLowerCase() === newFiliereNom.trim().toLowerCase()
    );
    if (exists) {
      alert('Cette filière existe déjà.');
      return;
    }
    const updated = [
      ...formData.filières,
      { nom: newFiliereNom.trim(), fraisDefaut: Number(newFiliereFrais) },
    ];
    setFormData({ ...formData, filières: updated });
    setNewFiliereNom('');
    setNewFiliereFrais(600000);
  };

  const handleRemoveFiliere = (index: number) => {
    if (formData.filières.length <= 1) {
      alert('Au moins une filière doit rester configurée.');
      return;
    }
    const updated = formData.filières.filter((_, i) => i !== index);
    setFormData({ ...formData, filières: updated });
  };

  const handleUpdateFiliereFrais = (index: number, frais: number) => {
    const updated = [...formData.filières];
    updated[index].fraisDefaut = Number(frais);
    setFormData({ ...formData, filières: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Seul un administrateur peut modifier les paramètres généraux.');
      return;
    }
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.updateSettings(formData);
      onUpdateSettings(res);
      setSuccessMsg('Paramètres institutionnels mis à jour avec succès.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-700" />
            Configuration Institutionnelle & Académique
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Paramètres d en-tête des reçus officiels, année scolaire en cours et barème des filières
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Mode Consultation (Lecture seule)
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identité de l'établissement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Identité de l Établissement (Affichage Reçus & Relevés)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Raison Sociale / Nom Officiel *
              </label>
              <input
                id="settings-nom-input"
                type="text"
                disabled={!isAdmin}
                value={formData.nomEtablissement}
                onChange={(e) => setFormData({ ...formData, nomEtablissement: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Année Académique Active *
              </label>
              <input
                id="settings-annee-input"
                type="text"
                disabled={!isAdmin}
                value={formData.anneeEnCours}
                onChange={(e) => setFormData({ ...formData, anneeEnCours: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Devise Monétaire *
              </label>
              <input
                id="settings-devise-input"
                type="text"
                disabled={!isAdmin}
                value={formData.devise}
                onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Téléphone de Contact / Caisse
              </label>
              <input
                id="settings-tel-input"
                type="text"
                disabled={!isAdmin}
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Comptabilité / Scolarité
              </label>
              <input
                id="settings-email-input"
                type="email"
                disabled={!isAdmin}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Adresse Géographique
              </label>
              <input
                id="settings-adresse-input"
                type="text"
                disabled={!isAdmin}
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mention de Pied de Page sur les Reçus Officiels
              </label>
              <input
                id="settings-mention-input"
                type="text"
                disabled={!isAdmin}
                value={formData.mentionBasPageRecu}
                onChange={(e) => setFormData({ ...formData, mentionBasPageRecu: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Configuration des Filières et Frais de Scolarité */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            Catalogue des Filières & Barème Standard des Frais
          </h2>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Intitulé de la Filière</th>
                  <th className="p-3 text-right">Frais Standards Annuels</th>
                  {isAdmin && <th className="p-3 text-center w-16">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.filières.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{f.nom}</td>
                    <td className="p-3 text-right">
                      {isAdmin ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={f.fraisDefaut}
                            onChange={(e) => handleUpdateFiliereFrais(idx, Number(e.target.value))}
                            className="w-32 px-2 py-1 text-right text-xs font-bold border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-slate-500">{formData.devise}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">
                          {formatCurrency(f.fraisDefaut, formData.devise)}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFiliere(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-2 text-xs">
              <input
                id="new-filiere-nom-input"
                type="text"
                placeholder="Nouvelle filière (ex: Mastère Cybersécurité)"
                value={newFiliereNom}
                onChange={(e) => setNewFiliereNom(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
              />
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <input
                  id="new-filiere-frais-input"
                  type="number"
                  placeholder="Frais annuels"
                  min="0"
                  step="10000"
                  value={newFiliereFrais}
                  onChange={(e) => setNewFiliereFrais(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden text-right font-bold"
                />
                <span className="text-slate-500 text-xs">{formData.devise}</span>
              </div>
              <button
                id="add-filiere-btn"
                type="button"
                onClick={handleAddFiliere}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          )}
        </div>

        {/* Section Intégration Sanity CMS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Cloud className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Connexion Sanity CMS
                </h3>
                <p className="text-xs text-slate-500">
                  Synchronisation cloud des formations, étudiants et états financiers
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                sanityConfig.projectId
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {sanityConfig.projectId ? 'Configuré' : 'En attente d informations'}
            </span>
          </div>

          {sanityResult && (
            <div
              className={`mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                sanityResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {sanityResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{sanityResult.message}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Project ID Sanity *
              </label>
              <input
                id="sanity-project-id"
                type="text"
                value={sanityConfig.projectId}
                onChange={(e) =>
                  setSanityConfig({ ...sanityConfig, projectId: e.target.value })
                }
                placeholder="ex: abc123xyz"
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Trouvez votre Project ID dans sanity.io/manage
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Dataset Sanity
              </label>
              <input
                id="sanity-dataset"
                type="text"
                value={sanityConfig.dataset}
                onChange={(e) =>
                  setSanityConfig({ ...sanityConfig, dataset: e.target.value })
                }
                placeholder="production"
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Par défaut : production
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Version API Sanity
              </label>
              <input
                id="sanity-api-version"
                type="text"
                value={sanityConfig.apiVersion}
                onChange={(e) =>
                  setSanityConfig({ ...sanityConfig, apiVersion: e.target.value })
                }
                placeholder="2024-03-01"
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Sanity API Token (Écriture optionnelle)
              </label>
              <input
                id="sanity-token"
                type="password"
                value={sanityConfig.token || ''}
                onChange={(e) =>
                  setSanityConfig({ ...sanityConfig, token: e.target.value })
                }
                placeholder="sk..."
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Requis uniquement pour pousser les écritures vers Sanity
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Types de documents gérés : student, payment, institutionSettings</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="test-sanity-btn"
                  onClick={handleTestSanity}
                  disabled={sanityTesting || !sanityConfig.projectId}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sanityTesting ? 'animate-spin' : ''}`} />
                  {sanityTesting ? 'Test en cours...' : 'Tester la connexion'}
                </button>
                <button
                  type="button"
                  id="sync-sanity-btn"
                  onClick={handleSyncSanity}
                  disabled={syncingSanity || !sanityConfig.projectId}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Cloud className={`w-3.5 h-3.5 ${syncingSanity ? 'animate-spin' : ''}`} />
                  {syncingSanity ? 'Synchronisation...' : 'Synchroniser les données'}
                </button>
                <button
                  type="button"
                  id="save-sanity-btn"
                  onClick={handleSaveSanity}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder Sanity
                </button>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              id="save-settings-btn"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
