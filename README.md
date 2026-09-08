# MDS Manager — Centre Médical La Main du Secours 🏥

Application SaaS professionnelle de gestion administrative, comptable et académique pour le **Centre Médical La Main du Secours**.

---

## 🌟 Fonctionnalités Principales

- **Gestion Administrative & Étudiants** : Inscription, archivage, matriculation automatique, filières médicales & paramédicales.
- **Gestion Comptable & Caisses** : Émission de reçus officiels infalsifiables, suivi des tranches, balance de solvabilité en temps réel.
- **Branding Officiel Haute Définition** : Intégration du logo officiel MDS et cadre d'animation de démarrage au lancement.
- **Synchronisation Cloud Sanity CMS** : Synchronisation bidirectionnelle des formations, étudiants et états financiers avec Sanity.io.
- **Rapports & Exports** : Génération de reçus PDF/impression, états financiers individuels, bilans globaux et journaux d'audit.
- **Sécurité & Contrôle d'Accès** : Rôles stricts (Administrateur, Comptable, Secrétaire), journalisation complète des actions.

---

## 🛠️ Stack Technique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend** : Node.js, Express, TypeScript (tsx / esbuild)
- **CMS & Cloud Sync** : Sanity.io (`@sanity/client`)
- **Données locales** : Fichier persistant JSON avec sauvegarde et export

---

## 🚀 Installation & Démarrage

### 1. Cloner le dépôt
```bash
git clone https://github.com/Romarichirsein/MDS-Manager.git
cd MDS-Manager
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Créez un fichier `.env` à la racine en vous basant sur `.env.example` :
```env
SANITY_PROJECT_ID="hxlkt1pm"
SANITY_ORGANIZATION_ID="ou14yak7n"
SANITY_DATASET="production"
SANITY_API_VERSION="2024-03-01"
SANITY_API_TOKEN="votre_token_sanity"
```

### 4. Lancer en mode développement
```bash
npm run dev
```
L'application est accessible sur `http://localhost:3000`.

### 5. Compiler pour la production
```bash
npm run build
npm start
```

---

## 📄 Licence
Tous droits réservés © Centre Médical La Main du Secours.
