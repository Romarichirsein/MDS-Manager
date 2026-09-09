import {
  Etudiant,
  Paiement,
  DashboardStats,
  InstitutionSettings,
  ActivityLog,
  User,
} from '../types';

export interface LocalStoreState {
  users: User[];
  students: Etudiant[];
  payments: Paiement[];
  logs: ActivityLog[];
  settings: InstitutionSettings;
}

const STORAGE_KEY = 'mds_manager_local_db_v1';

export const DEFAULT_SETTINGS: InstitutionSettings = {
  nomEtablissement: 'Centre Médical La Main du Secours',
  slogan: 'L excellence médicale au service de la vie',
  devise: 'FCFA',
  mentionBasPageRecu:
    'Reçu officiel certifié conforme par la Caisse du Centre Médical La Main du Secours. Conservez ce document pour tout recours.',
  telephone: '+225 27 22 45 80 00',
  email: 'lamaindusecour@gmail.com',
  adresse: 'Abidjan, Côte d Ivoire',
  anneeEnCours: '2025-2026',
  directeurNom: 'Dr. KOUAME Konan Patrice',
  directeurTitre: 'Directeur Général des Formations Paramédicales',
  filières: [
    { nom: 'Soins Infirmiers & Obstétricaux', fraisDefaut: 650000 },
    { nom: 'Sage-Femme / Maïeutique', fraisDefaut: 700000 },
    { nom: 'Biologie Médicale & Analyses', fraisDefaut: 800000 },
    { nom: 'Pharmacie & Délégué Médical', fraisDefaut: 750000 },
    { nom: 'Secrétariat Médical & Gestion Hospitalière', fraisDefaut: 600000 },
    { nom: 'Kinésithérapie & Rééducation', fraisDefaut: 850000 },
  ],
};

export const DEFAULT_ADMIN: User = {
  id: 'u-mds',
  nom: 'Administrateur MDS',
  email: 'lamaindusecour@gmail.com',
  role: 'ADMIN',
  actif: true,
  dernierAcces: new Date().toISOString(),
  name: 'Administrateur MDS',
};

export function getLocalStore(): LocalStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.payments)) {
        return {
          users: Array.isArray(parsed.users) ? parsed.users : [DEFAULT_ADMIN],
          students: parsed.students,
          payments: parsed.payments,
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
          settings: parsed.settings || DEFAULT_SETTINGS,
        };
      }
    }
  } catch (e) {
    console.warn('Erreur lecture localStore MDS:', e);
  }

  const initial: LocalStoreState = {
    users: [DEFAULT_ADMIN],
    students: [],
    payments: [],
    logs: [],
    settings: DEFAULT_SETTINGS,
  };
  saveLocalStore(initial);
  return initial;
}

export function saveLocalStore(state: LocalStoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Erreur sauvegarde localStore MDS:', e);
  }
}

export function computeDashboardStats(students: Etudiant[], payments: Paiement[]): DashboardStats {
  const totalInscrits = students.length;
  const activeStudents = students.filter((s) => s.statut === 'actif');
  const totalActifs = activeStudents.length;
  const totalArchives = totalInscrits - totalActifs;

  let montantTotalAttendu = 0;
  let montantTotalEncaisse = 0;
  let totalSolvables = 0;
  let totalNonSolvables = 0;
  let totalPartiels = 0;

  const currentMonth = new Date().toISOString().slice(0, 7);
  let nouveauxCeMois = 0;

  activeStudents.forEach((s) => {
    montantTotalAttendu += Number(s.fraisFormation) || 0;
    montantTotalEncaisse += Number(s.totalPaye) || 0;

    if (s.statutFinancier === 'SOLVABLE') {
      totalSolvables += 1;
    } else if (s.statutFinancier === 'PARTIEL') {
      totalPartiels += 1;
    } else {
      totalNonSolvables += 1;
    }

    if (s.dateInscription && s.dateInscription.startsWith(currentMonth)) {
      nouveauxCeMois += 1;
    }
  });

  const montantRestantARecouvrer = Math.max(0, montantTotalAttendu - montantTotalEncaisse);
  const tauxRecouvrementGlobal =
    montantTotalAttendu > 0 ? Math.round((montantTotalEncaisse / montantTotalAttendu) * 1000) / 10 : 0;

  // Répartition par mode de paiement
  const repartitionParMode: Record<string, number> = {};
  payments.forEach((p) => {
    const m = p.modePaiement || 'Espèces';
    repartitionParMode[m] = (repartitionParMode[m] || 0) + Number(p.montant || 0);
  });

  // Répartition par filière
  const filiereMap: { [key: string]: { totalEtudiants: number; encaisse: number; du: number } } = {};
  activeStudents.forEach((s) => {
    const f = s.formation || 'Général';
    if (!filiereMap[f]) {
      filiereMap[f] = { totalEtudiants: 0, encaisse: 0, du: 0 };
    }
    filiereMap[f].totalEtudiants += 1;
    filiereMap[f].du += Number(s.fraisFormation) || 0;
    filiereMap[f].encaisse += Number(s.totalPaye) || 0;
  });

  const repartitionParFiliere = Object.entries(filiereMap).map(([filiere, data]) => ({
    filiere,
    totalEtudiants: data.totalEtudiants,
    encaisse: data.encaisse,
    du: data.du,
  }));

  const derniersPaiements = [...payments]
    .sort((a, b) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime())
    .slice(0, 5);

  const derniersEtudiants = [...activeStudents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalInscrits,
    totalActifs,
    totalArchives,
    totalSolvables,
    totalNonSolvables,
    totalPartiels,
    nouveauxCeMois,
    montantTotalAttendu,
    montantTotalEncaisse,
    montantRestantARecouvrer,
    tauxRecouvrementGlobal,
    derniersPaiements,
    derniersEtudiants,
    repartitionParMode,
    repartitionParFiliere,
  };
}
