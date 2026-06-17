"use client"
import { Icon } from "@/components/ui/Icon";

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { createAdminUserAction } from "@/server/actions/users"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(UserRole),
})

export function CreateUserForm() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRole.FACILITY_STAFF,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    try {
      const result = await createAdminUserAction(values)
      if (result.success) {
        toast.success("Admin onboarded successfully")
        router.push("/admin/users")
      } else {
        toast.error(result.error || "Failed to onboard admin")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Damir K." className="bg-background border-border rounded-xl focus:border-cyan-500/50 transition-all h-11" {...field} />
              </FormControl>
              <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Corporate Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@splashdeals.rs" className="bg-background border-border rounded-xl focus:border-cyan-500/50 transition-all h-11" {...field} />
              </FormControl>
              <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Temporary Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" className="bg-background border-border rounded-xl focus:border-cyan-500/50 transition-all h-11" {...field} />
              </FormControl>
              <FormDescription className="text-[9px] text-muted-foreground uppercase tracking-tighter">Min 8 characters. User can reset this via email later.</FormDescription>
              <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background border-border rounded-xl focus:border-cyan-500/50 transition-all h-11">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value={UserRole.FACILITY_STAFF} className="focus:bg-muted/30 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Icon name="manage_accounts" className="text-[14px] text-amber-400" />
                        <span>Facility Staff</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={UserRole.SUPER_ADMIN} className="focus:bg-muted/30 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Icon name="security" className="text-[14px] text-primary" />
                        <span>Super Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-red-400" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] rounded-xl h-11 shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300"
        >
          {isPending ? <Icon name="progress_activity" className="text-[16px] animate-spin" /> : "Authorize Admin Access"}
        </Button>
      </form>
    </Form>
  )
}
