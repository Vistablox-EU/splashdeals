import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Metadata } from "next";
import { connection } from "next/server";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Zakazane objave | CMS | Splashdeals",
};

function formatScheduledDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}.${month}.${year}. u ${hours}:${minutes}`;
}

async function cancelSchedule(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.blogPost.update({
    where: { id },
    data: { publishedAt: null },
  });

  revalidatePath("/admin/cms/posts/scheduled");
}

export default async function ScheduledPostsPage() {
  await requireAdmin();
  await connection();

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "DRAFT",
      publishedAt: { gt: new Date() },
    },
    orderBy: { publishedAt: "asc" },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Zakazane objave</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Blog objave zakazane za buduće objavljivanje.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cms/posts/new">
            <Icon name="add" className="size-4" />
            Nova objava
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naslov</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Zakazano za</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Icon name="schedule" className="size-8" />
                    <p className="text-sm">Nema zakazanih objava.</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/cms/posts/new">
                        <Icon name="add" className="mr-1 size-4" />
                        Kreiraj novu objavu
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Button variant="ghost" asChild className="text-left text-sm font-medium">
                      <Link href={`/admin/cms/posts/${post.id}`}>{post.title}</Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{post.author || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      <Icon name="schedule" className="mr-1 size-3" />
                      {formatScheduledDate(post.publishedAt!)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                        aria-label="Uredi objavu"
                      >
                        <Link href={`/admin/cms/posts/${post.id}`}>
                          <Icon name="edit" className="size-4" />
                        </Link>
                      </Button>
                      <form action={cancelSchedule}>
                        <input type="hidden" name="id" value={post.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          aria-label="Otkaži zakazivanje"
                        >
                          <Icon name="close" className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
