# CareMap — Backend API

API REST Express.js + TypeScript + Prisma + PostgreSQL

## Stack technique
- Node.js 20.11.0 LTS
- Express.js 4.18.2
- TypeScript 5.3.3
- Prisma ORM 5.10.2
- PostgreSQL 16
- JWT Authentication
- Winston Logger

## Installation

### Prérequis
- Node.js 20.11.0 (via nvm)
- PostgreSQL 16 (local ou Neon cloud)
- Git 2.43+

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/isteahbalfred/caremap-backend.git
cd caremap-backend

# 2. Activer Node 20.11.0
nvm install && nvm use

# 3. Installer les dépendances
npm install

# 4. Configurer l'environnement
copy .env.example .env
# Remplir les valeurs dans .env

# 5. Appliquer les migrations
npx prisma migrate dev

# 6. Insérer les données de test
npx prisma db seed

# 7. Démarrer le serveur
npm run dev
```

## Serveur disponible sur
- API : http://localhost:3001/api/v1
- Health : http://localhost:3001/api/v1/health
- Prisma Studio : npx prisma studio (port 5555)

## Comptes de test
| Rôle | Email | Password |
|------|-------|----------|
| Super Admin | admin@caremap.ht | Admin@CareMap2025 |
| Pharmacien | pharmacie.centrale@caremap.ht | Pharma@2025 |

## Endpoints API

### Auth
| Méthode | Route | Auth |
|---------|-------|------|
| POST | /api/v1/auth/register | Non |
| POST | /api/v1/auth/login | Non |
| POST | /api/v1/auth/refresh | Non |
| POST | /api/v1/auth/logout | Oui |
| GET | /api/v1/auth/me | Oui |

### Pharmacies
| Méthode | Route | Auth |
|---------|-------|------|
| GET | /api/v1/pharmacies | Non |
| GET | /api/v1/pharmacies/:id | Non |
| POST | /api/v1/pharmacies | PHARMACY_ADMIN |
| PUT | /api/v1/pharmacies/:id | PHARMACY_ADMIN |
| GET | /api/v1/pharmacies/my/dashboard | PHARMACY_ADMIN |

### Médicaments
| Méthode | Route | Auth |
|---------|-------|------|
| GET | /api/v1/medications | Non |
| GET | /api/v1/medications/categories | Non |
| GET | /api/v1/medications/:id | Non |
| POST | /api/v1/medications | SUPER_ADMIN |

### Stock
| Méthode | Route | Auth |
|---------|-------|------|
| GET | /api/v1/stock | PHARMACY_ADMIN |
| POST | /api/v1/stock | PHARMACY_ADMIN |
| PUT | /api/v1/stock/:id | PHARMACY_ADMIN |
| GET | /api/v1/stock/alerts | PHARMACY_ADMIN |

### Cliniques
| Méthode | Route | Auth |
|---------|-------|------|
| GET | /api/v1/clinics | Non |
| GET | /api/v1/clinics/:id | Non |
| POST | /api/v1/clinics | CLINIC_ADMIN |
| PUT | /api/v1/clinics/:id | CLINIC_ADMIN |

### Admin
| Méthode | Route | Auth |
|---------|-------|------|
| GET | /api/v1/admin/dashboard | SUPER_ADMIN |
| GET | /api/v1/admin/users | SUPER_ADMIN |
| GET | /api/v1/admin/pharmacies/pending | SUPER_ADMIN |
| PATCH | /api/v1/admin/pharmacies/:id/validate | SUPER_ADMIN |
| PATCH | /api/v1/admin/users/:id/toggle | SUPER_ADMIN |

## Scripts disponibles
```bash
npm run dev          # Démarrage développement (nodemon)
npm run build        # Build TypeScript
npm run start        # Démarrage production
npm run test         # Tests Jest
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript
npx prisma studio    # Interface graphique BDD
npx prisma migrate dev --name nom  # Nouvelle migration
```

## Convention Git

feat(module): description    # Nouvelle fonctionnalité
fix(module): description     # Correction bug
docs: description            # Documentation
chore: description           # Maintenance
test(module): description    # Tests

## Structure du projet
backend/
├── src/
│   ├── config/          # Database, Cloudinary
│   ├── middlewares/     # Auth, Role, Validate, ErrorHandler
│   ├── modules/         # auth, pharmacies, medications, stock, clinics, admin
│   ├── utils/           # jwt, password, logger
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Schéma BDD
│   ├── migrations/      # Historique migrations
│   └── seed.ts          # Données initiales
└── tests/               # Tests unitaires et intégration
