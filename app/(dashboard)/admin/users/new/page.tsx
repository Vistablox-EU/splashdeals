import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { connection } from "next/server";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { CreateUserForm } from "./_components/create-user-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Admin User | Splashdeals Admin",
};

export default async function CreateUserPage() {
  await connection();
  await requireSuperAdmin({ redirect: true });

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 p-4 md:p-6">
      <div className="animate-in fade-in slide-in-from-left-4 flex items-center gap-4 duration-500">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="border-border bg-muted/50 rounded-xl backdrop-blur-sm"
        >
          <Link href="/admin/users">
            <Icon name="keyboard_arrow_left" className="text-[16px]" />
          </Link>
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-black tracking-tighter uppercase italic">
            Novi administrator
          </h1>
          <p className="text-muted-foreground mt-1 text-xs tracking-widest uppercase opacity-80">
            Grant administrative clearance to a new team member.
          </p>
        </div>
      </div>

      <div className="bg-muted/50 border-border/50 relative overflow-hidden rounded-2xl border p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
        <CreateUserForm />
      </div>
    </div>
  );
}
