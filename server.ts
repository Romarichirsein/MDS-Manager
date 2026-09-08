import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Load .env variables if present
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Interface pour la structure de stockage
interface DBData {
  users: Array<{
    id: string;
    nom: string;
    email: string;
    motDePasse: string;
    role: 'ADMIN' | 'COMPTABLE' | 'SECRETAIRE';
    avatar?: string;
    actif: boolean;
    dernierAcces?: string;
  }>;
  students: Array<{
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    sexe: 'M' | 'F';
    dateNaissance: string;
    telephone: string;
    email: string;
    adresse: string;
    formation: string;
    niveau: string;
    anneeAcademique: string;
    dateInscription: string;
    fraisFormation: number;
    statut: 'actif' | 'archive';
    remarques?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  payments: Array<{
    id: string;
    numeroRecu: string;
    studentId: string;
    matricule: string;
    studentName: string;
    formation: string;
    niveau: string;
    montant: number;
    datePaiement: string;
    modePaiement: 'Espèces' | 'Virement bancaire' | 'Chèque' | 'Mobile Money' | 'Carte Bancaire';
    referencePaiement: string;
    motif: string;
    remarques?: string;
    caissierId: string;
    caissierNom: string;
    createdAt: string;
    soldePrecedent: number;
    nouveauSolde: number;
  }>;
  logs: Array<{
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: 'ADMIN' | 'COMPTABLE' | 'SECRETAIRE';
    action: string;
    actionType: 'INSCRIPTION' | 'MODIFICATION' | 'PAIEMENT' | 'ARCHIVAGE' | 'SUPPRESSION' | 'AUTH' | 'CONFIG';
    details: string;
    entityId?: string;
    entityType?: 'ETUDIANT' | 'PAIEMENT' | 'USER' | 'SETTINGS';
  }>;
  settings: {
    nomEtablissement: string;
    slogan: string;
    devise: string;
    adresse: string;
    telephone: string;
    email: string;
    anneeEnCours: string;
    directeurNom: string;
    directeurTitre: string;
    filières: Array<{
      nom: string;
      fraisParDefaut: number;
    }>;
  };
}

// Données initiales réalistes pour démonstration complète immédiate
function getInitialSeedData(): DBData {
  const defaultSettings = {
    nomEtablissement: 'MDS Manager (Main du Secours)',
    slogan: "Excellence académique et gestion financière intégrée",
    devise: 'FCFA',
    adresse: 'Avenue Centrale MDS, Campus Principal',
    telephone: '+225 27 22 45 80 00',
    email: 'lamaindusecour@gmail.com',
    anneeEnCours: '2024-2025',
    directeurNom: 'Pr. Amadou Touré',
    directeurTitre: 'Directeur Général & Chancelier',
    filières: [
      { nom: 'Génie Logiciel & Informatique', fraisParDefaut: 1200000 },
      { nom: 'Management & Gestion des Entreprises', fraisParDefaut: 950000 },
      { nom: 'Comptabilité, Contrôle & Audit', fraisParDefaut: 1000000 },
      { nom: 'Droit des Affaires & Fiscalité', fraisParDefaut: 900000 },
      { nom: 'Marketing Digital & Communication', fraisParDefaut: 850000 },
      { nom: 'Cybersécurité & Réseaux Télécoms', fraisParDefaut: 1350000 },
    ],
  };

  const users: DBData['users'] = [
    {
      id: 'u-mds',
      nom: 'Administrateur MDS (La Main du Secours)',
      email: 'lamaindusecour@gmail.com',
      motDePasse: 'qlac485!',
      role: 'ADMIN',
      actif: true,
      dernierAcces: new Date().toISOString(),
    },
  ];

  const students: DBData['students'] = [
    {
      id: 'stu-1',
      matricule: 'ETU-2024-001',
      nom: 'KOUASSI',
      prenom: 'Yannick Ange',
      sexe: 'M',
      dateNaissance: '2002-04-12',
      telephone: '+225 07 48 12 34 56',
      email: 'yannick.kouassi@etud.isst.org',
      adresse: 'Cocody Riviera 3, Abidjan',
      formation: 'Génie Logiciel & Informatique',
      niveau: 'Licence 3 (L3)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-09-15',
      fraisFormation: 1200000,
      statut: 'actif',
      remarques: 'Excellent profil académique, délégué de promotion',
      createdAt: '2024-09-15T08:30:00.000Z',
      updatedAt: '2024-09-15T08:30:00.000Z',
    },
    {
      id: 'stu-2',
      matricule: 'ETU-2024-002',
      nom: 'DIALLO',
      prenom: 'Fatoumata Binta',
      sexe: 'F',
      dateNaissance: '2003-08-22',
      telephone: '+225 05 55 98 76 12',
      email: 'fatou.diallo@etud.isst.org',
      adresse: 'Marcory Résidentiel',
      formation: 'Management & Gestion des Entreprises',
      niveau: 'Licence 2 (L2)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-09-18',
      fraisFormation: 950000,
      statut: 'actif',
      remarques: 'Paiement échelonné convenu avec le tuteur',
      createdAt: '2024-09-18T10:00:00.000Z',
      updatedAt: '2024-09-18T10:00:00.000Z',
    },
    {
      id: 'stu-3',
      matricule: 'ETU-2024-003',
      nom: 'TRAORE',
      prenom: 'Ibrahim Sékou',
      sexe: 'M',
      dateNaissance: '2001-11-03',
      telephone: '+225 01 22 33 44 55',
      email: 'ibrahim.traore@etud.isst.org',
      adresse: 'Yopougon Selmer',
      formation: 'Cybersécurité & Réseaux Télécoms',
      niveau: 'Master 1 (M1)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-09-20',
      fraisFormation: 1350000,
      statut: 'actif',
      remarques: 'Inscription validée sous réserve du solde de scolarité',
      createdAt: '2024-09-20T14:15:00.000Z',
      updatedAt: '2024-09-20T14:15:00.000Z',
    },
    {
      id: 'stu-4',
      matricule: 'ETU-2024-004',
      nom: 'MENSAH',
      prenom: 'Akissi Estelle',
      sexe: 'F',
      dateNaissance: '2004-01-19',
      telephone: '+225 07 99 88 77 66',
      email: 'estelle.mensah@etud.isst.org',
      adresse: 'Plateau Dokui, Abidjan',
      formation: 'Comptabilité, Contrôle & Audit',
      niveau: 'Licence 1 (L1)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-09-25',
      fraisFormation: 1000000,
      statut: 'actif',
      remarques: 'Totalité réglée en début d année',
      createdAt: '2024-09-25T09:40:00.000Z',
      updatedAt: '2024-09-25T09:40:00.000Z',
    },
    {
      id: 'stu-5',
      matricule: 'ETU-2024-005',
      nom: 'SOW',
      prenom: 'Mamadou Lamine',
      sexe: 'M',
      dateNaissance: '2002-06-30',
      telephone: '+225 05 11 22 33 44',
      email: 'mamadou.sow@etud.isst.org',
      adresse: 'Treichville Arras 2',
      formation: 'Marketing Digital & Communication',
      niveau: 'Licence 3 (L3)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-10-02',
      fraisFormation: 850000,
      statut: 'actif',
      remarques: 'En attente du virement de la bourse d étude',
      createdAt: '2024-10-02T11:20:00.000Z',
      updatedAt: '2024-10-02T11:20:00.000Z',
    },
    {
      id: 'stu-6',
      matricule: 'ETU-2024-006',
      nom: 'BAKAYOKO',
      prenom: 'Awa Myriam',
      sexe: 'F',
      dateNaissance: '2000-09-14',
      telephone: '+225 07 70 80 90 10',
      email: 'awa.bakayoko@etud.isst.org',
      adresse: 'Deux Plateaux Vallon',
      formation: 'Droit des Affaires & Fiscalité',
      niveau: 'Master 2 (M2)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-10-05',
      fraisFormation: 900000,
      statut: 'actif',
      remarques: 'Règlement intégral par chèque certifié',
      createdAt: '2024-10-05T15:45:00.000Z',
      updatedAt: '2024-10-05T15:45:00.000Z',
    },
    {
      id: 'stu-7',
      matricule: 'ETU-2024-007',
      nom: 'CISSE',
      prenom: 'Cheick Oumar',
      sexe: 'M',
      dateNaissance: '2003-12-05',
      telephone: '+225 01 02 03 04 05',
      email: 'cheick.cisse@etud.isst.org',
      adresse: 'Koumassi Remblais',
      formation: 'Génie Logiciel & Informatique',
      niveau: 'Licence 2 (L2)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-10-10',
      fraisFormation: 1200000,
      statut: 'actif',
      remarques: 'Acompte versé à la rentrée',
      createdAt: '2024-10-10T16:00:00.000Z',
      updatedAt: '2024-10-10T16:00:00.000Z',
    },
    {
      id: 'stu-8',
      matricule: 'ETU-2024-008',
      nom: 'N’GUESSAN',
      prenom: 'Affoué Blandine',
      sexe: 'F',
      dateNaissance: '2001-03-27',
      telephone: '+225 05 67 89 01 23',
      email: 'blandine.nguessan@etud.isst.org',
      adresse: 'Abobo Baoulé',
      formation: 'Management & Gestion des Entreprises',
      niveau: 'Master 1 (M1)',
      anneeAcademique: '2024-2025',
      dateInscription: '2024-10-12',
      fraisFormation: 950000,
      statut: 'archive',
      remarques: 'Dossier suspendu temporairement (raisons médicales)',
      createdAt: '2024-10-12T13:30:00.000Z',
      updatedAt: '2024-10-12T13:30:00.000Z',
    },
  ];

  const payments: DBData['payments'] = [
    // Kouassi Yannick: 1 200 000 total (600 000 + 600 000) -> Solvable (100%)
    {
      id: 'pay-1',
      numeroRecu: 'REC-2024-0001',
      studentId: 'stu-1',
      matricule: 'ETU-2024-001',
      studentName: 'KOUASSI Yannick Ange',
      formation: 'Génie Logiciel & Informatique',
      niveau: 'Licence 3 (L3)',
      montant: 600000,
      datePaiement: '2024-09-15',
      modePaiement: 'Virement bancaire',
      referencePaiement: 'VIR-SGBCI-88921',
      motif: 'Frais de scolarité - Tranche 1',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-09-15T09:00:00.000Z',
      soldePrecedent: 1200000,
      nouveauSolde: 600000,
    },
    {
      id: 'pay-2',
      numeroRecu: 'REC-2024-0002',
      studentId: 'stu-1',
      matricule: 'ETU-2024-001',
      studentName: 'KOUASSI Yannick Ange',
      formation: 'Génie Logiciel & Informatique',
      niveau: 'Licence 3 (L3)',
      montant: 600000,
      datePaiement: '2024-11-10',
      modePaiement: 'Virement bancaire',
      referencePaiement: 'VIR-SGBCI-94203',
      motif: 'Frais de scolarité - Solde final',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-11-10T10:30:00.000Z',
      soldePrecedent: 600000,
      nouveauSolde: 0,
    },

    // Diallo Fatoumata: 950 000 total (500 000 payé) -> Partiel (reste 450 000)
    {
      id: 'pay-3',
      numeroRecu: 'REC-2024-0003',
      studentId: 'stu-2',
      matricule: 'ETU-2024-002',
      studentName: 'DIALLO Fatoumata Binta',
      formation: 'Management & Gestion des Entreprises',
      niveau: 'Licence 2 (L2)',
      montant: 500000,
      datePaiement: '2024-09-18',
      modePaiement: 'Espèces',
      referencePaiement: 'ESP-CAISSE-014',
      motif: 'Acompte scolarité rentrée',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-09-18T10:15:00.000Z',
      soldePrecedent: 950000,
      nouveauSolde: 450000,
    },

    // Traore Ibrahim: 1 350 000 total (350 000 payé) -> Partiel (reste 1 000 000)
    {
      id: 'pay-4',
      numeroRecu: 'REC-2024-0004',
      studentId: 'stu-3',
      matricule: 'ETU-2024-003',
      studentName: 'TRAORE Ibrahim Sékou',
      formation: 'Cybersécurité & Réseaux Télécoms',
      niveau: 'Master 1 (M1)',
      montant: 350000,
      datePaiement: '2024-09-20',
      modePaiement: 'Mobile Money',
      referencePaiement: 'OM-CI-20240920042',
      motif: 'Droits d inscription et acompte',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-09-20T14:30:00.000Z',
      soldePrecedent: 1350000,
      nouveauSolde: 1000000,
    },

    // Mensah Estelle: 1 000 000 total (1 000 000 payé) -> Solvable (100%)
    {
      id: 'pay-5',
      numeroRecu: 'REC-2024-0005',
      studentId: 'stu-4',
      matricule: 'ETU-2024-004',
      studentName: 'MENSAH Akissi Estelle',
      formation: 'Comptabilité, Contrôle & Audit',
      niveau: 'Licence 1 (L1)',
      montant: 1000000,
      datePaiement: '2024-09-25',
      modePaiement: 'Chèque',
      referencePaiement: 'CHQ-SIB-409122',
      motif: 'Paiement comptant scolarité annuelle',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-09-25T10:00:00.000Z',
      soldePrecedent: 1000000,
      nouveauSolde: 0,
    },

    // Bakayoko Awa: 900 000 total (900 000 payé) -> Solvable (100%)
    {
      id: 'pay-6',
      numeroRecu: 'REC-2024-0006',
      studentId: 'stu-6',
      matricule: 'ETU-2024-006',
      studentName: 'BAKAYOKO Awa Myriam',
      formation: 'Droit des Affaires & Fiscalité',
      niveau: 'Master 2 (M2)',
      montant: 900000,
      datePaiement: '2024-10-05',
      modePaiement: 'Chèque',
      referencePaiement: 'CHQ-ECOBANK-7729',
      motif: 'Règlement total scolarité M2',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-10-05T16:00:00.000Z',
      soldePrecedent: 900000,
      nouveauSolde: 0,
    },

    // Cisse Cheick Oumar: 1 200 000 total (400 000 payé) -> Partiel (reste 800 000)
    {
      id: 'pay-7',
      numeroRecu: 'REC-2024-0007',
      studentId: 'stu-7',
      matricule: 'ETU-2024-007',
      studentName: 'CISSE Cheick Oumar',
      formation: 'Génie Logiciel & Informatique',
      niveau: 'Licence 2 (L2)',
      montant: 400000,
      datePaiement: '2024-10-10',
      modePaiement: 'Mobile Money',
      referencePaiement: 'MOMO-WAVE-892301',
      motif: 'Tranche 1 rentrée',
      caissierId: 'u-mds',
      caissierNom: 'Administrateur MDS',
      createdAt: '2024-10-10T16:30:00.000Z',
      soldePrecedent: 1200000,
      nouveauSolde: 800000,
    },
    // Sow Mamadou: 0 payé -> NON_SOLVABLE (reste 850 000)
    // N'Guessan Blandine: 0 payé, archivé
  ];

  const logs: DBData['logs'] = [
    {
      id: 'log-1',
      timestamp: '2024-09-15T08:30:00.000Z',
      userId: 'u-mds',
      userName: 'Administrateur MDS',
      userRole: 'ADMIN',
      action: 'INSCRIPTION_ETUDIANT',
      actionType: 'INSCRIPTION',
      details: 'Inscription de l étudiant KOUASSI Yannick Ange (Matricule: ETU-2024-001) en L3 Génie Logiciel',
      entityId: 'stu-1',
      entityType: 'ETUDIANT',
    },
    {
      id: 'log-2',
      timestamp: '2024-09-15T09:00:00.000Z',
      userId: 'u-mds',
      userName: 'Administrateur MDS',
      userRole: 'ADMIN',
      action: 'ENCAISSEMENT_PAIEMENT',
      actionType: 'PAIEMENT',
      details: 'Encaissement de 600 000 FCFA pour KOUASSI Yannick Ange (Reçu N° REC-2024-0001)',
      entityId: 'pay-1',
      entityType: 'PAIEMENT',
    },
    {
      id: 'log-3',
      timestamp: '2024-09-25T10:00:00.000Z',
      userId: 'u-mds',
      userName: 'Administrateur MDS',
      userRole: 'ADMIN',
      action: 'ENCAISSEMENT_PAIEMENT',
      actionType: 'PAIEMENT',
      details: 'Encaissement de 1 000 000 FCFA pour MENSAH Akissi Estelle (Solvable 100%)',
      entityId: 'pay-5',
      entityType: 'PAIEMENT',
    },
    {
      id: 'log-4',
      timestamp: '2024-10-12T13:30:00.000Z',
      userId: 'u-mds',
      userName: 'Administrateur MDS',
      userRole: 'ADMIN',
      action: 'ARCHIVAGE_ETUDIANT',
      actionType: 'ARCHIVAGE',
      details: 'Archivage du dossier de N GUESSAN Affoué Blandine (Matricule: ETU-2024-008)',
      entityId: 'stu-8',
      entityType: 'ETUDIANT',
    },
  ];

  return {
    users,
    students,
    payments,
    logs,
    settings: defaultSettings,
  };
}

// Persistance atomique
function loadDatabase(): DBData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.students && parsed.payments && parsed.users) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture database.json, réinitialisation...', err);
  }
  const seed = getInitialSeedData();
  saveDatabase(seed);
  return seed;
}

function saveDatabase(data: DBData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Erreur écriture database.json:', err);
  }
}

let db = loadDatabase();

// Audit logger utilitaire
function addAuditLog(
  userId: string,
  userName: string,
  userRole: 'ADMIN' | 'COMPTABLE' | 'SECRETAIRE',
  action: string,
  actionType: DBData['logs'][0]['actionType'],
  details: string,
  entityId?: string,
  entityType?: DBData['logs'][0]['entityType']
) {
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    actionType,
    details,
    entityId,
    entityType,
  };
  db.logs.unshift(newLog);
  // Conserver jusqu'à 500 logs
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  saveDatabase(db);
}

// Fonction de calcul financier pour un étudiant
function computeStudentFinancials(student: DBData['students'][0]) {
  const studentPayments = db.payments.filter((p) => p.studentId === student.id);
  const totalPaye = studentPayments.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
  const totalFrais = Number(student.fraisFormation) || 0;
  const resteAPayer = Math.max(0, totalFrais - totalPaye);
  const tauxReglement = totalFrais > 0 ? Math.min(100, Math.round((totalPaye / totalFrais) * 100)) : 100;

  let statutFinancier: 'SOLVABLE' | 'PARTIEL' | 'NON_SOLVABLE' = 'NON_SOLVABLE';
  if (totalPaye >= totalFrais && totalFrais > 0) {
    statutFinancier = 'SOLVABLE';
  } else if (totalPaye > 0) {
    statutFinancier = 'PARTIEL';
  } else {
    statutFinancier = 'NON_SOLVABLE';
  }

  return {
    ...student,
    totalPaye,
    resteAPayer,
    tauxReglement,
    statutFinancier,
  };
}

// Middleware simple d'authentification par token
function getAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const user = db.users.find((u) => u.id === token && u.actif);
  return user || null;
}

// ==========================================
// ROUTES API
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EduFinance API', timestamp: new Date().toISOString() });
});

// 1. Authentification
app.post('/api/auth/login', (req, res) => {
  const identifier = (req.body.email || req.body.username || '').toLowerCase().trim();
  const motDePasse = req.body.motDePasse || req.body.password;
  if (!identifier || !motDePasse) {
    return res.status(400).json({ error: 'Identifiant (email ou nom d utilisateur) et mot de passe requis' });
  }

  const user = db.users.find(
    (u) =>
      (u.email.toLowerCase() === identifier ||
       u.nom.toLowerCase() === identifier ||
       (identifier === 'lamaindusecour' && u.email.toLowerCase().includes('lamaindusecour'))) &&
      u.motDePasse === motDePasse
  );

  if (!user) {
    return res.status(401).json({ error: 'Identifiants incorrects. Vérifiez votre nom d utilisateur et mot de passe.' });
  }

  if (!user.actif) {
    return res.status(403).json({ error: 'Compte désactivé. Contactez l administrateur.' });
  }

  user.dernierAcces = new Date().toISOString();
  saveDatabase(db);

  addAuditLog(
    user.id,
    user.nom,
    user.role,
    'CONNEXION',
    'AUTH',
    `Connexion réussie de ${user.nom} (${user.role})`,
    user.id,
    'USER'
  );

  const { motDePasse: _, ...safeUserBase } = user;
  const safeUser = { ...safeUserBase, name: user.nom };
  // Le token est l'id utilisateur pour cette démonstration autonome
  res.json({ token: user.id, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const { motDePasse: _, ...safeUserBase } = user;
  const safeUser = { ...safeUserBase, name: user.nom };
  res.json({ user: safeUser });
});

// 2. Gestion des étudiants
app.get('/api/students', (req, res) => {
  const { search, formation, niveau, annee, statutFinancier, statut } = req.query;

  let list = db.students.map(computeStudentFinancials);

  if (statut && typeof statut === 'string') {
    list = list.filter((s) => s.statut === statut);
  }

  if (formation && typeof formation === 'string') {
    list = list.filter((s) => s.formation === formation);
  }

  if (niveau && typeof niveau === 'string') {
    list = list.filter((s) => s.niveau === niveau);
  }

  if (annee && typeof annee === 'string') {
    list = list.filter((s) => s.anneeAcademique === annee);
  }

  if (statutFinancier && typeof statutFinancier === 'string') {
    list = list.filter((s) => s.statutFinancier === statutFinancier);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.matricule.toLowerCase().includes(q) ||
        s.nom.toLowerCase().includes(q) ||
        s.prenom.toLowerCase().includes(q) ||
        s.telephone.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }

  // Tri par date d'inscription décroissante
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(list);
});

app.get('/api/students/:id', (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Étudiant non trouvé' });
  }

  const computed = computeStudentFinancials(student);
  const studentPayments = db.payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime());

  res.json({
    ...computed,
    payments: studentPayments,
  });
});

// Enregistrer un nouvel étudiant avec calcul automatique du matricule
app.post('/api/students', (req, res) => {
  const user = getAuthUser(req);
  const {
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
    fraisFormation,
    remarques,
    premierPaiement,
  } = req.body;

  if (!nom || !prenom || !formation || !niveau) {
    return res.status(400).json({ error: 'Nom, prénom, formation et niveau sont obligatoires' });
  }

  // Génération automatique d'un matricule unique séquentiel
  const year = new Date().getFullYear();
  const studentCountForYear = db.students.filter((s) => s.matricule.includes(`${year}`)).length + 1;
  const matriculeSeq = String(studentCountForYear).padStart(3, '0');
  const matricule = req.body.matricule?.trim() || `ETU-${year}-${matriculeSeq}`;

  const newStudentId = `stu-${Date.now()}`;
  const now = new Date().toISOString();

  const newStudent: DBData['students'][0] = {
    id: newStudentId,
    matricule,
    nom: nom.toUpperCase().trim(),
    prenom: prenom.trim(),
    sexe: sexe === 'F' ? 'F' : 'M',
    dateNaissance: dateNaissance || '2004-01-01',
    telephone: telephone || '',
    email: email || '',
    adresse: adresse || '',
    formation,
    niveau,
    anneeAcademique: anneeAcademique || db.settings.anneeEnCours,
    dateInscription: req.body.dateInscription || now.slice(0, 10),
    fraisFormation: Number(fraisFormation) || 0,
    statut: 'actif',
    remarques: remarques || '',
    createdAt: now,
    updatedAt: now,
  };

  db.students.unshift(newStudent);

  // Enregistrer le premier acompte optionnel
  let createdPayment = null;
  if (premierPaiement && Number(premierPaiement.montant) > 0) {
    const pMontant = Number(premierPaiement.montant);
    const payId = `pay-${Date.now()}`;
    const recuSeq = String(db.payments.length + 1).padStart(4, '0');
    const recuNo = `REC-${year}-${recuSeq}`;

    createdPayment = {
      id: payId,
      numeroRecu: recuNo,
      studentId: newStudentId,
      matricule: newStudent.matricule,
      studentName: `${newStudent.nom} ${newStudent.prenom}`,
      formation: newStudent.formation,
      niveau: newStudent.niveau,
      montant: pMontant,
      datePaiement: premierPaiement.datePaiement || now.slice(0, 10),
      modePaiement: premierPaiement.modePaiement || 'Espèces',
      referencePaiement: premierPaiement.referencePaiement || `INSCRIP-${newStudent.matricule}`,
      motif: 'Acompte / Frais d inscription',
      remarques: premierPaiement.remarques || 'Premier versement lors de l inscription',
      caissierId: user ? user.id : 'u-admin',
      caissierNom: user ? user.nom : 'Administration',
      createdAt: now,
      soldePrecedent: newStudent.fraisFormation,
      nouveauSolde: Math.max(0, newStudent.fraisFormation - pMontant),
    };
    db.payments.unshift(createdPayment);
  }

  saveDatabase(db);

  addAuditLog(
    user?.id || 'system',
    user?.nom || 'Administration',
    user?.role || 'ADMIN',
    'INSCRIPTION_ETUDIANT',
    'INSCRIPTION',
    `Inscription de l étudiant ${newStudent.nom} ${newStudent.prenom} (Matricule: ${newStudent.matricule})${createdPayment ? ` avec versement initial de ${createdPayment.montant} ${db.settings.devise}` : ''}`,
    newStudentId,
    'ETUDIANT'
  );

  const studentWithFin = computeStudentFinancials(newStudent);
  res.status(201).json({
    student: studentWithFin,
    payment: createdPayment,
  });
});

// Modifier un étudiant
app.put('/api/students/:id', (req, res) => {
  const user = getAuthUser(req);
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Étudiant non trouvé' });
  }

  const {
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
    fraisFormation,
    remarques,
  } = req.body;

  if (matricule) student.matricule = matricule.trim();
  if (nom) student.nom = nom.toUpperCase().trim();
  if (prenom) student.prenom = prenom.trim();
  if (sexe) student.sexe = sexe;
  if (dateNaissance) student.dateNaissance = dateNaissance;
  if (telephone !== undefined) student.telephone = telephone;
  if (email !== undefined) student.email = email;
  if (adresse !== undefined) student.adresse = adresse;
  if (formation) student.formation = formation;
  if (niveau) student.niveau = niveau;
  if (anneeAcademique) student.anneeAcademique = anneeAcademique;
  if (fraisFormation !== undefined) student.fraisFormation = Number(fraisFormation) || 0;
  if (remarques !== undefined) student.remarques = remarques;
  student.updatedAt = new Date().toISOString();

  // Mettre à jour le nom dans l'historique des paiements liés
  db.payments.forEach((p) => {
    if (p.studentId === student.id) {
      p.studentName = `${student.nom} ${student.prenom}`;
      p.matricule = student.matricule;
      p.formation = student.formation;
      p.niveau = student.niveau;
    }
  });

  saveDatabase(db);

  addAuditLog(
    user?.id || 'system',
    user?.nom || 'Administration',
    user?.role || 'ADMIN',
    'MODIFICATION_ETUDIANT',
    'MODIFICATION',
    `Mise à jour des informations de l étudiant ${student.nom} ${student.prenom} (${student.matricule})`,
    student.id,
    'ETUDIANT'
  );

  res.json(computeStudentFinancials(student));
});

// Archiver ou réactiver un étudiant
app.patch('/api/students/:id/archive', (req, res) => {
  const user = getAuthUser(req);
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Étudiant non trouvé' });
  }

  student.statut = student.statut === 'actif' ? 'archive' : 'actif';
  student.updatedAt = new Date().toISOString();
  saveDatabase(db);

  addAuditLog(
    user?.id || 'system',
    user?.nom || 'Administration',
    user?.role || 'ADMIN',
    student.statut === 'archive' ? 'ARCHIVAGE_ETUDIANT' : 'REACTIVATION_ETUDIANT',
    'ARCHIVAGE',
    `${student.statut === 'archive' ? 'Archivage' : 'Réactivation'} de l étudiant ${student.nom} ${student.prenom} (${student.matricule})`,
    student.id,
    'ETUDIANT'
  );

  res.json(computeStudentFinancials(student));
});

// Supprimer un étudiant (ADMIN uniquement)
app.delete('/api/students/:id', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Seul un Administrateur peut supprimer définitivement un étudiant' });
  }

  const idx = db.students.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Étudiant non trouvé' });
  }

  const removed = db.students.splice(idx, 1)[0];
  // Supprimer les paiements associés
  db.payments = db.payments.filter((p) => p.studentId !== removed.id);
  saveDatabase(db);

  addAuditLog(
    user?.id || 'system',
    user?.nom || 'Administration',
    user?.role || 'ADMIN',
    'SUPPRESSION_ETUDIANT',
    'SUPPRESSION',
    `Suppression définitive de l étudiant ${removed.nom} ${removed.prenom} (${removed.matricule})`,
    removed.id,
    'ETUDIANT'
  );

  res.json({ message: 'Étudiant supprimé avec succès' });
});

// 3. Gestion des paiements
app.get('/api/payments', (req, res) => {
  const { studentId, modePaiement, search, dateDebut, dateFin } = req.query;

  let list = [...db.payments];

  if (studentId && typeof studentId === 'string') {
    list = list.filter((p) => p.studentId === studentId);
  }

  if (modePaiement && typeof modePaiement === 'string') {
    list = list.filter((p) => p.modePaiement === modePaiement);
  }

  if (dateDebut && typeof dateDebut === 'string') {
    list = list.filter((p) => p.datePaiement >= dateDebut);
  }

  if (dateFin && typeof dateFin === 'string') {
    list = list.filter((p) => p.datePaiement <= dateFin);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.numeroRecu.toLowerCase().includes(q) ||
        p.matricule.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.referencePaiement.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

app.get('/api/payments/:id', (req, res) => {
  const payment = db.payments.find((p) => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Paiement non trouvé' });
  }
  const student = db.students.find((s) => s.id === payment.studentId);
  const studentFin = student ? computeStudentFinancials(student) : null;

  res.json({
    payment,
    student: studentFin,
    settings: db.settings,
  });
});

app.post('/api/payments', (req, res) => {
  const user = getAuthUser(req);
  const {
    studentId,
    montant,
    datePaiement,
    modePaiement,
    referencePaiement,
    motif,
    remarques,
  } = req.body;

  if (!studentId || !montant || Number(montant) <= 0) {
    return res.status(400).json({ error: 'Étudiant et montant valide requis (> 0)' });
  }

  const student = db.students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Étudiant non trouvé' });
  }

  const currentFin = computeStudentFinancials(student);
  const montantNum = Number(montant);
  const soldePrecedent = currentFin.resteAPayer ?? student.fraisFormation;
  const nouveauSolde = Math.max(0, soldePrecedent - montantNum);

  const year = new Date().getFullYear();
  const recuSeq = String(db.payments.length + 1).padStart(4, '0');
  const numeroRecu = `REC-${year}-${recuSeq}`;
  const now = new Date().toISOString();

  const newPayment: DBData['payments'][0] = {
    id: `pay-${Date.now()}`,
    numeroRecu,
    studentId: student.id,
    matricule: student.matricule,
    studentName: `${student.nom} ${student.prenom}`,
    formation: student.formation,
    niveau: student.niveau,
    montant: montantNum,
    datePaiement: datePaiement || now.slice(0, 10),
    modePaiement: modePaiement || 'Espèces',
    referencePaiement: referencePaiement || `REF-${Date.now().toString(36).toUpperCase()}`,
    motif: motif || 'Frais de scolarité',
    remarques: remarques || '',
    caissierId: user ? user.id : 'u-2',
    caissierNom: user ? user.nom : 'Caisse Centrale',
    createdAt: now,
    soldePrecedent,
    nouveauSolde,
  };

  db.payments.unshift(newPayment);
  saveDatabase(db);

  addAuditLog(
    user?.id || 'caisse',
    user?.nom || 'Caisse Centrale',
    user?.role || 'COMPTABLE',
    'ENCAISSEMENT_PAIEMENT',
    'PAIEMENT',
    `Encaissement de ${montantNum.toLocaleString('fr-FR')} ${db.settings.devise} pour ${student.nom} ${student.prenom} (${student.matricule}) - Reçu N° ${numeroRecu}`,
    newPayment.id,
    'PAIEMENT'
  );

  const updatedStudentFin = computeStudentFinancials(student);

  res.status(201).json({
    payment: newPayment,
    student: updatedStudentFin,
  });
});

// Annulation d'un paiement (ADMIN uniquement)
app.delete('/api/payments/:id', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Seul un Administrateur peut annuler un reçu de paiement' });
  }

  const idx = db.payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Paiement non trouvé' });
  }

  const removed = db.payments.splice(idx, 1)[0];
  saveDatabase(db);

  addAuditLog(
    user?.id || 'system',
    user?.nom || 'Administration',
    user?.role || 'ADMIN',
    'ANNULATION_PAIEMENT',
    'SUPPRESSION',
    `Annulation du paiement N° ${removed.numeroRecu} de ${removed.montant.toLocaleString('fr-FR')} ${db.settings.devise} pour ${removed.studentName}`,
    removed.id,
    'PAIEMENT'
  );

  res.json({ message: 'Paiement annulé avec succès' });
});

// 4. Statistiques & Dashboard
app.get('/api/stats/dashboard', (req, res) => {
  const activeStudents = db.students.filter((s) => s.statut === 'actif').map(computeStudentFinancials);
  const allComputed = db.students.map(computeStudentFinancials);

  const totalInscrits = allComputed.length;
  const totalActifs = activeStudents.length;
  const totalArchives = db.students.filter((s) => s.statut === 'archive').length;

  const totalSolvables = activeStudents.filter((s) => s.statutFinancier === 'SOLVABLE').length;
  const totalPartiels = activeStudents.filter((s) => s.statutFinancier === 'PARTIEL').length;
  const totalNonSolvables = activeStudents.filter((s) => s.statutFinancier === 'NON_SOLVABLE').length;

  // Calcul du nombre de nouveaux inscrits ce mois
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const nouveauxCeMois = db.students.filter((s) => s.createdAt.slice(0, 7) === currentYearMonth).length;

  const montantTotalAttendu = activeStudents.reduce((acc, s) => acc + (s.fraisFormation || 0), 0);
  const montantTotalEncaisse = db.payments.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
  const montantRestantARecouvrer = Math.max(0, montantTotalAttendu - montantTotalEncaisse);
  const tauxRecouvrementGlobal =
    montantTotalAttendu > 0 ? Math.min(100, Math.round((montantTotalEncaisse / montantTotalAttendu) * 100)) : 100;

  const derniersPaiements = db.payments.slice(0, 6);
  const derniersEtudiants = activeStudents.slice(0, 5);

  // Répartition par mode de paiement
  const repartitionParMode: Record<string, number> = {};
  db.payments.forEach((p) => {
    repartitionParMode[p.modePaiement] = (repartitionParMode[p.modePaiement] || 0) + p.montant;
  });

  // Répartition par filière
  const filiereMap = new Map<string, { totalEtudiants: number; encaisse: number; du: number }>();
  activeStudents.forEach((s) => {
    const existing = filiereMap.get(s.formation) || { totalEtudiants: 0, encaisse: 0, du: 0 };
    existing.totalEtudiants += 1;
    existing.encaisse += s.totalPaye || 0;
    existing.du += s.fraisFormation || 0;
    filiereMap.set(s.formation, existing);
  });

  const repartitionParFiliere = Array.from(filiereMap.entries()).map(([filiere, data]) => ({
    filiere,
    ...data,
  }));

  res.json({
    totalInscrits,
    totalActifs,
    totalArchives,
    totalSolvables,
    totalPartiels,
    totalNonSolvables,
    nouveauxCeMois,
    montantTotalAttendu,
    montantTotalEncaisse,
    montantRestantARecouvrer,
    tauxRecouvrementGlobal,
    derniersPaiements,
    derniersEtudiants,
    repartitionParMode,
    repartitionParFiliere,
  });
});

// 5. Suivi de solvabilité détaillé
app.get('/api/solvency/summary', (req, res) => {
  const activeStudents = db.students.filter((s) => s.statut === 'actif').map(computeStudentFinancials);

  const solvables = activeStudents.filter((s) => s.statutFinancier === 'SOLVABLE');
  const nonSolvables = activeStudents.filter((s) => s.statutFinancier !== 'SOLVABLE');
  const partiels = activeStudents.filter((s) => s.statutFinancier === 'PARTIEL');
  const zeroPaiement = activeStudents.filter((s) => s.statutFinancier === 'NON_SOLVABLE');

  const totalImpayes = nonSolvables.reduce((acc, s) => acc + (s.resteAPayer || 0), 0);
  const totalEncaisseSolvables = solvables.reduce((acc, s) => acc + (s.totalPaye || 0), 0);
  const totalEncaisseNonSolvables = nonSolvables.reduce((acc, s) => acc + (s.totalPaye || 0), 0);

  res.json({
    totalSolvables: solvables.length,
    totalNonSolvables: nonSolvables.length,
    totalPartiels: partiels.length,
    totalZeroPaiement: zeroPaiement.length,
    totalImpayes,
    totalEncaisseSolvables,
    totalEncaisseNonSolvables,
    solvables,
    nonSolvables,
    partiels,
    zeroPaiement,
  });
});

// 6. Journalisation / Audit Logs
app.get('/api/logs', (req, res) => {
  const { actionType, limit } = req.query;
  let logs = [...db.logs];

  if (actionType && typeof actionType === 'string') {
    logs = logs.filter((l) => l.actionType === actionType);
  }

  const max = Number(limit) || 100;
  res.json(logs.slice(0, max));
});

// 7. Paramètres & Configuration
app.get('/api/settings', (req, res) => {
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }

  db.settings = {
    ...db.settings,
    ...req.body,
  };
  saveDatabase(db);

  addAuditLog(
    user?.id || 'admin',
    user?.nom || 'Admin',
    'ADMIN',
    'MODIFICATION_CONFIG',
    'CONFIG',
    'Mise à jour des paramètres de l établissement et barème des frais',
    'settings',
    'SETTINGS'
  );

  res.json(db.settings);
});

// 8. Gestion des utilisateurs (Admin)
app.get('/api/users', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }

  const safeUsers = db.users.map(({ motDePasse, ...u }) => ({ ...u, name: u.nom }));
  res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }

  const { nom, email, motDePasse, role } = req.body;
  if (!nom || !email || !motDePasse || !role) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Cet email est déjà utilisé' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    nom: nom.trim(),
    email: email.toLowerCase().trim(),
    motDePasse: motDePasse.trim(),
    role: role as 'ADMIN' | 'COMPTABLE' | 'SECRETAIRE',
    actif: true,
    dernierAcces: undefined,
  };

  db.users.push(newUser);
  saveDatabase(db);

  addAuditLog(
    user?.id || 'admin',
    user?.nom || 'Admin',
    'ADMIN',
    'CREATION_UTILISATEUR',
    'AUTH',
    `Création du compte utilisateur pour ${newUser.nom} (${newUser.role})`,
    newUser.id,
    'USER'
  );

  const { motDePasse: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.patch('/api/users/:id/toggle', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }

  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  if (target.id === user?.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
  }

  target.actif = !target.actif;
  saveDatabase(db);

  addAuditLog(
    user?.id || 'admin',
    user?.nom || 'Admin',
    'ADMIN',
    target.actif ? 'ACTIVATION_UTILISATEUR' : 'DESACTIVATION_UTILISATEUR',
    'AUTH',
    `${target.actif ? 'Activation' : 'Désactivation'} du compte de ${target.nom}`,
    target.id,
    'USER'
  );

  const { motDePasse: _, ...safeUser } = target;
  res.json(safeUser);
});

// 9. Sauvegarde / Export complet et Réinitialisation
app.get('/api/system/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=backup-edufinance-${new Date().toISOString().slice(0, 10)}.json`);
  res.json(db);
});

app.post('/api/system/reset', (req, res) => {
  const user = getAuthUser(req);
  if (user && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }

  db = getInitialSeedData();
  saveDatabase(db);

  addAuditLog(
    user?.id || 'admin',
    user?.nom || 'Admin',
    'ADMIN',
    'REINITIALISATION_BASE',
    'CONFIG',
    'Réinitialisation complète de la base de données avec les données par défaut'
  );

  res.json({ message: 'Base de données réinitialisée avec succès' });
});

// ==========================================
// 10. SANITY CMS INTEGRATION API
// ==========================================
app.get('/api/sanity/config', (req, res) => {
  const projectId = process.env.SANITY_PROJECT_ID || '';
  const dataset = process.env.SANITY_DATASET || 'production';
  const apiVersion = process.env.SANITY_API_VERSION || '2024-03-01';
  const hasToken = Boolean(process.env.SANITY_API_TOKEN);

  res.json({
    configured: Boolean(projectId),
    projectId: projectId ? `${projectId.slice(0, 4)}...${projectId.slice(-2)}` : null,
    organizationId: process.env.SANITY_ORGANIZATION_ID || null,
    dataset,
    apiVersion,
    hasToken,
  });
});

app.post('/api/sanity/sync-all', async (req, res) => {
  const targetProject = process.env.SANITY_PROJECT_ID || req.body.projectId;
  const targetDataset = process.env.SANITY_DATASET || req.body.dataset || 'production';
  const targetVersion = process.env.SANITY_API_VERSION || req.body.apiVersion || '2024-03-01';
  const targetToken = process.env.SANITY_API_TOKEN || req.body.token;

  if (!targetProject || !targetToken) {
    return res.status(400).json({
      success: false,
      message: 'Project ID ou Token d API Sanity manquant.',
    });
  }

  try {
    const mutations: any[] = [];

    // 1. Institution settings
    mutations.push({
      createOrReplace: {
        _id: 'mds-institution-settings',
        _type: 'institutionSettings',
        nomEtablissement: db.settings.nomEtablissement,
        slogan: db.settings.slogan,
        devise: db.settings.devise,
        adresse: db.settings.adresse,
        telephone: db.settings.telephone,
        email: db.settings.email,
        anneeEnCours: db.settings.anneeEnCours,
        directeurNom: db.settings.directeurNom,
        filieres: (db.settings.filières || []).map((f) => ({
          _key: f.nom.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          nom: f.nom,
          fraisDefaut: f.fraisParDefaut,
        })),
        updatedAt: new Date().toISOString(),
      },
    });

    // 2. Étudiants
    for (const s of db.students) {
      mutations.push({
        createOrReplace: {
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
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // 3. Paiements
    for (const p of db.payments) {
      mutations.push({
        createOrReplace: {
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
        },
      });
    }

    const mutateUrl = `https://${targetProject}.api.sanity.io/v${targetVersion}/data/mutate/${targetDataset}`;
    const response = await fetch(mutateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${targetToken}`,
      },
      body: JSON.stringify({ mutations }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: `Synchronisation réussie vers Sanity (${mutations.length} enregistrements envoyés).`,
        transactionId: (data as any).transactionId,
        syncedStudents: db.students.length,
        syncedPayments: db.payments.length,
      });
    } else {
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `Erreur Sanity: ${errText}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Échec de synchronisation Sanity.',
    });
  }
});

app.post('/api/sanity/test', async (req, res) => {
  const { projectId, dataset, apiVersion, token } = req.body;
  const targetProject = projectId || process.env.SANITY_PROJECT_ID;
  const targetDataset = dataset || process.env.SANITY_DATASET || 'production';
  const targetVersion = apiVersion || process.env.SANITY_API_VERSION || '2024-03-01';
  const targetToken = token || process.env.SANITY_API_TOKEN;

  if (!targetProject) {
    return res.status(400).json({
      success: false,
      message: 'Project ID Sanity manquant. Renseignez-le dans les paramètres ou variables d environnement.',
    });
  }

  try {
    const url = `https://${targetProject}.api.sanity.io/v${targetVersion}/data/query/${targetDataset}?query=*[_type=="sanity.imageAsset"][0...1]`;
    const headers: Record<string, string> = {};
    if (targetToken) {
      headers['Authorization'] = `Bearer ${targetToken}`;
    }

    const response = await fetch(url, { headers });
    if (response.ok) {
      return res.json({
        success: true,
        message: `Connexion Sanity validée avec succès sur le dataset "${targetDataset}".`,
        projectId: targetProject,
        dataset: targetDataset,
      });
    } else {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: (errData as any).message || `Erreur Sanity HTTP ${response.status}: vérifiez le Project ID et les permissions.`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Impossible de joindre les serveurs Sanity.',
    });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur EduFinance en écoute sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
