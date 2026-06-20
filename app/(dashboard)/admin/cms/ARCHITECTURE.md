# CMS Module — Architecture & Implementation

## Overview

Enterprise-grade CMS system for Splashdeals.rs, modeled after WordPress editorial workflows. Supports blog posts, static pages, categories, tags, content revisions, SEO metadata, rich text editing, scheduled publishing, and frontend blog delivery.

Built on: Next.js 16 App Router, Prisma (PostgreSQL), ShadCN UI (radix-nova), TipTap editor, Zod v4.

---

## Route Structure

### Admin (under `(dashboard)` route group)

```
/admin/cms
├── page.tsx                    → redirects to /admin/cms/posts
├── error.tsx                   → error boundary
├── loading.tsx                 → AdminSkeleton
├── _components/
│   ├── rich-text-editor.tsx    → TipTap editor with toolbar + image upload plugin
│   ├── seo-panel.tsx           → SERP preview, OG fields, canonical, robots
│   └── image-upload-plugin.ts  → TipTap plugin for drag-drop/paste upload
├── posts/
│   ├── page.tsx                → Server component (fetches + serializes posts)
│   ├── loading.tsx / error.tsx
│   ├── _components/
│   │   ├── posts-list-client.tsx  → TanStack table with filters, pagination, bulk ops
│   │   └── post-editor.tsx        → Full form: title, slug, content, tags, SEO, publish
│   ├── new/page.tsx             → Server page + PostEditor (no post prop)
│   └── [post-id]/page.tsx       → Server page + PostEditor (with post prop)
├── pages/
│   ├── page.tsx                 → Server component (fetches + serializes pages)
│   ├── _components/
│   │   ├── pages-list-client.tsx → Table with filters
│   │   └── page-editor.tsx       → Form: title, slug, content, template, header/footer toggles
│   ├── new/page.tsx
│   └── [page-id]/page.tsx
├── categories/
│   ├── page.tsx                 → Server component
│   └── _components/
│       └── categories-manager.tsx  → Inline CRUD with color picker, post count
└── tags/
    ├── page.tsx                 → Server component
    └── _components/
        └── tags-manager.tsx        → Inline CRUD (SUPER_ADMIN only)
```

### Public (under `(web)` route group)

```
/blog
├── page.tsx                     → Paginated grid (12/post), category badges, reading time
└── [slug]/page.tsx              → Full article + related posts + Article JSON-LD + OG + canonical
```

### Cron / API

```
/(server)/api/cron/publish-blog/route.ts   → Vercel Cron (every 10min), publishes DRAFTs with past publishedAt
```

### Sitemap / RSS

```
/sitemap.ts                      → Blog posts added alongside facilities
/blog/feed.xml/route.ts          → RSS 2.0 feed (50 latest posts)
/robots.ts                       → References sitemap + RSS feed
```

---

## Database Schema (all in `marketing` schema)

### BlogPost
| Field | Type | Purpose |
|-------|------|---------|
| id | uuid | PK |
| title | String | Display title |
| slug | String (unique) | URL path |
| content | Text | HTML from TipTap editor |
| excerpt | Text? | Short summary for lists |
| coverImage / featuredImage | String? | Hero images |
| author | String? | Display name |
| publishedAt | DateTime? | Publish date |
| status | PostStatus enum | DRAFT / PUBLISHED / ARCHIVED |
| categoryId | String? | FK → BlogCategory |
| isFeatured | Boolean | Starred post |
| readingTime | Int | Auto-calculated minutes |
| metaTitle, metaDescription, ogTitle, ogDescription, ogImage | String? | SEO fields |
| canonicalUrl | String? | Custom canonical |
| robotsDirective | String? | noindex/nofollow override |
| schemaMarkup | Json? | Custom JSON-LD |

### BlogPostRevision
| Field | Type | Purpose |
|-------|------|---------|
| id | uuid | PK |
| postId | String | FK → BlogPost (cascade) |
| title | String | Snapshot of title at publish |
| content | Text | Snapshot of content at publish |
| excerpt | Text? | Snapshot of excerpt |
| createdAt | DateTime | Auto timestamp |
| createdBy | String? | User ID |

### BlogCategory
| Field | Type |
|-------|------|
| id, name, slug (unique), description, color (hex), displayOrder |

### BlogTag
| Field | Type |
|-------|------|
| id, name (unique), slug (unique) |

### BlogPostTag (junction)
| Field | Type |
|-------|------|
| postId + tagId (composite PK) |

### Page
Same SEO fields as BlogPost + `template` (default/full-width/landing), `showHeader`, `showFooter` booleans.

---

## Server Actions

Located at: `server/actions/cms.ts` + `app/(server)/actions/cms.ts` (standalone duplicate — avoids circular import via tsconfig `@/server/actions/*` → `./app/(server)/actions/*`)

### CRUD Actions
- `createBlogPostAction(data, tagIds?)` — creates post + optional tag relations + initial revision on publish
- `updateBlogPostAction(id, data, tagIds?)` — updates post + reconnects tags + saves revision on publish
- `deleteBlogPostAction(id)` — SUPER_ADMIN only
- `getBlogPostAction(id)` — returns post + category + tagIds
- `listBlogPostsAction()` — returns posts with category + tag count

Same pattern for: Page, Category, Tag

### Bulk Actions
- `bulkUpdateBlogPostsAction(ids[], status)` — batch publish/draft/archive
- `bulkDeleteBlogPostsAction(ids[])` — batch delete (SUPER_ADMIN)

### Helper
- `calculateReadingTime(html)` — strips HTML, counts words, divides by 200

---

## Zod v4 Validation

All schemas use `.optional()` on non-required fields to avoid runtime type mismatches. Schemas use `z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])` for status. Slug validation: `/^[a-z0-9-]+$/`.

**Important:** Zod v4 `.safeExtend()` must be used instead of `.extend()` when extending schemas with `.refine()`. Current schemas don't use refinements, so this isn't an issue yet.

---

## Key Conventions

1. **Serbian-only admin** — all labels, placeholders, toasts, and error messages are in Serbian
2. **ShadCN theme tokens only** — no hardcoded hex colors
3. **No `setState` in `useEffect`** — React Compiler lint rule; derived state pattern used
4. **No Prisma Decimal spread** — CMS models use only String/Text/Boolean types, no Decimal fields to serialize
5. **Dual-file action pattern** — `server/actions/cms.ts` (logic) + `app/(server)/actions/cms.ts` (standalone copy)
6. **`@ts-nocheck` on editor files** — react-hook-form + Zod v4 resolver has type chain incompatibility; runtime is correct

---

## NPM Dependencies Added

- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/pm`
- `slugify` — auto-generate slugs from titles
- `reading-time` — calculate reading duration from content

---

## Future Enhancements

- **Preview mode:** `/blog/preview/[token]` route that shows draft content via Next.js Draft Mode
- **Media library:** Centralized image browser with thumbnails in TipTap toolbar
- **Sitemap video fix:** Blog posts with video content can get VideoObject schema
- **Related posts model:** `BlogPostRelation` for manual editor-curated related posts
- **Content diff viewer:** Side-by-side diff between revisions
- **Auto-save drafts:** Debounced save to revisions table every 60s while editing
