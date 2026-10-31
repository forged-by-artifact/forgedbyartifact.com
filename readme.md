# forgedbyartifact.com

Static portfolio site for **Artifact**. Every push to `main` rebuilds the site with GitHub Actions and publishes it to GitHub Pages. There's no server and no database: the site is made from the folders in `projects/`.

## Add a project (the whole workflow)

1. Make a folder: `projects/radio-console/`. The folder name becomes the page address (`/work/radio-console/`), so use lowercase with dashes.
2. Drop your photos into it, straight off the phone. Big files are fine because the build makes web-sized copies.
3. Add a `project.md` file. You can copy [`projects/_template/project.md`](projects/_template/project.md). The smallest one that works is:

   ```markdown
   ---
   title: Retro Radio Console
   date: 2026-01-15
   ---
   A sentence or two about it.
   ```

4. Commit. About a minute later it's live, on the home page and on its own page.

**From a phone:** in your phone's browser on github.com, open `projects/` and choose **Add file → Create new file**. Type `radio-console/project.md` as the name; the slash creates the folder. Then open that folder, choose **Add file → Upload files**, and add the photos.

### How `project.md` turns into a page

```markdown
---
title: Banana for Scale
date: 2025-11-01
status: in-progress          # shows the orange "On the bench" flag
tags: [cardboard, foam]
blurb: An exploration of scale and low-cost material.
---
Overview paragraph → "The brief" section.

## 3D Puzzle Cardboard Test      ← each ## heading is a build-log entry
Text about this step.
021.jpg 022.jpg                  ← photo names on their own line attach to the entry
https://youtu.be/3f4u6ax3Cj4 Laser test   ← YouTube link (+ optional title) = video tile
```

- **Unlisted photos:** any photo in the folder that `project.md` never mentions still appears, in a "More photos" section at the bottom of the page.
- **Hiding a photo:** start its filename with `_`, or list it under `hidden:`.
- **Cover photo:** set with `cover:`. Otherwise the build uses a file named `cover.jpg`, and failing that the first photo used on the page.
- **Tag numbers:** "No. 006" style numbers come from `no:`. Leave it out and new projects get the next number.
- **Home-page feature card:** shows a project with `featured: true`, otherwise the newest one that's `in-progress`, otherwise the newest project.
- **Short phone clips:** `.mp4` files work. Keep them small, since GitHub rejects files over 100 MB. Longer videos belong on YouTube.
- **iPhone files:** browsers can't show `.heic` photos or `.mov` videos, and the build warns about them. Export as `.jpg` or `.mp4` instead.

## Site text

The headline, intro, skills strip, contact block and email address are all in [`site.yml`](site.yml).

## Run it locally (optional)

```sh
npm install
npm run build      # writes the finished site to _site/
npm run serve      # serves _site/ at http://localhost:3000
```

The design lives in `build/templates.mjs` (HTML), `assets/site.css`, and `assets/site.js`, which handles the filters and the photo viewer.

## One-time GitHub setting

Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. The custom domain comes from the `CNAME` file, which the build copies over.
