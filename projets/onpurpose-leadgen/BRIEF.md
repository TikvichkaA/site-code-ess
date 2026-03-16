# On Purpose -- Lead Generation Tool Brief

## Contexte

**On Purpose France** est un programme d'1 an de transition de carriere vers l'economie a impact social/environnemental.
- Fonde en 2010 (Londres), present a Paris depuis 2014/2015
- Equipe de 5 personnes, 204 rue de Crimee, 75019 Paris
- SIREN : 809294994
- ~300 professionnels accompagnes depuis 2015, dans ~70 organisations hotes

## Le Programme Associe

### Structure
- Duree : 1 an, 2 cohortes/an (avril + octobre)
- 2 placements de 6 mois en CDD dans 2 organisations differentes
- 4,5 jours/semaine en mission + 0,5 jour formation/cohorte
- Coaching individuel + mentorat bi-mensuel
- Mini-MBA en leadership social integre

### Profil des associes
- Professionnels en reconversion (moyenne ~32 ans)
- Ex-conseil, finance, tech, marketing -- profils strategiques
- Pas des stagiaires : chefs de projet / futurs dirigeants ESS

### Modele economique (cote organisation hote)
- **Salaire associe** : ~24 500 EUR brut/an (pro rata 6 mois ~ 12 250 EUR)
- **Fee On Purpose** : 8 000 - 19 000 GBP (~9 000 - 22 000 EUR) selon taille/structure
- **Fee de recrutement** (si embauche post-programme) : 9 000 - 16 500 GBP
- **Cout total pour 1 placement de 6 mois** : ~21 000 - 34 000 EUR all-in

### Types de missions (strategiques, pas operationnelles)
- Strategie de levee de fonds / fundraising
- Conception et lancement de nouveaux produits/services
- Mesure et pilotage d'impact social
- Transformation digitale
- Developpement de partenariats strategiques
- Strategie de communication / marque
- Management et developpement de programmes
- Business development / modele economique

### Resultats
- ~1/3 des associes sont embauches par une de leurs orgas hotes
- ~85% continuent leur carriere dans l'ESS apres le programme

---

## Objectif Lead Generation

### Volume necessaire
- **20 placements / 6 mois** = 40 organisations hotes / an
- Taux de conversion outbound estime : 2-5%
- **Pipeline necessaire : 400-1000 structures qualifiees contactees / cycle de 6 mois**
- L'equipe actuelle a du mal a boucler les 20 placements par cohorte

### Organisations hotes connues (exemples)

| Organisation | Secteur | Taille estimee |
|---|---|---|
| Enercoop | Energie renouvelable cooperative | 250+ |
| ADIE | Microcredit / insertion economique | 1000+ |
| Mom'artre | Education / egalite des chances | 50-100 |
| Croix-Rouge insertion | Insertion professionnelle | 1000+ |
| Mozaik RH | Recrutement inclusif / diversite | 20-50 |
| Fermes d'Avenir | Agriculture durable | 10-50 |
| ecov | Mobilite partagee | 20-50 |
| SynLab | Education / innovation sociale | 10-50 |
| Groupe SOS | Multisectoriel ESS (sante, education, insertion...) | 20 000+ |
| (IM)PROVE | Conseil en impact social | 10-20 |
| PUR Projet | Agroforesterie / compensation carbone | 50-100 |

---

## Criteres de ciblage pour le script

### Geographie
- **Ile-de-France uniquement** (departements : 75, 77, 78, 91, 92, 93, 94, 95)

### Taille minimum
- **10+ salaries** (codes tranche effectif : 11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 53)
- Idealement 20+ pour capacite budgetaire

### Formes juridiques cibles
| Code INSEE | Type |
|---|---|
| 9220 | Association declaree |
| 9221 | Association declaree d'insertion par l'activite economique |
| 9222 | Association intermediaire |
| 9230 | Association declaree reconnue d'utilite publique |
| 5460 | SARL cooperative (SCOP) |
| 5547 | SA cooperative de production (SCOP) |
| 5553 | SA cooperative de consommation |
| 5560 | SA cooperative |
| 5710 | SAS (peut etre ESS/ESUS) |
| 8510 | Fondation |

### Secteurs NAF prioritaires (section + codes)
- **Q** : Sante humaine et action sociale (88.10A insertion, 88.99B action sociale, 87.x hebergement medico-social)
- **S** : Autres activites de services (94.x organisations associatives)
- **P** : Enseignement
- **O** : Administration publique (certaines structures parapubliques)
- **A** : Agriculture (cooperatives agricoles, circuits courts)
- **D/E** : Energie / Eau-dechets (cooperatives energetiques type Enercoop)
- **N** : Activites de services administratifs et de soutien (insertion par le travail)
- **J** : Information et communication (medias solidaires, tech for good)
- **M** : Activites specialisees (conseil en impact, R&D sociale)
- **K** : Activites financieres (microcredit type ADIE, finance solidaire)

### Signaux de qualification (scoring)

| Signal | Score | Source |
|---|---|---|
| 50+ salaries | +2 | API Recherche Entreprises (tranche effectif) |
| 250+ salaries | +3 | API Recherche Entreprises |
| Recoit >100K EUR subventions/an | +2 | PLF Jaune CSV (data.gouv.fr) |
| Recoit >500K EUR subventions/an | +4 | PLF Jaune CSV |
| Agree ESUS | +3 | API Recherche Entreprises (complements) |
| Societe a mission | +2 | API Recherche Entreprises (est_societe_mission) |
| SIAE (insertion par l'activite economique) | +2 | API Recherche Entreprises (est_siae) |
| Publie des offres d'emploi actuellement | +3 | A enrichir (LinkedIn/Indeed) |
| A poste un role "chef de projet" / "charge de mission" | +5 | A enrichir (LinkedIn/Indeed) |
| CA > 1M EUR | +2 | API Recherche Entreprises (finances) |
| CA > 5M EUR | +3 | API Recherche Entreprises (finances) |
| Membre Impact France / reseau ESS identifie | +2 | A enrichir manuellement |

**Seuil lead qualifie : score >= 5**

---

## Sources de donnees

### Source principale : API Recherche d'Entreprises
- **URL** : `https://recherche-entreprises.api.gouv.fr/search`
- **Authentification** : aucune (API ouverte)
- **Rate limit** : 7 requetes/seconde
- **Pagination** : max 25 resultats/page, plafond 10 000 resultats
- **Filtres cles** : `est_ess`, `tranche_effectif_salarie`, `nature_juridique`, `departement`, `section_activite_principale`, `etat_administratif`, `categorie_entreprise`

### Codes tranche effectif salarie (INSEE)
| Code | Effectif |
|---|---|
| 00 | 0 salarie |
| 01 | 1-2 |
| 02 | 3-5 |
| 03 | 6-9 |
| 11 | 10-19 |
| 12 | 20-49 |
| 21 | 50-99 |
| 22 | 100-199 |
| 31 | 200-249 |
| 32 | 250-499 |
| 41 | 500-999 |
| 42 | 1000-1999 |
| 51 | 2000-4999 |
| 52 | 5000-9999 |
| 53 | 10000+ |

### Source secondaire : PLF Jaune subventions
- **URL CSV** : `https://www.data.gouv.fr/api/1/datasets/r/9527d4a9-6e81-4109-913e-830f8d5b5c86`
- **Taille** : 16,2 MB, separateur `;`
- **Colonnes** : Programme, SIREN, NIC, Denomination, Montant, Objet 2023, Convention 2022, Date creation, Etat administratif, Categorie juridique, COG code, COG libelle
- **Usage** : croiser par SIREN pour identifier les structures recevant des subventions significatives

### Enrichissement contacts (phase ulterieure)
- **Pharow** (89-139 EUR/mois) : base francaise 4M entreprises, 10M contacts
- **Dropcontact** (24 EUR/mois) : generation d'emails RGPD-compliant
- **Waalaxy** (gratuit-21 EUR/mois) : outreach LinkedIn automatise
- **Kaspr** (gratuit-45 EUR/mois) : enrichissement LinkedIn -> email/tel

---

## Architecture du script

### Etape 1 : Extraction API Recherche Entreprises
- Requeter par departement IDF x tranche effectif (10+) x est_ess=true
- Gerer la pagination (max 10 000 resultats par combinaison de filtres)
- Stocker en CSV intermediaire

### Etape 2 : Enrichissement subventions
- Telecharger le CSV PLF Jaune
- Agreger les montants par SIREN
- Joindre au fichier principal

### Etape 3 : Scoring
- Appliquer la grille de scoring ci-dessus
- Trier par score decroissant

### Etape 4 : Export
- CSV final avec colonnes : SIREN, nom, adresse, code postal, departement, effectif, CA, secteur NAF, forme juridique, ESS/ESUS/SIAE/societe_mission, subventions totales, score, dirigeants (si disponibles)
- Pret a importer dans Pharow ou un CRM

### Contraintes techniques
- Rate limit : max 7 req/s -> delai 0.15s entre requetes
- Plafond 10 000 resultats par requete -> decouper par departement + tranche effectif si necessaire
- Gestion des erreurs / retry sur 429
- Idempotent : pouvoir relancer sans doublons (dedup par SIREN)
