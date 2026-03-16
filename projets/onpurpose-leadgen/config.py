"""Configuration et constantes pour le script lead gen On Purpose."""

# --- API Recherche Entreprises ---
API_BASE_URL = "https://recherche-entreprises.api.gouv.fr/search"
API_PER_PAGE = 25
API_MAX_RESULTS = 10_000
API_DELAY = 0.15  # secondes entre requetes (< 7 req/s)
API_MAX_RETRIES = 3

# --- Departements Ile-de-France ---
DEPARTEMENTS_IDF = ["75", "77", "78", "91", "92", "93", "94", "95"]

# --- Departements cibles (Paris + petite couronne) ---
DEPARTEMENTS_CIBLES = ["75", "92", "93", "94"]

# --- Tranches effectif salarie (10+ salaries) ---
TRANCHES_EFFECTIF_10_PLUS = [
    "11", "12", "21", "22", "31", "32", "41", "42", "51", "52", "53"
]

# Labels lisibles pour les tranches effectif
EFFECTIF_LABELS = {
    "00": "0 salarié",
    "01": "1-2",
    "02": "3-5",
    "03": "6-9",
    "11": "10-19",
    "12": "20-49",
    "21": "50-99",
    "22": "100-199",
    "31": "200-249",
    "32": "250-499",
    "41": "500-999",
    "42": "1000-1999",
    "51": "2000-4999",
    "52": "5000-9999",
    "53": "10000+",
}

# Tranches 50+ et 250+ pour le scoring
TRANCHES_50_PLUS = {"21", "22", "31", "32", "41", "42", "51", "52", "53"}
TRANCHES_250_PLUS = {"32", "41", "42", "51", "52", "53"}

# --- Subventions PLF Jaune ---
SUBVENTIONS_CSV_URL = (
    "https://www.data.gouv.fr/api/1/datasets/r/"
    "9527d4a9-6e81-4109-913e-830f8d5b5c86"
)
SUBVENTIONS_CACHE_MAX_DAYS = 30

# --- JTMS (Jobs That Make Sense) ---
JTMS_SITEMAP_URL = "https://jobs.makesense.org/sitemap-jobs.xml"
JTMS_CACHE_MAX_DAYS = 7
JTMS_DELAY = 0.3  # politesse scraping
JTMS_IDF_REGIONS = {"Île-de-France", "Ile-de-France"}
JTMS_STRATEGIC_KEYWORDS = [
    "chef de projet", "chargé de mission", "chargée de mission",
    "responsable", "directeur", "directrice", "coordinateur",
    "coordinatrice", "manager",
]

# --- Sections NAF exclues (pas la cible On Purpose) ---
SECTIONS_NAF_EXCLUES = {
    "K",  # Activites financieres et assurance (mutuelles bancaires, credit mutuel…)
    "L",  # Activites immobilieres (HLM, bailleurs sociaux institutionnels)
    "O",  # Administration publique
}

# --- Seuil de segmentation ---
SCORE_HOT = 10  # segment "Hot" si score >= 10 ou JTMS actif

# --- Grille de scoring ---
SCORING = {
    "effectif_50_plus": 2,
    "effectif_250_plus": 3,   # cumulable avec 50+
    "subventions_100k": 2,
    "subventions_500k": 4,    # remplace 100k (non cumulable)
    "esus": 3,
    "societe_mission": 2,
    "siae": 2,
    "ca_1m": 2,
    "ca_5m": 3,               # remplace 1m (non cumulable)
}

SCORING["jtms_active"] = 3       # a une offre active sur JTMS
SCORING["jtms_strategic"] = 5    # remplace jtms_active si role strategique (non cumulable)

SCORE_QUALIFIED = 5  # seuil lead qualifie

# --- Partenaires On Purpose (organisations hotes, a exclure des leads) ---
# Source : https://onpurpose.org/fr/our-community/hosts/ (scrape fevrier 2026)
PARTENAIRES_ON_PURPOSE = [
    # Page 1
    "ANDES",
    "Science Feedback",
    "makesense",
    "Baobab",
    "Ateliers du Bocage",
    "Social Builder",
    "Gobi",
    "Unapei",
    "Rejoue",
    "Centre Primo Levi",
    "Sauvegarde du Nord",
    "Les 2 Rives",
    "AERe",
    "Koom",
    "Emmaus France",
    # Page 2
    "Fondation SEVE",
    "Coup de Pouce",
    "Moulinot",
    "Ecofolio",
    "Coop Media",
    "Akagreen",
    "Fondation de France",
    "mozaik",
    "Espoir",
    "AFT",
    "Cedre",
    # Page 3
    "Restos du Coeur",
    "Fairspace",
    "France Active",
    "Voisin Malin",
    "Aurore",
    "Benenova",
    "Sequences Cles Productions",
    "Groupe SOS",
    "Terravox",
    "Fresque du Climat",
    "Projet Resilience",
    "Solinum",
    "Alliance pour l'Education",
    "Citeo",
    # Page 4
    "Tous Tes Possibles",
    "Energie Partagee",
    "Habitat et Humanisme",
    "Zero Gachis",
    "Energie Solidaire",
    "Momartre",
    "Phitrust",
    "Voix Publique",
    "Emmaus Defi",
    "MicroCred",
    "Alois",
    "Mouves",
    "SOUN",
    # Page 5
    "Sport dans la Ville",
    "Fresque de la Biodiversite",
    "Linkee",
    "Tremplin Handicap",
    "Ares",
    "Ynsect",
    "Comme les Autres",
    "Agence du Don en Nature",
    "Societe Philanthropique",
    "TeleCoop",
    "Labo des Histoires",
    "Le Cube",
    # Page 6
    "ActivAction",
    "Simon de Cyrene",
    "One Heart Communication",
    "Rezo Social",
    "Nightline",
    "Planete Urgence",
    "Les SCOP",
    "ANSA",
    "France Horizon",
    "CLER Reseau pour la Transition Energetique",
    "UNAFO",
    "Caracol",
    "La Fonda",
    "L'Ascenseur",
    # Page 7
    "Switch and Go",
    "Banque Solidaire de l'Equipement",
    "Farinez-vous",
    "Fondation Apprentis d'Auteuil",
    "HENEO",
    "InnovaFeed",
    "Fabrique des Territoires Innovants",
    "L'Ecole des Cuistots Migrateurs",
    "Deafi",
    "Castalie",
    # Page 8
    "Mobilize",
    "13 Avenir",
    "Adie",
    "Alenvi",
    "CNLRQ",
    "Ginkgo",
    "Lita",
    "Danone",
    "Croix-Rouge Insertion",
    "La Croix-Rouge",
    "Service Civique Solidarite Seniors",
    "Unis-Cite",
    "Improve",
    "Lemon Tri",
    # Page 9
    "Amasco",
    "Emmaus Collecte",
    "Unapei 92",
    "Passeport Avenir",
    "Carton Plein",
    "Tablee des Chefs",
    "Samu Social",
    "Etic",
    "Telemaque",
    "Big Bloom",
    "Social Bar",
    # Page 10
    "Ticket for Change",
    "Siel Bleu",
    "Emmaus Alternatives",
    "Fermes d'Avenir",
    "Par le Monde",
    "Decathlon",
    "Plateau Urbain",
    "Defi Service 78",
    "Acces Job",
    "Les Marmites Volantes",
    "Imfusio",
    # Page 11
    "Porticus",
    "Empow'Her",
    "La Vie au Grand Air",
    "EBS Esperance",
    "Force Femmes",
    "Ethikdo",
    "Ecov",
    "Transfairh",
    "ARPEJ",
    "EBS Le Relais Val de Seine",
    "SoScience",
    # Page 12
    "Triethic",
    "Break Poverty",
    "Enercoop",
    "Pur Projet",
]

# --- Colonnes du CSV final ---
CSV_COLUMNS = [
    "siren",
    "nom",
    "adresse",
    "code_postal",
    "commune",
    "departement",
    "effectif_code",
    "effectif_label",
    "activite_naf",
    "section_naf",
    "nature_juridique",
    "ca",
    "resultat_net",
    "est_ess",
    "est_esus",
    "est_siae",
    "est_societe_mission",
    "est_association",
    "dirigeants",
    "total_subventions",
    "jtms_offres",
    "jtms_roles",
    "score",
    "segment",
]
