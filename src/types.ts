export type UserRole = 'ADMIN' | 'COMPTABLE' | 'SECRETAIRE';

export interface User {
  id: string;
  nom: string;
  name?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  actif: boolean;
  dernierAcces?: string;
}

export type StatutFinancier = 'SOLVABLE' | 'PARTIEL' | 'NON_SOLVABLE';
export type Sexe = 'M' | 'F';
export type StatutEtudiant = 'actif' | 'archive';
export type ModePaiement = 'Espèces' | 'Virement bancaire' | 'Chèque' | 'Mobile Money' | 'Carte Bancaire';

export interface Etudiant {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;
  telephone: string;
  email: string;
  adresse: string;
  formation: string;
  niveau: string;
  anneeAcademique: string;
  dateInscription: string;
  fraisFormation: number;
  statut: StatutEtudiant;
  remarques?: string;
  createdAt: string;
  updatedAt: string;
  // Calculés dynamiquement
  totalPaye?: number;
  resteAPayer?: number;
  statutFinancier?: StatutFinancier;
  tauxReglement?: number;
}

export interface Paiement {
  id: string;
  numeroRecu: string;
  studentId: string;
  matricule: string;
  studentName: string;
  formation: string;
  niveau: string;
  montant: number;
  datePaiement: string;
  modePaiement: ModePaiement;
  referencePaiement: string;
  motif: string;
  remarques?: string;
  caissierId: string;
  caissierNom: string;
  createdAt: string;
  // Snapshot financier au moment du paiement
  soldePrecedent: number;
  nouveauSolde: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  actionType: 'INSCRIPTION' | 'MODIFICATION' | 'PAIEMENT' | 'ARCHIVAGE' | 'SUPPRESSION' | 'AUTH' | 'CONFIG';
  details: string;
  entityId?: string;
  entityType?: 'ETUDIANT' | 'PAIEMENT' | 'USER' | 'SETTINGS';
}

export interface FiliereConfig {
  nom: string;
  fraisDefaut: number;
}

export interface InstitutionSettings {
  nomEtablissement: string;
  slogan?: string;
  devise: string; // ex: 'FCFA', 'EUR', 'USD'
  adresse: string;
  telephone: string;
  email: string;
  anneeEnCours: string;
  mentionBasPageRecu?: string;
  directeurNom?: string;
  directeurTitre?: string;
  filières: FiliereConfig[];
}

export interface DashboardStats {
  totalInscrits: number;
  totalActifs: number;
  totalArchives: number;
  totalSolvables: number;
  totalPartiels: number;
  totalNonSolvables: number;
  nouveauxCeMois: number;
  montantTotalAttendu: number;
  montantTotalEncaisse: number;
  montantRestantARecouvrer: number;
  tauxRecouvrementGlobal: number;
  derniersPaiements: Paiement[];
  derniersEtudiants: Etudiant[];
  repartitionParMode: Record<string, number>;
  repartitionParFiliere: Array<{
    filiere: string;
    totalEtudiants: number;
    encaisse: number;
    du: number;
  }>;
}
