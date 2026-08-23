# Power NOW Series Index

The publishing library is organized as one folder per book so manuscript development stays separate from storefront implementation.

| Book | Working title | Canonical path |
| --- | --- | --- |
| 1 | Clarity Creates Speed | `publishing/books/01-clarity-creates-speed/` |
| 2 | Start Quicker | `publishing/books/02-start-quicker/` |
| 3 | Sustain Better | `publishing/books/03-sustain-better/` |
| 4 | Guarding Your Execution Capacity | `publishing/books/04-guarding-your-execution-capacity/` |
| 5 | Multiply Your Wins | `publishing/books/05-multiply-your-wins/` |

## Source-of-truth rule

The files under a book's publishing directory are the manuscript/publishing source of truth. `data/books.json` is the storefront catalog source of truth and should contain only the public commerce/merchandising projection needed by the website.

When a public excerpt is intentionally published on the storefront, record its source publishing path in the corresponding implementation notes so the public copy can be reconciled with the manuscript later.
