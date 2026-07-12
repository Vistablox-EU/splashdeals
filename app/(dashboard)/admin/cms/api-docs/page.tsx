import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API dokumentacija | CMS | Splashdeals",
};

export default function CmsApiDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold">API dokumentacija</h1>
      <p className="text-muted-foreground mb-8">
        Javni API endpointi za CMS sadržaj. Svi zahtevi zahtevaju API ključ u
        Authorization header-u.
      </p>

      {/* Autentifikacija */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Autentifikacija</h2>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="text-sm">
            <code>
              Authorization: Bearer {"{your_api_key}"}
              {"\n"}
              Content-Type: application/json
            </code>
          </pre>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          API ključeve možete kreirati u{" "}
          <a href="/admin/api-keys" className="text-primary underline">
            podešavanjima API ključeva
          </a>
          .
        </p>
      </section>

      {/* GET /api/cms/posts */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Lista blog objava</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              GET
            </span>
            <code className="text-sm">/api/cms/posts</code>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-sm">
              <code>
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://www.splashdeals.rs/api/cms/posts`}
              </code>
            </pre>
          </div>
          <div className="text-muted-foreground text-sm">
            <p className="mb-2 font-medium text-foreground">Parametri (query string):</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <code className="text-xs">status</code> — filter po statusu (DRAFT, REVIEW,
                PUBLISHED, ARCHIVED)
              </li>
              <li>
                <code className="text-xs">category</code> — filter po kategoriji (slug)
              </li>
              <li>
                <code className="text-xs">limit</code> — broj rezultata (default 10, max 50)
              </li>
              <li>
                <code className="text-xs">offset</code> — pomak za paginaciju
              </li>
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Odgovor
            </p>
            <pre className="text-xs">
              <code>{`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Naslov objave",
      "slug": "naslov-objave",
      "excerpt": "Kratak opis...",
      "content": "<p>HTML sadržaj</p>",
      "coverImage": "https://...",
      "status": "PUBLISHED",
      "category": { "id": "uuid", "name": "Kategorija", "slug": "kategorija" },
      "tags": ["tag1", "tag2"],
      "author": "Ime Autora",
      "publishedAt": "2025-01-15T10:00:00Z",
      "createdAt": "2025-01-15T10:00:00Z",
      "readingTime": 5
    }
  ],
  "meta": {
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* GET /api/cms/posts/:slug */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Pojedinačna blog objava</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              GET
            </span>
            <code className="text-sm">/api/cms/posts/{"{slug}"}</code>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-sm">
              <code>
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://www.splashdeals.rs/api/cms/posts/kako-odabrati-bazen`}
              </code>
            </pre>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Odgovor
            </p>
            <pre className="text-xs">
              <code>{`{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Naslov objave",
    "slug": "kako-odabrati-bazen",
    "content": "<p>HTML sadržaj</p>",
    "excerpt": "Kratak opis...",
    "coverImage": "https://...",
    "featuredImage": null,
    "status": "PUBLISHED",
    "category": { "id": "uuid", "name": "Kategorija" },
    "tags": [...],
    "author": "Ime Autora",
    "publishedAt": "2025-01-15T10:00:00Z",
    "readingTime": 5,
    "metaTitle": "SEO naslov",
    "metaDescription": "SEO opis"
  }
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* GET /api/cms/pages */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Lista strana</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              GET
            </span>
            <code className="text-sm">/api/cms/pages</code>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-sm">
              <code>
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://www.splashdeals.rs/api/cms/pages`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* GET /api/cms/pages/:slug */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Pojedinačna strana</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              GET
            </span>
            <code className="text-sm">/api/cms/pages/{"{slug}"}</code>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-sm">
              <code>
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://www.splashdeals.rs/api/cms/pages/o-nama`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* GET /api/cms/categories */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Lista kategorija</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              GET
            </span>
            <code className="text-sm">/api/cms/categories</code>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-sm">
              <code>
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://www.splashdeals.rs/api/cms/categories`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Primeri */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Primeri upotrebe</h2>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primer 1 — Dohvati poslednjih 5 objavljenih objava
            </p>
            <pre className="text-sm">
              <code>
{`fetch("https://www.splashdeals.rs/api/cms/posts?status=PUBLISHED&limit=5", {
  headers: { Authorization: "Bearer YOUR_API_KEY" },
})
  .then((r) => r.json())
  .then((data) => console.log(data));`}
              </code>
            </pre>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primer 2 — Dohvati objave iz kategorije "Saveti"
            </p>
            <pre className="text-sm">
              <code>
{`const res = await fetch(
  "https://www.splashdeals.rs/api/cms/posts?category=saveti&limit=10",
  { headers: { Authorization: "Bearer YOUR_API_KEY" } }
);
const { data } = await res.json();
data.forEach((post) => console.log(post.title));`}
              </code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
