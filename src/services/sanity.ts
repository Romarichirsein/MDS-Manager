import { createClient, SanityClient } from '@sanity/client';
import { Etudiant, Paiement, InstitutionSettings } from '../types';

export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token?: string;
  useCdn: boolean;
}

const STORAGE_KEY = 'mds_sanity_config';

export const DEFAULT_SANITY_PROJECT_ID = 'hxlkt1pm';
export const DEFAULT_SANITY_DATASET = 'production';
export const DEFAULT_SANITY_API_VERSION = '2024-03-01';
export const DEFAULT_SANITY_API_TOKEN =
  'skcKTClkBIWP0Day5hWh9xjB83GN9TJF0OFfEoDxjCqWQXWRAyqYIj4EXVEGoogKzTzzdsueGZVAjDvGKVjVTGt6A3nYp8OqHRBn1UWiLbF16KWRiyiKXwcgAmiXpeVA6NchGYcn5NAkyyDFIt0at80zyP9drsx2w71tejPQ7hEaROQxoBXD';

export function getStoredSanityConfig(): SanityConfig {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && parsed.projectId) {
        return {
          ...parsed,
          token: parsed.token || DEFAULT_SANITY_API_TOKEN,
        };
      }
    } catch {
      // ignore
    }
  }

  const metaEnv = (import.meta as any).env || {};

  return {
    projectId: metaEnv.VITE_SANITY_PROJECT_ID || DEFAULT_SANITY_PROJECT_ID,
    dataset: metaEnv.VITE_SANITY_DATASET || DEFAULT_SANITY_DATASET,
    apiVersion: metaEnv.VITE_SANITY_API_VERSION || DEFAULT_SANITY_API_VERSION,
    token: metaEnv.VITE_SANITY_API_TOKEN || DEFAULT_SANITY_API_TOKEN,
    useCdn: false,
  };
}

export function saveStoredSanityConfig(cfg: SanityConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function getSanityClient(customConfig?: Partial<SanityConfig>): SanityClient | null {
  const cfg = { ...getStoredSanityConfig(), ...customConfig };
  if (!cfg.projectId) {
    return null;
  }

  return createClient({
    projectId: cfg.projectId.trim(),
    dataset: (cfg.dataset || 'production').trim(),
    apiVersion: cfg.apiVersion || '2024-03-01',
    token: cfg.token ? cfg.token.trim() : undefined,
    useCdn: false,
  });
}

export async function testSanityConnection(config?: SanityConfig): Promise<{
  success: boolean;
  message: string;
  dataset?: string;
  projectId?: string;
}> {
  const cfg = config || getStoredSanityConfig();
  if (!cfg.projectId) {
    return {
      success: false,
      message: 'Veuillez renseigner le Project ID de votre projet Sanity.',
    };
  }

  try {
    const client = getSanityClient(cfg);
    if (!client) {
      return { success: false, message: 'Configuration Sanity invalide.' };
    }

    // Effectue une requête GROQ simple et sûre pour vérifier l'existence du dataset
    await client.fetch('*[_type == "sanity.imageAsset"][0...1]');
    return {
      success: true,
      message: `Connexion réussie à Sanity ! Dataset "${cfg.dataset || 'production'}" accessible.`,
      dataset: cfg.dataset,
      projectId: cfg.projectId,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Échec de communication avec Sanity. Vérifiez vos identifiants.',
    };
  }
}

export async function syncDataToSanity(
  students: Etudiant[],
  payments: Paiement[],
  settings: InstitutionSettings
): Promise<{
  success: boolean;
  message: string;
  syncedStudents: number;
  syncedPayments: number;
}> {
  const client = getSanityClient();
  if (!client) {
    throw new Error('Projet Sanity non configuré. Renseignez votre Project ID dans les paramètres.');
  }

  const config = getStoredSanityConfig();
  if (!config.token) {
    throw new Error('Un token avec droit d écriture (Write Token) est requis pour synchroniser vers Sanity.');
  }

  let studentCount = 0;
  let paymentCount = 0;

  // 1. Synchroniser les paramètres de l'institution
  await client.createOrReplace({
    _id: 'mds-institution-settings',
    _type: 'institutionSettings',
    nomEtablissement: settings.nomEtablissement,
    slogan: settings.slogan,
    devise: settings.devise,
    adresse: settings.adresse,
    telephone: settings.telephone,
    email: settings.email,
    anneeEnCours: settings.anneeEnCours,
    directeurNom: settings.directeurNom,
    filieres: settings.filières.map((f) => ({
      _key: f.nom.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      nom: f.nom,
      fraisParDefaut: f.fraisDefaut,
    })),
    updatedAt: new Date().toISOString(),
  });

  // 2. Synchroniser les étudiants
  for (const s of students) {
    await client.createOrReplace({
      _id: `student-${s.id}`,
      _type: 'student',
      matricule: s.matricule,
      nom: s.nom,
      prenom: s.prenom,
      sexe: s.sexe,
      dateNaissance: s.dateNaissance,
      telephone: s.telephone,
      email: s.email,
      formation: s.formation,
      niveau: s.niveau,
      anneeAcademique: s.anneeAcademique,
      fraisFormation: s.fraisFormation,
      statut: s.statut,
      statutFinancier: s.statutFinancier,
      totalPaye: s.totalPaye,
      resteAPayer: s.resteAPayer,
      tauxReglement: s.tauxReglement,
      updatedAt: new Date().toISOString(),
    });
    studentCount++;
  }

  // 3. Synchroniser les paiements
  for (const p of payments) {
    await client.createOrReplace({
      _id: `payment-${p.id}`,
      _type: 'payment',
      numeroRecu: p.numeroRecu,
      studentId: p.studentId,
      matricule: p.matricule,
      studentName: p.studentName,
      formation: p.formation,
      niveau: p.niveau,
      montant: p.montant,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
      referencePaiement: p.referencePaiement,
      motif: p.motif,
      caissierNom: p.caissierNom,
      soldePrecedent: p.soldePrecedent,
      nouveauSolde: p.nouveauSolde,
      createdAt: p.createdAt,
    });
    paymentCount++;
  }

  return {
    success: true,
    message: `Synchronisation Sanity achevée : ${studentCount} étudiants et ${paymentCount} paiements exportés.`,
    syncedStudents: studentCount,
    syncedPayments: paymentCount,
  };
}
