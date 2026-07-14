# Phase 7 — Multi-locale Database Content

## Goal

Support locale-aware (Serbian/English) content in the database: facility descriptions, FAQ items, blog posts, CMS pages, and category names.

## Approach

Use translation tables (`*Translation`) linked to the original entity by `entityId + locale`. Serbian is the source of truth — if no translation exists for the requested locale, fall back to the original Serbian content.

## Prisma Schema Changes

```prisma
model FacilityTranslation {
  id          String   @id @default(cuid())
  facilityId  String
  locale      String   // "sr" or "en"
  name        String?
  description String?
  city        String?
  streetName  String?
  streetNumber String?
  
  facility    Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  
  @@unique([facilityId, locale])
  @@index([facilityId])
}

model FaqTranslation {
  id        String @id @default(cuid())
  faqId     String
  locale    String
  question  String?
  answer    String?
  
  faq       FaqItem @relation(fields: [faqId], references: [id], onDelete: Cascade)
  
  @@unique([faqId, locale])
  @@index([faqId])
}

model BlogPostTranslation {
  id        String @id @default(cuid())
  postId    String
  locale    String
  title     String?
  content   String?
  excerpt   String?
  slug      String?  // English slug for /en/blog/...
  
  post      BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  @@unique([postId, locale])
  @@index([postId])
}

model CmsPageTranslation {
  id      String @id @default(cuid())
  pageId  String
  locale  String
  title   String?
  content String?
  
  page    CmsPage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  @@unique([pageId, locale])
  @@index([pageId])
}
```

## Data Fetching Pattern

```ts
// Utility: merge translations into entity
function withLocale<T extends { id: string }, X>(
  entity: T,
  translations: X[],
  locale: string,
): T & Partial<X> {
  if (locale === "sr") return entity; // Serbian is the source — no merge needed
  const t = translations.find((tr: any) => tr.locale === locale);
  if (!t) return entity; // No translation — fall back to Serbian
  return { ...entity, ...t };
}
```

## Files to Modify

1. `prisma/schema.prisma` — add translation models
2. `prisma/seed.ts` or new seed migration — copy existing content as Serbian translations
3. `app/(web)/facility/_data/getFacilityQuery.ts` — include translations by locale
4. `app/(web)/blog/[slug]/page.tsx` — include blog translations
5. `app/(server)/actions/cms/content.ts` — include CMS page translations

## Backward Compatibility

- All translation fields are optional (`String?`)
- When locale is "sr", no translation join is needed — existing queries unchanged
- When locale is "en" and no translation exists, entity data is returned as-is (Serbian fallback)
