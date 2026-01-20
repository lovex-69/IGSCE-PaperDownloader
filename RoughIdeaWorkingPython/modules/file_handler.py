# modules/file_handler.py

import os
import re
import json
import shutil
import tempfile
import requests
from PyPDF2 import PdfMerger
from tkinter import filedialog

# -------------------------------------------------
# Paths: base folder + JSON next to this file
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUBJECT_DB_FILE = os.path.join(BASE_DIR, "subject_slugs.json")

# Temp folder for downloads (system temp, safe everywhere)
TEMP_DIR = os.path.join(tempfile.gettempdir(), "caie_bestexam_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# PapaCambridge subject list URLs
IGCSE_SUBJECT_LIST_URL = "https://pastpapers.papacambridge.com/papers/caie/igcse"
ALEVEL_SUBJECT_LIST_URL = "https://pastpapers.papacambridge.com/papers/caie/as-and-a-level"

# In-memory cache for subject map
_SUBJECT_MAP = None


# -------------------------------------------------
# Subject slug helpers (PapaCambridge → BestExamHelp)
# -------------------------------------------------
def _slugify_name_for_bestexamhelp(name: str, code: str) -> str:
    """
    Convert subject name from PapaCambridge into a BestExamHelp-style slug.
    Example:
      "Physics" + "0625" -> "physics-0625"
      "Computer Science - for first examination in 2021" + "9618"
         -> "computer-science-for-first-examination-in-2021-9618"
    """
    # Lowercase + basic cleanup
    s = name.strip().lower()
    s = s.replace("&", " and ")

    # Replace any non-alphanumeric with hyphen
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")

    # Ensure the code is appended
    if not s.endswith(code):
        s = f"{s}-{code}"

    return s


def _parse_subject_page(html: str, level: str):
    """
    Parse a PapaCambridge subject list page.
    Returns dict: code -> { "slug": ..., "level": ... }
      level is one of: "cambridge-igcse", "cambridge-international-a-level"
    """
    subjects = {}

    # Pattern like:
    #   ">  Physics - 0625 <"
    #   ">  Business- 9609 <"
    pattern = re.compile(r">\s*([^<>]*?)\s*-\s*([0-9]{3,4})\s*<")

    for m in pattern.finditer(html):
        raw_name = m.group(1).strip()
        code = m.group(2).strip()

        # Normalise whitespace in name
        name_clean = " ".join(raw_name.split())

        slug = _slugify_name_for_bestexamhelp(name_clean, code)
        subjects[code] = {
            "slug": slug,
            "level": level,
        }

    return subjects


def _build_subject_map():
    """
    Build full subject map from PapaCambridge for:
      - IGCSE
      - AS & A Level

    Result format:
      {
        "0625": { "slug": "physics-0625", "level": "cambridge-igcse" },
        "9702": { "slug": "physics-9702", "level": "cambridge-international-a-level" },
        ...
      }
    """
    mapping = {}

    # IGCSE
    try:
        r = requests.get(IGCSE_SUBJECT_LIST_URL, timeout=12)
        if r.status_code == 200:
            ig_html = r.text
            ig_subj = _parse_subject_page(ig_html, "cambridge-igcse")
            mapping.update(ig_subj)
            print(f"Loaded {len(ig_subj)} IGCSE subjects from PapaCambridge.")
        else:
            print("⚠ Failed to fetch IGCSE subject list from PapaCambridge.")
    except Exception as e:
        print(f"⚠ Error fetching IGCSE subjects: {e}")

    # AS & A Level
    try:
        r = requests.get(ALEVEL_SUBJECT_LIST_URL, timeout=12)
        if r.status_code == 200:
            al_html = r.text
            al_subj = _parse_subject_page(al_html, "cambridge-international-a-level")
            mapping.update(al_subj)
            print(f"Loaded {len(al_subj)} A Level subjects from PapaCambridge.")
        else:
            print("⚠ Failed to fetch AS & A Level subject list from PapaCambridge.")
    except Exception as e:
        print(f"⚠ Error fetching AS & A Level subjects: {e}")

    return mapping


def _load_subject_map():
    """
    Load subject map from JSON next to file_handler.py.
    If missing, build from PapaCambridge and save.
    """
    global _SUBJECT_MAP

    if _SUBJECT_MAP is not None:
        return _SUBJECT_MAP

    # Try loading from disk
    if os.path.exists(SUBJECT_DB_FILE):
        try:
            with open(SUBJECT_DB_FILE, "r", encoding="utf-8") as f:
                _SUBJECT_MAP = json.load(f)
                print(f"Loaded subject_slugs.json with {len(_SUBJECT_MAP)} entries.")
                return _SUBJECT_MAP
        except Exception as e:
            print(f"⚠ Failed to read existing subject_slugs.json: {e}")

    # Build fresh from PapaCambridge
    print("Building subject_slugs.json from PapaCambridge (IGCSE + A Level)...")
    built = _build_subject_map()
    _SUBJECT_MAP = built

    # Save to disk (best effort)
    try:
        with open(SUBJECT_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(_SUBJECT_MAP, f, ensure_ascii=False, indent=2)
        print(f"Saved subject map to {SUBJECT_DB_FILE}")
    except Exception as e:
        print(f"⚠ Could not write subject_slugs.json: {e}")

    return _SUBJECT_MAP


def _get_subject_info(subCode: str):
    """
    Return (slug, level) for a subject code using the subject map.
    level is the BestExamHelp path segment, e.g.:
      - "cambridge-igcse"
      - "cambridge-international-a-level"
    If not found: (None, None)
    """
    subCode = str(subCode).strip()
    mapping = _load_subject_map()

    info = mapping.get(subCode)
    if not info:
        print(f"⚠ No subject mapping found for code {subCode}.")
        return None, None

    slug = info.get("slug")
    level = info.get("level")
    if not slug or not level:
        print(f"⚠ Incomplete mapping for code {subCode}: {info}")
        return None, None

    return slug, level


# -------------------------------------------------
# Filename patterns for BestExamHelp
# -------------------------------------------------
def _two_digit_year(year):
    """Ensure year is in two-digit form (e.g. 23 for 2023 or '23')."""
    try:
        y = int(year)
    except Exception:
        y = int(str(year)[-2:])
    return f"{y:02d}"


def _generate_filenames(subCode, paperCode, year, variant, session, paperType, include_er_variants=False):
    """
    Return a list of plausible filenames to try on BestExamHelp.

    Examples:
      0625_m25_qp_22.pdf
      0625_m25_qp22.pdf
      0625_m25_qp_2.pdf
      0625_s23_er.pdf     (for examiner reports)
    """
    yy = _two_digit_year(year)
    sc = subCode
    pc = paperCode if paperCode else ""
    v = variant if variant else ""
    s = session  # 'm','s','w'
    pt = paperType  # 'qp', 'ms', 'er'

    candidates = []

    if pc:
        # Typical patterns for QP / MS
        candidates.append(f"{sc}_{s}{yy}_{pt}_{pc}{v}.pdf")
        candidates.append(f"{sc}_{s}{yy}_{pt}_{pc}.pdf")
        candidates.append(f"{sc}_{s}{yy}_{pt}{v}_{pc}.pdf")
        candidates.append(f"{sc}_{s}{yy}_{pt}{v}{pc}.pdf")
        candidates.append(f"{sc}-s{yy}-{pt}-{pc}{v}.pdf")
        candidates.append(f"{sc}-s{yy}-{pt}-{pc}.pdf")
        candidates.append(f"{sc}-s{yy}-{pc}-{pt}{v}.pdf")
        candidates.append(f"{sc}-s{yy}-{pc}-{pt}.pdf")
        candidates.append(f"{sc}_{yy}_{pt}_{pc}{v}.pdf")
        candidates.append(f"{sc}{yy}_{pt}_{pc}{v}.pdf")
    else:
        # For ER or files without paper code
        candidates.append(f"{sc}_{s}{yy}_{pt}{v}.pdf")
        candidates.append(f"{sc}_{s}{yy}_{pt}.pdf")
        candidates.append(f"{sc}-s{yy}-{pt}{v}.pdf")
        candidates.append(f"{sc}-s{yy}-{pt}.pdf")
        candidates.append(f"{sc}_{yy}_{pt}.pdf")

    # Deduplicate while keeping order
    seen = set()
    out = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            out.append(c)
    return out


def _build_url_from_filename(level: str, subject_slug: str, year_full: str, filename: str) -> str:
    """
    Construct a full BestExamHelp URL:
      - level: "cambridge-igcse" or "cambridge-international-a-level"
      - subject_slug: e.g. "physics-0625"
      - year_full: "2025"
      - filename: "0625_m25_qp_22.pdf"
    """
    return f"https://bestexamhelp.com/exam/{level}/{subject_slug}/{year_full}/{filename}"


# -------------------------------------------------
# Download helper
# -------------------------------------------------
def _try_download(url, dest_path, timeout=12):
    """
    Attempt to GET the URL and write to dest_path.
    Returns True on successful PDF-like download, False otherwise.
    """
    try:
        resp = requests.get(url, timeout=timeout, stream=True)
    except Exception as e:
        print(f"⚠ Request failed for {url}: {e}")
        return False

    if resp.status_code != 200:
        return False

    try:
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    except Exception as e:
        print(f"⚠ Error writing to {dest_path}: {e}")
        if os.path.exists(dest_path):
            try:
                os.remove(dest_path)
            except Exception:
                pass
        return False

    # Basic validation: size + PDF header
    try:
        if os.path.getsize(dest_path) < 400:
            os.remove(dest_path)
            return False

        with open(dest_path, "rb") as f:
            header = f.read(4)
            if not header.startswith(b"%PDF"):
                os.remove(dest_path)
                return False
    except Exception:
        try:
            os.remove(dest_path)
        except Exception:
            pass
        return False

    return True


# -------------------------------------------------
# Public: download_paper
# -------------------------------------------------
def download_paper(subCode, paperCode, year, variant, session, paperType,
                   source="bestexamhelp", subject_slugs=None):
    """
    Download a paper from BestExamHelp and save it into TEMP_DIR.

    - subCode: subject code string like '0625', '0580', '9709'
    - paperCode: e.g. '22' or '4' or None (for ER)
    - year: two-digit or four-digit year; converted internally
    - variant: e.g. '2' or None
    - session: 'm' (Feb/March), 's' (May/June), 'w' (Oct/Nov)
    - paperType: 'qp', 'ms', 'er'
    - source: must be 'bestexamhelp'
    - subject_slugs: currently ignored (mapping comes from PapaCambridge)

    Returns True if a file was successfully downloaded, False otherwise.
    """
    if source != "bestexamhelp":
        print("⚠ download_paper currently supports only BestExamHelp.")
        return False

    yy = _two_digit_year(year)
    year_full = f"20{yy}"

    # Get subject info (slug + level) from disk-backed map
    subject_slug, level = _get_subject_info(subCode)
    if not subject_slug or not level:
        print(f"⚠ Cannot determine BestExamHelp path for subject code {subCode}.")
        return False

    filenames = _generate_filenames(
        subCode, paperCode, yy, variant, session, paperType,
        include_er_variants=(paperType == "er")
    )

    for fname in filenames:
        url = _build_url_from_filename(level, subject_slug, year_full, fname)
        dest = os.path.join(TEMP_DIR, fname)

        print(f"Attempting URL -> {url}")
        ok = _try_download(url, dest)
        if ok:
            print(f"Downloaded: {fname}")
            return True

    print(f"No valid file found for {subCode} {paperType} {paperCode} {session}{yy}")
    return False


# -------------------------------------------------
# Clear temp files
# -------------------------------------------------
def clear_temp_files():
    """
    Remove files inside the TEMP_DIR. Do NOT remove the directory itself.
    """
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR, exist_ok=True)
        return

    for entry in os.listdir(TEMP_DIR):
        path = os.path.join(TEMP_DIR, entry)
        try:
            if os.path.isfile(path) or os.path.islink(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
        except Exception:
            pass


# -------------------------------------------------
# Compile PDFs into one file
# -------------------------------------------------
def compile_pdf(subCode, paperCode, start, end,
                delete_blanks=False, delete_additional=False, delete_formulae=False):
    """
    Merge all PDFs in TEMP_DIR into one file and ask the user
    where to save the final output PDF.

    delete_blanks / delete_additional / delete_formulae are accepted
    for compatibility but not currently used.
    """
    try:
        files = [f for f in os.listdir(TEMP_DIR) if f.lower().endswith(".pdf")]
    except Exception:
        return False

    if not files:
        return False

    files.sort()
    merger = PdfMerger()

    try:
        for f in files:
            path = os.path.join(TEMP_DIR, f)
            merger.append(path)

        default_name = f"{subCode}_{paperCode}_{start}-{end}.pdf"

        save_path = filedialog.asksaveasfilename(
            defaultextension=".pdf",
            initialfile=default_name,
            filetypes=[("PDF Files", "*.pdf")]
        )

        if not save_path:
            merger.close()
            return False

        with open(save_path, "wb") as out_f:
            merger.write(out_f)

        merger.close()
        print(f"Saved merged PDF to: {save_path}")
        return True

    except Exception as e:
        print(f"⚠ Error while merging/saving PDF: {e}")
        try:
            merger.close()
        except Exception:
            pass
        return False
