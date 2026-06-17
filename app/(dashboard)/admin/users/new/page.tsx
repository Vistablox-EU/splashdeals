import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next"
import { requireSuperAdmin } from "@/server/lib/auth-guards"
import { CreateUserForm } from "./_components/create-user-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Create Admin User | Splashdeals Admin",
}

export default async function CreateUserPage() {
  await requireSuperAdmin({ redirect: true })

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-2xl mx-auto w-full relative">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <Button variant="outline" size="icon" asChild className="rounded-xl border-border bg-muted/50 backdrop-blur-sm">
            <Link href="/admin/users">
                <Icon name="keyboard_arrow_left" className="text-[16px]" />
            </Link>
            </Button>
            <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">Novi administrator</h1>
            <p className="text-muted-foreground mt-1 text-xs uppercase tracking-widest opacity-80">
                Grant administrative clearance to a new team member.
            </p>
            </div>
        </div>

        <div className="bg-muted/50 border border-border/50 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
            <CreateUserForm />
        </div>
    </div>
  )
}
