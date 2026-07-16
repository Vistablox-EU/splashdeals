# CMS architecture notes (admin)

## Route tree

Base: `/admin/cms` (hub dashboard — not a redirect).

Route groups `(content)`, `(engagement)`, `(settings)`, `(tools)` are **URL-invisible**.

```
/admin/cms
├── posts | posts/new | posts/[post-id]
│   └── posts/scheduled → redirects to posts?status=scheduled
├── pages | pages/new | pages/[page-id]
├── categories
├── tags
├── campaigns          # marketplace coupons/discounts (NOT listmonk email)
├── reviews
├── activity
├── navigation
├── redirects
├── webhooks | create | [id]
└── tools | broken-links | not-found-logs | orphaned-media | embed | api-docs
```

Secondary nav + hub links: single config in `app/(dashboard)/admin/cms/_lib/cms-nav.ts`, rendered with active state via `CmsNav`.

## Public delivery

| Content | Public URL |
|---|---|
| Blog posts | `/blog`, `/blog/[slug]`, `/blog/feed.xml` |
| CMS static pages (`Page` model) | `/{slug}` via catch-all `app/(web)/[...slug]` after facility/category resolution |
| Media library | `/admin/media` (outside CMS chrome) |

Slug resolution order (`resolveSlug`): category → facility → **published CMS page**.

## Shared UI shells (SSOT)

| Shell | Path | Used by |
|---|---|---|
| `CmsContentTable` | `_components/cms-content-table.tsx` | posts + pages list clients (search, status filter, filter chips, bulk bar, table body, pagination) |
| List utils | `_lib/cms-list-utils.ts` | status badge variants + `formatCmsDate` |
| `CmsEditorShell` | `_components/cms-editor-shell.tsx` | posts + pages editors (`main` + `sidebar` two-column layout) |
| `CmsEditorSidebarCard` | same file | optional bordered sidebar card helper |
| `TaxonomyManager` | `_components/taxonomy-manager.tsx` | categories + tags managers (thin wrappers) |
| Nav config | `_lib/cms-nav.ts` + `_components/cms-nav.tsx` | layout secondary nav + hub |

Domain-specific columns, bulk actions, and form fields stay in the content clients/editors; chrome is shared.

## Data layer

Prefer loaders in `app/(dashboard)/admin/cms/_data/cms-loaders.ts`:

- posts, pages, categories, tags, reviews
- webhooks, campaigns, facilities
- hub stats, post editor bootstrap data

Server mutations live in `app/(server)/actions/cms/*` (barrel: `actions/cms.ts`).  
Internal UI → server actions only (no API routes from admin UI).

Real-time exceptions (pre-existing external surface):

- `/api/cms/presence` — editor presence
- `/api/cms/preview` — draft preview

## Editor features

- TipTap rich text + content blocks + image upload/media library
- SEO panel (includes SEO scoring once — do not double-mount)
- Readability + internal links panels (posts and pages)
- Social share preview (`pathHint`: blog vs page slug)
- Autosave drafts + beforeunload guard
- Editor presence (requires real `currentUserId` from `requireAdmin()`)
- Post revisions: `RollbackDropdown` + `getBlogPostRevisionsAction` / `getBlogPostRevisionAction`
- Page publish revalidates `/{slug}`; bulk page status/delete actions available

## Loading / errors

Only `cms/loading.tsx` and `cms/error.tsx` at section root — nested duplicates removed.

## Naming

**Kuponi / kampanje** under CMS = facility coupon campaigns (`Campaign` model).  
Email marketing = Listmonk (separate).
