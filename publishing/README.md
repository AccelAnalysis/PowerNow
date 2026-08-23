# Power NOW Publishing Library

This directory is the canonical repository workspace for compiling the **Power NOW** books independently of the deployed storefront application.

## Boundary

- `publishing/` contains book-development and publishing source material.
- Storefront/runtime code remains outside this directory (`app/`, `components/`, `src/`, `data/`, etc.).
- `.vercelignore` excludes `publishing/` from the Vercel deployment build context.
- Nothing under `publishing/` should be imported by storefront runtime code. Storefront merchandising data belongs in `data/books.json`; manuscript content belongs here.

> **Repository visibility:** this repository is currently public. Exclusion from Vercel prevents storefront deployment, but it does **not** make files private on GitHub. Do not commit unpublished manuscript text, unreleased covers, private publishing contracts, ISBN credentials, or other confidential material here unless the repository is made private or the publishing library is moved to a private repository.

## Canonical structure

```text
publishing/
├── README.md
├── SERIES_INDEX.md
└── books/
    ├── 01-clarity-creates-speed/
    ├── 02-start-quicker/
    ├── 03-sustain-better/
    ├── 04-guarding-your-execution-capacity/
    └── 05-multiply-your-wins/
```

Each book uses the same ordered structure:

```text
00-front-matter/
10-introduction/
20-chapters/
30-conclusion/
40-back-matter/
50-covers/
60-production/
```

## File naming

Use lowercase kebab-case and preserve the series-wide chapter number where applicable.

Examples:

```text
20-chapters/chapter-01-define-the-win.md
20-chapters/chapter-06-micro-starts-that-break-the-stall.md
00-front-matter/title-page.md
40-back-matter/about-the-author.md
50-covers/front-cover.jpg
50-covers/back-cover.jpg
```

## How to reference this location

Use the repository-relative path as the canonical reference.

- Whole library: `AccelAnalysis/PowerNow:publishing/`
- A book: `AccelAnalysis/PowerNow:publishing/books/02-start-quicker/`
- A chapter: `AccelAnalysis/PowerNow:publishing/books/02-start-quicker/20-chapters/chapter-06-micro-starts-that-break-the-stall.md`

In ChatGPT/GitHub work, the preferred plain-language reference is:

> **PowerNow Publishing Library → Book 2: Start Quicker**

followed by the exact repo path when precision matters.

For a frozen print/ebook edition, reference the exact Git commit SHA or release tag in addition to the path. That prevents later edits from changing what a historical edition points to.

## Publishing workflow

1. Draft and revise source material in the appropriate book folder.
2. Keep each chapter or matter item in its own file so edits and history remain readable.
3. Place cover/source artwork references in `50-covers/`.
4. Place generated print/ebook artifacts and production notes in `60-production/` only when repository visibility and file-size policy permit it.
5. When an edition is approved, freeze it with a Git tag/release such as `book-01-v1.0.0`.
6. Only copy intentional public excerpts, cover assets, metadata, or purchase information into the storefront side of the repository.
