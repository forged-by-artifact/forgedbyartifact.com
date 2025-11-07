# Artifact – Project & Build Diary Guide

This is my quick guide for adding new portfolio projects that auto‑populate the home page and each project’s build diary page.

---

<details>
<summary><strong>Quick Add Checklist</strong></summary>

1. Make folder: `/projects/<slug>/`   
2. Add images: `cover.jpg`, `detail-1.jpg`, `process-1.jpg`, …  
3. Update `projects/projects.json` with the new entry  
4. Commit & push (home + project page populate automatically)

</details>

---

## 1) Create a folder
Make a new project folder using a short, lowercase slug:

```
/projects/radio-console/
```

---

## 2) Add images
Place images in the project folder.

- Use `cover.jpg` for the main thumbnail.
- Add more like `detail-1.jpg`, `process-1.jpg`, etc.
- Keep names lowercase; prefer `.jpg` for size.

Example:
```
/projects/radio-console/
  cover.jpg
  detail-1.jpg
  process-1.jpg
```

---

## 3) Update `projects/projects.json`
Append a new entry with this shape:

```json
{
  "slug": "radio-console",
  "title": "Retro Radio Console",
  "date": "2025-10-01",
  "tags": ["wood", "electronics", "distressing"],
  "blurb": "Interactive console with aged finish and toggles.",
  "overview": "Optional paragraph about goals/constraints.",
  "thumb": "/projects/radio-console/cover.jpg",
  "images": ["cover.jpg", "detail-1.jpg", "process-1.jpg"],
  "diary": [
    { "title": "Day 1 — Concept & refs", "body": "Notes, sketches, approvals." },
    { "title": "Day 4 — Fabrication", "body": "Materials, jigs, pitfalls." },
    { "title": "Day 8 — Finishing", "body": "Paint/aging stack, sealers." }
  ]
}
```

Notes:
- `images` items are **relative to the project folder** unless you use full URLs.
- Missing fields show as **[TODO]** highlights on the project page until you fill them.

---

## 4) Commit & push
- The **home page** reads `projects/projects.json` and shows a card for each entry.
- The **project page** (e.g. `/projects/radio-console/`) reads its data by matching the folder name to the `slug`.

---

## Tips
- Compress images before pushing (`cwebp`, `imagemagick`).
- Keep slugs permanent once published.
- For a GitHub Pages **project site** under a subpath (e.g., `/artifact/`), ensure the JSON fetch in the home page uses a **relative path**:

```js
// In index.html script (home page) use:
fetch('projects/projects.json')

// In the per‑project template, the loader computes the correct relative path automatically.
```

---

## Troubleshooting
- **Grid empty on home page**: Check console for a 404 to `projects/projects.json`. Ensure it’s at `/projects/projects.json` (or `projects/projects.json` for subpath sites).
- **Images not loading**: Filenames are case‑sensitive on Pages; verify paths match exactly.
- **[TODO] boxes visible**: Those fields are missing in JSON — fill them in and refresh.


