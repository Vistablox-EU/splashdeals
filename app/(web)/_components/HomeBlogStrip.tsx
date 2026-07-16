import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type HomeDict = Record<string, string>;

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
};

export function HomeBlogStrip({ dict, posts }: { dict: HomeDict; posts: Post[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12 sm:py-14 md:px-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="mb-1 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
            {dict.blog_title}
          </h2>
          <p className="text-muted-foreground text-sm">{dict.blog_subtitle}</p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full text-[10px] font-black uppercase"
        >
          <Link href="/blog">{dict.blog_cta}</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">{dict.blog_empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <Card className="hover:border-primary/40 overflow-hidden transition-colors duration-150">
                <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="group-hover:text-primary line-clamp-2 text-sm font-black tracking-tight transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
