#!/usr/bin/env python3
"""
Lead Generation — On Purpose France
Genere une liste scoree de structures ESS en Ile-de-France
a partir de donnees publiques (API Recherche Entreprises + PLF Jaune).

Usage : python leadgen.py
"""

import io
import json
import re
import sys
import time
import unicodedata
import xml.etree.ElementTree as ET

# Forcer UTF-8 sur Windows (evite les erreurs cp1252 avec les accents)
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from datetime import date, datetime, timedelta
from pathlib import Path

import requests
import pandas as pd

from config import (
    API_BASE_URL,
    API_PER_PAGE,
    API_MAX_RESULTS,
    API_DELAY,
    API_MAX_RETRIES,
    DEPARTEMENTS_IDF,
    TRANCHES_EFFECTIF_10_PLUS,
    EFFECTIF_LABELS,
    TRANCHES_50_PLUS,
    TRANCHES_250_PLUS,
    SUBVENTIONS_CSV_URL,
    SUBVENTIONS_CACHE_MAX_DAYS,
    JTMS_SITEMAP_URL,
    JTMS_CACHE_MAX_DAYS,
    JTMS_DELAY,
    JTMS_IDF_REGIONS,
    JTMS_STRATEGIC_KEYWORDS,
    SCORING,
    SCORE_QUALIFIED,
    CSV_COLUMNS,
    PARTENAIRES_ON_PURPOSE,
    DEPARTEMENTS_CIBLES,
    SECTIONS_NAF_EXCLUES,
    SCORE_HOT,
)

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"
SUBVENTIONS_CACHE = OUTPUT_DIR / "subventions_cache.csv"
JTMS_CACHE = OUTPUT_DIR / "jtms_cache.csv"

session = requests.Session()
session.headers.update({"User-Agent": "OnPurpose-LeadGen/1.0"})


# ── Helpers ──────────────────────────────────────────────────────────────


def api_get(params: dict) -> dict:
    """GET sur l'API Recherche Entreprises avec retry + backoff."""
    for attempt in range(1, API_MAX_RETRIES + 1):
        time.sleep(API_DELAY)
        resp = session.get(API_BASE_URL, params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 429:
            wait = 2 ** attempt
            print(f"  ⏳ Rate limit (429), retry dans {wait}s…")
            time.sleep(wait)
            continue
        resp.raise_for_status()
    raise RuntimeError(f"Echec API apres {API_MAX_RETRIES} tentatives")


def parse_org(result: dict) -> dict:
    """Transforme un resultat API en dict plat."""
    siege = result.get("siege", {})
    finances_raw = result.get("finances", {}) or {}
    complements = result.get("complements", {}) or {}
    dirigeants_raw = result.get("dirigeants", []) or []

    # Dernier exercice financier disponible (finances = {"2024": {"ca": ..., "resultat_net": ...}})
    ca = None
    resultat_net = None
    if finances_raw:
        latest_year = max(finances_raw.keys())
        latest = finances_raw[latest_year]
        ca = latest.get("ca")
        resultat_net = latest.get("resultat_net")

    # Nature juridique
    nature = result.get("nature_juridique", "")

    # Dirigeants : nom + qualite (personnes physiques uniquement)
    dirigeants = "; ".join(
        f"{d.get('nom', '')} {d.get('prenoms', '')} ({d.get('qualite', '')})"
        for d in dirigeants_raw
        if d.get("nom") and d.get("type_dirigeant") == "personne physique"
    )

    return {
        "siren": result.get("siren", ""),
        "nom": result.get("nom_complet", "") or result.get("nom_raison_sociale", ""),
        "adresse": siege.get("adresse", ""),
        "code_postal": siege.get("code_postal", ""),
        "commune": siege.get("libelle_commune", ""),
        "departement": siege.get("departement", ""),
        "effectif_code": result.get("tranche_effectif_salarie", ""),
        "effectif_label": EFFECTIF_LABELS.get(
            result.get("tranche_effectif_salarie", ""), ""
        ),
        "activite_naf": siege.get("activite_principale", ""),
        "section_naf": result.get("section_activite_principale", ""),
        "nature_juridique": nature,
        "ca": ca,
        "resultat_net": resultat_net,
        "est_ess": bool(complements.get("est_ess")),
        "est_esus": bool(complements.get("est_l100_3")),
        "est_siae": bool(complements.get("est_siae")),
        "est_societe_mission": bool(complements.get("est_societe_mission")),
        "est_association": bool(complements.get("est_association")),
        "dirigeants": dirigeants,
    }


# ── Etape 1 : Extraction API ────────────────────────────────────────────


def fetch_ess_organisations() -> pd.DataFrame:
    """Recupere toutes les organisations ESS 10+ salaries en IDF."""
    print("=" * 60)
    print("ETAPE 1 : Extraction API Recherche Entreprises")
    print("=" * 60)

    seen_sirens: set[str] = set()
    rows: list[dict] = []

    tranches_param = ",".join(TRANCHES_EFFECTIF_10_PLUS)

    for dept in DEPARTEMENTS_IDF:
        page = 1
        dept_count = 0
        print(f"\n> Departement {dept} ...")

        while True:
            params = {
                "est_ess": "true",
                "departement": dept,
                "tranche_effectif_salarie": tranches_param,
                "etat_administratif": "A",
                "per_page": API_PER_PAGE,
                "page": page,
            }
            data = api_get(params)
            results = data.get("results", [])

            if not results:
                break

            for r in results:
                siren = r.get("siren", "")
                if siren and siren not in seen_sirens:
                    seen_sirens.add(siren)
                    rows.append(parse_org(r))
                    dept_count += 1

            total_api = data.get("total_results", 0)
            fetched = page * API_PER_PAGE
            print(
                f"  page {page} — {min(fetched, total_api)}/{total_api} "
                f"(+{len(results)} resultats, {dept_count} nouveaux)",
                end="\r",
            )

            if fetched >= total_api or fetched >= API_MAX_RESULTS:
                break
            page += 1

        print(f"\n  ✓ {dept} : {dept_count} organisations")

    df = pd.DataFrame(rows)
    total_raw = len(df)

    # Filtrer : garder uniquement les sieges en IDF
    # (l'API retourne aussi des orgas dont un etablissement est en IDF
    # mais dont le siege est ailleurs)
    if not df.empty:
        df = df[df["departement"].isin(DEPARTEMENTS_IDF)].reset_index(drop=True)

    print(f"\n-> Total : {len(df)} organisations IDF ({total_raw - len(df)} hors IDF filtrees)")
    return df


# ── Etape 2 : Subventions PLF Jaune ─────────────────────────────────────


def fetch_subventions() -> pd.DataFrame:
    """Telecharge et agrege les subventions par SIREN."""
    print("\n" + "=" * 60)
    print("ETAPE 2 : Subventions PLF Jaune")
    print("=" * 60)

    # Verifier cache
    need_download = True
    if SUBVENTIONS_CACHE.exists():
        cache_age = datetime.now() - datetime.fromtimestamp(
            SUBVENTIONS_CACHE.stat().st_mtime
        )
        if cache_age < timedelta(days=SUBVENTIONS_CACHE_MAX_DAYS):
            print(f"  Cache existant ({cache_age.days}j), reutilisation.")
            need_download = False

    if need_download:
        print(f"  Telechargement du CSV ({SUBVENTIONS_CSV_URL[:60]}…)")
        resp = session.get(SUBVENTIONS_CSV_URL, timeout=120, stream=True)
        resp.raise_for_status()
        SUBVENTIONS_CACHE.parent.mkdir(parents=True, exist_ok=True)

        total = 0
        with open(SUBVENTIONS_CACHE, "wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 256):
                f.write(chunk)
                total += len(chunk)
                print(f"  {total / 1_000_000:.1f} MB telecharges…", end="\r")
        print(f"\n  ✓ Telecharge ({total / 1_000_000:.1f} MB)")

    # Charger et agreger
    print("  Chargement et agregation…")
    try:
        sub = pd.read_csv(
            SUBVENTIONS_CACHE,
            sep=";",
            dtype=str,
            on_bad_lines="skip",
        )
    except Exception as e:
        print(f"  ⚠ Erreur lecture CSV subventions : {e}")
        return pd.DataFrame(columns=["siren", "total_subventions"])

    # Identifier les colonnes SIREN et Montant (noms variables selon les versions)
    siren_col = None
    montant_col = None
    for col in sub.columns:
        cl = col.strip().lower()
        if cl == "siren":
            siren_col = col
        elif "montant" in cl:
            montant_col = col

    if not siren_col or not montant_col:
        print(f"  ⚠ Colonnes introuvables (trouvees : {list(sub.columns[:8])})")
        return pd.DataFrame(columns=["siren", "total_subventions"])

    sub[montant_col] = (
        sub[montant_col]
        .str.replace(",", ".", regex=False)
        .str.replace(" ", "", regex=False)
    )
    sub[montant_col] = pd.to_numeric(sub[montant_col], errors="coerce").fillna(0)

    agg = (
        sub.groupby(siren_col)[montant_col]
        .sum()
        .reset_index()
        .rename(columns={siren_col: "siren", montant_col: "total_subventions"})
    )

    print(f"  ✓ {len(agg)} SIREN avec subventions agregees")
    return agg


# ── Helpers : normalisation de noms ────────────────────────────────────

_FORMES_JURIDIQUES = re.compile(
    r"\b(sas|sarl|sa|scop|scic|eurl|sci|sasu|association|asso|fondation)\b"
)


def normalize_name(name: str) -> str:
    """Normalise un nom d'organisation pour le matching fuzzy."""
    # Lowercase
    s = name.lower()
    # Supprimer accents
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    # Supprimer formes juridiques
    s = _FORMES_JURIDIQUES.sub("", s)
    # Supprimer ponctuation et espaces multiples
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# ── Etape 2b : Offres JTMS ────────────────────────────────────────────


def fetch_jtms_jobs() -> pd.DataFrame:
    """Scrape les offres IDF depuis jobs.makesense.org et retourne un DataFrame agrege par nom."""
    print("\n" + "=" * 60)
    print("ETAPE 2b : Offres JTMS (Jobs That Make Sense)")
    print("=" * 60)

    need_scrape = True
    if JTMS_CACHE.exists():
        cache_age = datetime.now() - datetime.fromtimestamp(JTMS_CACHE.stat().st_mtime)
        if cache_age < timedelta(days=JTMS_CACHE_MAX_DAYS):
            print(f"  Cache existant ({cache_age.days}j), reutilisation.")
            need_scrape = False

    if need_scrape:
        # 1. Parser le sitemap
        print(f"  Telechargement du sitemap ({JTMS_SITEMAP_URL})…")
        resp = session.get(JTMS_SITEMAP_URL, timeout=30)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)

        # Namespace du sitemap XML
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        cutoff = (date.today() - timedelta(days=JTMS_CACHE_MAX_DAYS)).isoformat()
        urls = []
        total_fr = 0
        for url_el in root.findall(".//sm:url", ns):
            loc = url_el.find("sm:loc", ns)
            if loc is None or not loc.text or "/fr/jobs/" not in loc.text:
                continue
            total_fr += 1
            lastmod = url_el.find("sm:lastmod", ns)
            if lastmod is not None and lastmod.text and lastmod.text[:10] < cutoff:
                continue
            urls.append(loc.text)
        print(f"  {total_fr} offres FR dans le sitemap, {len(urls)} recentes (lastmod >= {cutoff})")

        # 2. Scraper chaque page
        jobs = []
        for i, url in enumerate(urls, 1):
            time.sleep(JTMS_DELAY)
            try:
                resp = session.get(url, timeout=20)
                if resp.status_code != 200:
                    continue
                html = resp.text
            except requests.RequestException:
                continue

            # Extraire JSON-LD
            match = re.search(
                r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
                html,
                re.DOTALL,
            )
            if not match:
                continue

            try:
                ld = json.loads(match.group(1))
            except json.JSONDecodeError:
                continue

            # Extraire les champs
            title = ld.get("title", "")
            org_name = ""
            hiring = ld.get("hiringOrganization")
            if isinstance(hiring, dict):
                org_name = hiring.get("name", "")

            # Region(s)
            regions = set()
            locations = ld.get("jobLocation", [])
            if isinstance(locations, dict):
                locations = [locations]
            for loc in locations:
                if isinstance(loc, dict):
                    addr = loc.get("address", {})
                    if isinstance(addr, dict):
                        region = addr.get("addressRegion", "")
                        if region:
                            regions.add(region)

            # Filtrer IDF
            if not regions & JTMS_IDF_REGIONS:
                continue

            jobs.append({
                "title": title,
                "org_name": org_name,
                "url": url,
            })

            print(f"  {i}/{len(urls)} pages scrapees ({len(jobs)} offres IDF)…", end="\r")

        print(f"\n  ✓ {len(jobs)} offres IDF extraites")

        # 3. Sauvegarder cache
        JTMS_CACHE.parent.mkdir(parents=True, exist_ok=True)
        cache_df = pd.DataFrame(jobs)
        if cache_df.empty:
            cache_df = pd.DataFrame(columns=["title", "org_name", "url"])
        cache_df.to_csv(JTMS_CACHE, index=False, encoding="utf-8-sig")

    # Charger cache
    cache_df = pd.read_csv(JTMS_CACHE, dtype=str, encoding="utf-8-sig")
    if cache_df.empty:
        print("  Aucune offre JTMS en IDF.")
        return pd.DataFrame(columns=["nom_normalise", "jtms_offres", "jtms_roles", "jtms_has_strategic"])

    cache_df = cache_df.fillna("")

    # Agreger par nom d'entreprise normalise
    cache_df["nom_normalise"] = cache_df["org_name"].apply(normalize_name)

    # Detecter les roles strategiques
    strategic_lower = [kw.lower() for kw in JTMS_STRATEGIC_KEYWORDS]

    def is_strategic(title: str) -> bool:
        t = title.lower()
        return any(kw in t for kw in strategic_lower)

    agg = (
        cache_df.groupby("nom_normalise")
        .agg(
            jtms_offres=("title", "count"),
            jtms_roles=("title", lambda x: " | ".join(x)),
            jtms_has_strategic=("title", lambda x: any(is_strategic(t) for t in x)),
        )
        .reset_index()
    )

    print(f"  ✓ {len(agg)} organisations avec offres JTMS en IDF")
    return agg


# ── Etape 3 : Scoring ───────────────────────────────────────────────────


def merge_and_score(
    orgs: pd.DataFrame, subs: pd.DataFrame, jtms: pd.DataFrame
) -> pd.DataFrame:
    """Fusionne organisations + subventions + JTMS et calcule le score."""
    print("\n" + "=" * 60)
    print("ETAPE 3 : Scoring")
    print("=" * 60)

    if orgs.empty:
        print("  ⚠ Aucune organisation a scorer.")
        return orgs

    # Left join subventions sur siren
    df = orgs.merge(subs, on="siren", how="left")
    df["total_subventions"] = df["total_subventions"].fillna(0)

    # Left join JTMS sur nom normalise
    df["nom_normalise"] = df["nom"].apply(normalize_name)
    df = df.merge(jtms, on="nom_normalise", how="left")
    df["jtms_offres"] = df["jtms_offres"].fillna(0).astype(int)
    df["jtms_roles"] = df["jtms_roles"].fillna("")
    df["jtms_has_strategic"] = df["jtms_has_strategic"].fillna(False)

    # Calcul du score
    scores = pd.Series(0, index=df.index)

    # Effectif 50+
    mask_50 = df["effectif_code"].isin(TRANCHES_50_PLUS)
    scores += mask_50.astype(int) * SCORING["effectif_50_plus"]

    # Effectif 250+ (cumulable)
    mask_250 = df["effectif_code"].isin(TRANCHES_250_PLUS)
    scores += mask_250.astype(int) * SCORING["effectif_250_plus"]

    # Subventions (non cumulable : on prend le palier le plus haut)
    mask_sub_500k = df["total_subventions"] > 500_000
    mask_sub_100k = (df["total_subventions"] > 100_000) & ~mask_sub_500k
    scores += mask_sub_100k.astype(int) * SCORING["subventions_100k"]
    scores += mask_sub_500k.astype(int) * SCORING["subventions_500k"]

    # ESUS
    scores += df["est_esus"].astype(int) * SCORING["esus"]

    # Societe a mission
    scores += df["est_societe_mission"].astype(int) * SCORING["societe_mission"]

    # SIAE
    scores += df["est_siae"].astype(int) * SCORING["siae"]

    # CA (non cumulable : on prend le palier le plus haut)
    ca = pd.to_numeric(df["ca"], errors="coerce").fillna(0)
    mask_ca_5m = ca > 5_000_000
    mask_ca_1m = (ca > 1_000_000) & ~mask_ca_5m
    scores += mask_ca_1m.astype(int) * SCORING["ca_1m"]
    scores += mask_ca_5m.astype(int) * SCORING["ca_5m"]

    # JTMS (non cumulable : strategique remplace active)
    mask_jtms_strategic = df["jtms_has_strategic"].astype(bool)
    mask_jtms_active = (df["jtms_offres"] > 0) & ~mask_jtms_strategic
    scores += mask_jtms_active.astype(int) * SCORING["jtms_active"]
    scores += mask_jtms_strategic.astype(int) * SCORING["jtms_strategic"]

    df["score"] = scores
    df = df.drop(columns=["nom_normalise", "jtms_has_strategic"])
    df = df.sort_values("score", ascending=False).reset_index(drop=True)

    jtms_matched = (df["jtms_offres"] > 0).sum()
    qualified = (df["score"] >= SCORE_QUALIFIED).sum()
    print(f"  ✓ {jtms_matched} organisations matchees avec JTMS")
    print(f"  ✓ Scoring termine — {qualified} leads qualifies (score >= {SCORE_QUALIFIED})")

    return df


# ── Etape 4 : Export ────────────────────────────────────────────────────


def export(df: pd.DataFrame) -> Path:
    """Exporte le DataFrame en CSV date."""
    print("\n" + "=" * 60)
    print("ETAPE 4 : Export CSV")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"leads_{date.today().isoformat()}.csv"
    filepath = OUTPUT_DIR / filename

    # S'assurer que toutes les colonnes existent
    for col in CSV_COLUMNS:
        if col not in df.columns:
            df[col] = ""

    df[CSV_COLUMNS].to_csv(filepath, index=False, encoding="utf-8-sig")
    print(f"  ✓ {filepath} ({len(df)} lignes)")

    return filepath


# ── Stats ────────────────────────────────────────────────────────────────


def print_stats(df: pd.DataFrame) -> None:
    """Affiche un resume des resultats."""
    print("\n" + "=" * 60)
    print("RESUME")
    print("=" * 60)

    total = len(df)
    qualified = (df["score"] >= SCORE_QUALIFIED).sum() if not df.empty else 0

    print(f"  Total leads         : {total}")
    print(f"  Leads qualifies (≥{SCORE_QUALIFIED}) : {qualified}")

    if not df.empty:
        print(f"\n  Score max : {df['score'].max()}  |  Score moyen : {df['score'].mean():.1f}")

        print("\n  Repartition par departement :")
        dept_counts = df["departement"].value_counts().sort_index()
        for dept, count in dept_counts.items():
            q = (df.loc[df["departement"] == dept, "score"] >= SCORE_QUALIFIED).sum()
            print(f"    {dept} : {count:>5} orgas  ({q} qualifiees)")

        print("\n  Repartition par taille :")
        size_counts = df["effectif_label"].value_counts()
        for label, count in size_counts.items():
            print(f"    {label:>12} : {count:>5}")

        print(f"\n  Top 10 :")
        top = df.head(10)[["siren", "nom", "departement", "effectif_label", "score"]]
        for _, row in top.iterrows():
            print(
                f"    {row['siren']}  {row['nom'][:45]:<45}  "
                f"{row['departement']}  {row['effectif_label']:>10}  "
                f"score={row['score']}"
            )


# ── Etape 3b : Exclusion partenaires On Purpose ──────────────────────────


def exclude_partners(df: pd.DataFrame) -> pd.DataFrame:
    """Exclut les organisations deja partenaires de On Purpose."""
    print("\n" + "=" * 60)
    print("ETAPE 3b : Exclusion partenaires On Purpose")
    print("=" * 60)

    if df.empty:
        return df

    partner_names = {normalize_name(n) for n in PARTENAIRES_ON_PURPOSE}
    df["_nom_norm"] = df["nom"].apply(normalize_name)
    mask = df["_nom_norm"].isin(partner_names)
    excluded = mask.sum()
    excluded_names = df.loc[mask, "nom"].tolist()
    df = df[~mask].reset_index(drop=True)
    df = df.drop(columns=["_nom_norm"])

    print(f"  {len(partner_names)} partenaires dans la liste d'exclusion")
    print(f"  ✓ {excluded} organisations exclues")
    if excluded_names:
        for name in excluded_names[:15]:
            print(f"    - {name}")
        if len(excluded_names) > 15:
            print(f"    … et {len(excluded_names) - 15} autres")

    return df


# ── Etape 3c : Filtrage et segmentation ──────────────────────────────────


def filter_and_segment(df: pd.DataFrame) -> pd.DataFrame:
    """Filtre les leads et ajoute la segmentation Hot/Warm."""
    print("\n" + "=" * 60)
    print("ETAPE 3c : Filtrage et segmentation")
    print("=" * 60)

    if df.empty:
        return df

    before = len(df)

    # 1. Geographie : Paris + petite couronne
    df = df[df["departement"].isin(DEPARTEMENTS_CIBLES)]
    after_geo = len(df)
    print(f"  Geographie ({', '.join(DEPARTEMENTS_CIBLES)}) : {before} -> {after_geo}")

    # 2. Taille : 50+ salaries
    df = df[df["effectif_code"].isin(TRANCHES_50_PLUS)]
    after_size = len(df)
    print(f"  Effectif 50+ : {after_geo} -> {after_size}")

    # 3. Obligatoirement association ou ESUS
    df = df[df["est_association"].astype(bool) | df["est_esus"].astype(bool)]
    after_type = len(df)
    print(f"  Association ou ESUS : {after_size} -> {after_type}")

    # 4. Exclure secteurs non pertinents
    df = df[~df["section_naf"].isin(SECTIONS_NAF_EXCLUES)]
    after_naf = len(df)
    print(f"  Hors NAF {', '.join(sorted(SECTIONS_NAF_EXCLUES))} : {after_type} -> {after_naf}")

    # 5. Score minimum
    df = df[df["score"] >= SCORE_QUALIFIED]
    after_score = len(df)
    print(f"  Score >= {SCORE_QUALIFIED} : {after_naf} -> {after_score}")

    # 6. Segmentation
    df = df.copy()
    df["segment"] = "Warm"
    df.loc[
        (df["score"] >= SCORE_HOT) | (df["jtms_offres"] > 0),
        "segment",
    ] = "Hot"

    hot = (df["segment"] == "Hot").sum()
    warm = (df["segment"] == "Warm").sum()
    print(f"\n  ✓ {after_score} leads retenus : {hot} Hot, {warm} Warm")

    df = df.reset_index(drop=True)
    return df


# ── Main ─────────────────────────────────────────────────────────────────


def main():
    print("On Purpose France — Lead Generation ESS Ile-de-France")
    print(f"Date : {date.today().isoformat()}\n")

    start = time.time()

    orgs = fetch_ess_organisations()
    subs = fetch_subventions()
    jtms = fetch_jtms_jobs()
    df = merge_and_score(orgs, subs, jtms)
    df = exclude_partners(df)
    df = filter_and_segment(df)
    filepath = export(df)
    print_stats(df)

    elapsed = time.time() - start
    print(f"\n✅ Termine en {elapsed:.0f}s — fichier : {filepath}")


if __name__ == "__main__":
    main()
