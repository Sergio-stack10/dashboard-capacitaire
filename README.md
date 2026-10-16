# Dashboard capacitaire – Roadmap Auchan

Site statique (HTML/CSS/JS + Chart.js), 3 pages : prévu / prévu vs planifié / planifié vs réalisé.

## Structure
- `index.html` : les 3 pages
- `css/style.css`, `js/app.js` : styles et logique (charge `data/roadmap.json`)
- `data/roadmap.json` : prévisions, ETP et capa par activité (52 semaines 2026)
- `scripts/extract_roadmap.py` : régénère le JSON depuis le fichier roadmap `.xlsm`
- `render.yaml` : déploiement Render (static site)

## Mettre à jour les données
    pip install -r requirements.txt
    python scripts/extract_roadmap.py RM_Auchan_S43.xlsm
    git add data/roadmap.json && git commit -m "maj roadmap" && git push

## Test en local
    python -m http.server 8000   # puis http://localhost:8000
(ouvrir `index.html` directement ne marche pas : le navigateur bloque `fetch` en `file://`)

## À venir
`data/planifie.json` (page 2) et `data/realise.json` (page 3).
