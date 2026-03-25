# Architecture Technique - Call Center E-commerce

## 1. Vue d'ensemble

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   KAVKOM     │────▶│                 │────▶│  MONDAY.COM  │
│  (Téléphonie │     │      MAKE       │     │  (Hub Data)  │
│   + CRM)    │◀────│  (Orchestrateur) │◀────│              │
└─────────────┘     │                 │     └──────┬───────┘
                    │                 │            │
┌─────────────┐     │                 │     ┌──────▼───────┐
│ PAGE VENTE  │────▶│                 │────▶│  DASHBOARDS  │
│  (Interne)  │     │                 │     │  (Monday)    │
└─────────────┘     │                 │     └──────────────┘
                    │                 │
┌─────────────┐     │                 │     ┌──────────────┐
│  STRIPE     │◀───▶│                 │────▶│ FACTURATION  │
│  ALMA       │     │                 │     │ (Pennylane/  │
│  SCALAPAY   │     │                 │     │  Sellsy/...) │
└─────────────┘     │                 │     └──────────────┘
                    │                 │
                    │                 │     ┌──────────────┐
                    │                 │────▶│   BOXTAL     │
                    │                 │     │ (Expédition) │
                    └─────────────────┘     └──────────────┘
```

### Rôle de chaque brique

| Outil | Rôle | Données clés |
|-------|------|-------------|
| **Kavkom** | Téléphonie + CRM d'appel | Appels, leads, qualification, vendeurs |
| **Monday.com** | Hub central de données | Leads, commandes, clients, KPIs |
| **Make** | Orchestrateur d'automatisation | Tous les flux inter-outils |
| **Page de vente** | Interface télévendeur | Saisie commande, choix paiement |
| **Stripe/Alma/Scalapay** | Paiements | Transactions, statuts, remboursements |
| **Facturation** | Émission factures | Factures, avoirs |
| **Boxtal** | Expédition | Colis, tracking, étiquettes |

---

## 2. Structure Monday.com (Hub Data)

### Board 1 : Leads / Fiches

| Colonne | Type | Description |
|---------|------|-------------|
| Nom | Texte | Nom du prospect |
| Prénom | Texte | Prénom du prospect |
| Téléphone | Téléphone | Numéro principal |
| Email | Email | Adresse email |
| Source | Dropdown | Origine du lead |
| Vendeur assigné | Personnes | Télévendeur en charge |
| **Statut qualification** | **Statut** | **À relancer / Répondeur / Barrage / Refus / Commande** |
| Date dernier appel | Date | MAJ automatique via Kavkom |
| Nb tentatives | Nombre | Compteur d'appels |
| Notes | Texte long | Historique des échanges |
| ID Kavkom | Texte | Lien avec le CRM |

### Board 2 : Commandes

| Colonne | Type | Description |
|---------|------|-------------|
| N° commande | Auto-ID | Identifiant unique |
| Client (lien) | Lien board | Lien vers Leads/Clients |
| Vendeur | Personnes | Qui a conclu la vente |
| Produit / Pack | Dropdown | Référence produit |
| Prix TTC | Nombre | Montant de la commande |
| Moyen de paiement | Statut | Stripe / Alma / Scalapay |
| **Statut paiement** | **Statut** | **En attente / Validé / Échoué / Remboursé** |
| **Statut commande** | **Statut** | **Nouvelle / Payée / Facturée / Expédiée / Livrée** |
| ID transaction | Texte | Référence Stripe/Alma/Scalapay |
| N° facture | Texte | Lien facturation |
| N° tracking | Texte | Tracking Boxtal |
| Date commande | Date | Horodatage |

### Board 3 : Dashboard Vendeurs

| Colonne | Type | Description |
|---------|------|-------------|
| Vendeur | Personnes | Télévendeur |
| CA jour | Nombre | Formule / MAJ auto |
| CA semaine | Nombre | Formule / MAJ auto |
| CA mois | Nombre | Formule / MAJ auto |
| Nb ventes jour | Nombre | Compteur |
| Nb appels jour | Nombre | Depuis Kavkom |
| Taux transformation | Nombre | Ventes / Appels × 100 |
| Panier moyen | Nombre | CA / Nb ventes |
| Nb refus | Nombre | Compteur |

### Board 4 : Clients (post-achat)

| Colonne | Type | Description |
|---------|------|-------------|
| Nom complet | Texte | Nom + Prénom |
| Email | Email | Contact |
| Téléphone | Téléphone | Contact |
| Adresse livraison | Texte long | Pour Boxtal |
| Historique achats | Lien board | Lien vers Commandes |
| Total dépensé | Nombre | Somme des commandes |
| Nb commandes | Nombre | Compteur |

---

## 3. Scénarios Make (Automatisations)

### Scénario 1 : Kavkom → Monday (Sync Leads & Appels)

```
DÉCLENCHEUR : Webhook Kavkom (fin d'appel)
    │
    ▼
[Make] Réception données appel
    │  - ID agent / vendeur
    │  - Numéro appelé
    │  - Durée appel
    │  - Statut appel (décroché, répondeur, occupé)
    │
    ▼
[Make] Recherche lead dans Monday (par téléphone)
    │
    ├── Lead trouvé ──▶ Mise à jour :
    │                    - Date dernier appel
    │                    - Nb tentatives +1
    │                    - Vendeur assigné
    │                    - Statut qualification (si changé)
    │
    └── Lead non trouvé ──▶ Création nouvel item
                             dans Board Leads
```

**Fréquence** : Temps réel (webhook)
**Volume estimé** : 200-500 appels/jour

---

### Scénario 2 : Page de vente → Commande + Paiement

```
DÉCLENCHEUR : Webhook depuis page de vente (soumission formulaire)
    │
    ▼
[Make] Réception données commande
    │  - Infos client (nom, prénom, email, tel, adresse)
    │  - Produit / pack sélectionné
    │  - Prix
    │  - Moyen de paiement choisi
    │  - ID vendeur
    │
    ▼
[Make] Router (selon moyen de paiement)
    │
    ├── Stripe ──▶ Création Payment Intent (API Stripe)
    │               └── Retour lien de paiement ou charge directe
    │
    ├── Alma ──▶ Création session paiement (API Alma)
    │             └── Paiement en 2x/3x/4x
    │
    └── Scalapay ──▶ Création ordre (API Scalapay)
                      └── Paiement fractionné
    │
    ▼
[Make] Création item dans Board Commandes (Monday)
    │  - Statut : "En attente de paiement"
    │  - Toutes les infos client + commande
    │
    ▼
[Make] Mise à jour Board Leads
       - Statut qualification → "Commande"
       - Lien vers commande
```

**Fréquence** : Temps réel (webhook)

---

### Scénario 3 : Confirmation paiement → Facturation

```
DÉCLENCHEUR : Webhook paiement (Stripe / Alma / Scalapay)
    │
    ▼
[Make] Vérification statut paiement
    │
    ├── Paiement réussi ──▶
    │   │
    │   ▼
    │   [Make] MAJ Board Commandes (Monday)
    │   │  - Statut paiement → "Validé"
    │   │  - Statut commande → "Payée"
    │   │  - ID transaction
    │   │
    │   ▼
    │   [Make] Création facture (API logiciel facturation)
    │   │  - Infos client
    │   │  - Détail produit + prix
    │   │  - Référence paiement
    │   │
    │   ▼
    │   [Make] MAJ Board Commandes
    │   │  - N° facture
    │   │  - Statut commande → "Facturée"
    │   │
    │   ▼
    │   [Make] Envoi facture par email au client
    │
    └── Paiement échoué ──▶
        │
        ▼
        [Make] MAJ Board Commandes
        │  - Statut paiement → "Échoué"
        │
        ▼
        [Make] Notification vendeur (email/Monday)
```

**Fréquence** : Temps réel (webhook)

---

### Scénario 4 : Facture validée → Expédition Boxtal

```
DÉCLENCHEUR : Changement statut Monday → "Facturée"
    │
    ▼
[Make] Récupération données commande + adresse
    │
    ▼
[Make] Création expédition (API Boxtal)
    │  - Adresse expéditeur (entrepôt)
    │  - Adresse destinataire
    │  - Poids / dimensions colis
    │  - Choix transporteur (règle auto ou manuel)
    │
    ▼
[Make] Récupération étiquette + tracking
    │
    ▼
[Make] MAJ Board Commandes (Monday)
    │  - N° tracking
    │  - Statut commande → "Expédiée"
    │
    ▼
[Make] Email client : confirmation expédition + tracking
```

**Fréquence** : Temps réel (trigger Monday)

---

### Scénario 5 : Suivi livraison Boxtal

```
DÉCLENCHEUR : Webhook Boxtal (changement statut colis)
    │
    ▼
[Make] MAJ Board Commandes (Monday)
    │  - Statut commande → "Livrée" (si livré)
    │
    ▼
[Make] (Optionnel) Email client confirmation livraison
```

---

### Scénario 6 : Agrégation KPIs (Schedulé)

```
DÉCLENCHEUR : Planification quotidienne (08h00)
    │
    ▼
[Make] Requête Monday API
    │  - Commandes du jour précédent
    │  - Groupées par vendeur
    │
    ▼
[Make] Calcul KPIs par vendeur
    │  - CA jour / semaine / mois
    │  - Nb ventes
    │  - Taux transformation (via données Kavkom)
    │  - Panier moyen
    │  - Nb refus
    │
    ▼
[Make] MAJ Board Dashboard Vendeurs
    │
    ▼
[Make] (Optionnel) Envoi rapport email aux managers
```

**Fréquence** : 1x/jour + recalcul hebdo/mensuel

---

## 4. Intégrations API détaillées

### Kavkom

| Endpoint | Usage | Méthode |
|----------|-------|---------|
| Webhook fin d'appel | Déclencheur principal | POST (webhook) |
| GET /contacts | Récupération fiches | GET |
| PUT /contacts/{id} | MAJ qualification | PUT |
| GET /agents | Liste vendeurs | GET |
| GET /call-logs | Historique appels (backup) | GET |

### Monday.com

| Endpoint | Usage | Méthode |
|----------|-------|---------|
| API GraphQL | Toutes opérations | POST |
| `create_item` | Création lead/commande | Mutation |
| `change_column_value` | MAJ statuts | Mutation |
| `items_page_by_column_values` | Recherche par téléphone/email | Query |
| Webhooks Monday | Déclencheurs (statut change) | Webhook |

### Stripe

| Endpoint | Usage | Méthode |
|----------|-------|---------|
| POST /payment_intents | Création paiement | POST |
| Webhook `payment_intent.succeeded` | Confirmation | Webhook |
| Webhook `payment_intent.failed` | Échec | Webhook |
| POST /refunds | Remboursement | POST |

### Alma

| Endpoint | Usage | Méthode |
|----------|-------|---------|
| POST /v1/payments | Création paiement fractionné | POST |
| Webhook `payment.paid` | Confirmation | Webhook |
| GET /v1/payments/{id} | Vérification statut | GET |

### Scalapay

| Endpoint | Usage | Méthode |
|----------|-------|---------|
| POST /v2/orders | Création ordre | POST |
| Webhook order confirmed | Confirmation | Webhook |
| GET /v2/orders/{token} | Suivi | GET |

### Boxtal

| Endpoint | Usage | Méthode |
|----------|-------|---------|
| POST /shipments | Création expédition | POST |
| GET /shipments/{id}/label | Étiquette | GET |
| Webhook statut colis | Suivi livraison | Webhook |
| GET /quotes | Comparaison transporteurs | GET |

---

## 5. Dashboards Monday.com

### Dashboard Global (Direction)

```
┌─────────────────────────────────────────────────────────┐
│                    CA GLOBAL                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Jour     │  │ Semaine  │  │ Mois     │              │
│  │ 4 520 €  │  │ 28 300 € │  │ 112 400 €│              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  Nb ventes: 47  │  Taux transfo: 12.3%  │  Panier: 96€ │
├─────────────────────────────────────────────────────────┤
│            RÉPARTITION PAR VENDEUR                      │
│  ┌─────────────────────────────────────────┐            │
│  │ ████████████████████  Vendeur A  38%    │            │
│  │ ██████████████       Vendeur B  28%     │            │
│  │ ██████████           Vendeur C  20%     │            │
│  │ ███████              Vendeur D  14%     │            │
│  └─────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────┤
│            PIPELINE COMMANDES                           │
│  En attente: 12 │ Payées: 8 │ Expédiées: 23 │ Livrées: 4│
├─────────────────────────────────────────────────────────┤
│            QUALIFICATION LEADS                          │
│  À relancer: 234 │ Répondeur: 89 │ Barrage: 45         │
│  Refus: 156      │ Commande: 47                         │
└─────────────────────────────────────────────────────────┘
```

### Dashboard Vendeur (individuel)

```
┌─────────────────────────────────────────────────────────┐
│  VENDEUR : [Nom]            Période : [Jour/Sem/Mois]  │
├─────────────────────────────────────────────────────────┤
│  CA: 1 720 €  │  Ventes: 18  │  Transfo: 14.2%        │
│  Appels: 127  │  Panier: 95€ │  Refus: 23             │
├─────────────────────────────────────────────────────────┤
│  DERNIÈRES COMMANDES                                    │
│  #0047 │ Martin Dupont │ Pack Premium │ 149€ │ Expédié  │
│  #0044 │ Claire Morel  │ Pack Basic   │  79€ │ Payée    │
│  #0041 │ Jean Petit    │ Pack Pro     │ 199€ │ Livrée   │
├─────────────────────────────────────────────────────────┤
│  FICHES EN COURS                                        │
│  À relancer: 34  │  Répondeur: 12  │  RDV: 3           │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Page de vente interne (Spécifications)

### Fonctionnalités

La page de vente est une **webapp interne** utilisée par les télévendeurs pendant l'appel.

**Champs du formulaire :**
- Vendeur (pré-rempli via login)
- Nom / Prénom client
- Téléphone
- Email
- Adresse de livraison (rue, CP, ville)
- Sélection produit / pack (dropdown)
- Prix (auto-calculé selon produit)
- Choix moyen de paiement : Stripe / Alma / Scalapay

**Comportement :**
1. Le vendeur remplit le formulaire pendant l'appel
2. Soumission → webhook vers Make
3. Make orchestre le paiement selon le choix
4. Retour statut en temps réel sur la page (succès/échec)

**Intégration :**
- Envoi des données via `fetch()` POST vers un webhook Make
- Réception du statut via polling ou webhook retour
- Authentification simple (identifiant vendeur)

---

## 7. Sécurité & Fiabilité

### Gestion des erreurs Make

- **Error handlers** sur chaque scénario : notification email + log Monday en cas d'échec
- **Retry automatique** (3 tentatives) sur les appels API
- **Scénario de rattrapage** : vérification quotidienne des commandes en statut incohérent

### Sécurité des données

- Webhooks sécurisés par **signature HMAC** (Stripe, Alma)
- **Tokens API** stockés dans les connexions Make (jamais en clair)
- Accès Monday.com restreint par rôle (vendeur vs manager vs admin)
- Page de vente accessible uniquement depuis **IP autorisées** ou VPN

### Scalabilité

- Architecture Make modulaire : 1 scénario = 1 responsabilité
- Montée en charge : passage Make Pro/Teams si >10 000 opérations/mois
- Monday.com : boards séparés par mois si volume > 5 000 commandes/mois (archivage)

---

## 8. Stack recommandée

| Besoin | Outil recommandé | Justification |
|--------|-------------------|---------------|
| Automatisation | **Make** (vs Zapier) | Plus flexible, meilleur rapport qualité/prix, routeurs natifs |
| Facturation | **Pennylane** ou **Sellsy** | API complète, intégration comptable FR, compatible Make |
| Hébergement page vente | **Netlify** ou **Vercel** | Déploiement simple, HTTPS natif, gratuit |
| Monitoring | **Make + Monday** | Logs intégrés + board d'erreurs dédié |

---

## 9. Volumétrie & Coûts Make estimés

| Scénario | Opérations/exécution | Exécutions/jour | Opérations/mois |
|----------|---------------------|-----------------|-----------------|
| Sync Kavkom | ~5 | 300 | 45 000 |
| Nouvelle commande | ~8 | 40 | 9 600 |
| Confirmation paiement | ~6 | 40 | 7 200 |
| Expédition | ~5 | 35 | 5 250 |
| Suivi livraison | ~3 | 35 | 3 150 |
| KPIs quotidiens | ~20 | 1 | 600 |
| **TOTAL** | | | **~70 800** |

**Plan Make recommandé** : Pro (10 000 ops/mois) → Teams (ajustable) selon croissance.
À 70k ops/mois → Plan Teams à ~99€/mois.

---

## 10. Planning de déploiement

| Phase | Durée | Contenu |
|-------|-------|---------|
| **Phase 1** | Semaine 1-2 | Structure Monday.com (4 boards) + connexions API |
| **Phase 2** | Semaine 2-3 | Scénarios Make 1 & 2 (Kavkom sync + Commandes) |
| **Phase 3** | Semaine 3-4 | Scénarios Make 3 & 4 (Paiements + Facturation + Expédition) |
| **Phase 4** | Semaine 4-5 | Dashboards + KPIs + Page de vente interne |
| **Phase 5** | Semaine 5-6 | Tests end-to-end + corrections + formation équipe |
| **Suivi** | Mois 2+ | Optimisation, ajustements, support |
