# Paper

The manuscript for `jspsych-ado`, intended for the
[Journal of Open Source Software](https://joss.theoj.org/). It doubles as a tutorial:
a worked numeric-discrimination (numerosity) example with a psychometric function, the
general adaptive-design interface, and the math of Bayesian adaptive design.

The paper lives on the dedicated **`joss`** branch (the convention used by, e.g.,
stan-playground).

## Files

- `paper.tex` — **the source you edit** (on Overleaf or locally). Uses `joss.cls`.
- `joss.cls` — an **unofficial JOSS-style** class (logo header, left metadata sidebar,
  ORCID author block, sans headings, footer citation). It *approximates* the JOSS look
  so we can draft in LaTeX — JOSS itself has no official LaTeX class.
- `logo.png` — the JOSS logo used in the header.
- `paper.bib` — BibTeX references (sources from issue #35; a few marked `VERIFY`/`TODO`).
- `figures/` — figures referenced from the paper.

## Editing / Overleaf

> **Overleaf draft:** TODO — paste the share link here.

Write in `paper.tex`. It compiles with **pdfLaTeX** (default everywhere, incl. Overleaf);
for the exact JOSS mono font, compile with **LuaLaTeX/XeLaTeX** with the
[Hack font](https://github.com/source-foundry/Hack) installed. Author metadata uses
`authblk` + `orcidlink`; the left sidebar is the `\josssidebar{...}` block in `paper.tex`;
the footer line is `\jossfooter{...}`.

To sync this branch with Overleaf, use Overleaf's Git integration (its project is a
single `main` branch) via a local intermediary repo, mapping `joss` ↔ Overleaf `main`
with refspecs — see Overleaf's "advanced git operations" docs.

## Previewing the PDF

- **Locally:** `latexmk -pdf paper.tex` (or LuaLaTeX for Hack) → `paper.pdf`.
- **CI:** any push touching `paper/` runs the **Build paper (LaTeX draft)** Action,
  which compiles `paper.tex` and uploads `paper.pdf` as an artifact (Actions run →
  Artifacts → `paper`).

## Submitting to JOSS

JOSS only accepts **Markdown** (`paper.md`), styled by its own Open Journals (Inara)
pipeline — `joss.cls` here is just a drafting approximation, not the official style.
When ready to submit, convert the LaTeX to Markdown (e.g. `pandoc paper.tex -o body.md`)
and add the JOSS YAML metadata header; the official styled PDF is then produced by JOSS.

## Requirements to keep in mind

- Length: **750–1750 words**.
- Required sections (all present in `paper.tex`): Summary, Statement of need, State of
  the field, Software design, Research impact statement, AI usage disclosure.
- The public `registerModel`/`createTimeline` interface (issue #29) is **not yet
  finalized**, so the Software-design and Example sections are present as outlines.
- Author surnames/order/affiliations and a few bib fields are still `TODO`.
