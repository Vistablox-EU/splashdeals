"use client"
import { Icon } from "@/components/ui/Icon";

import { useState } from "react"
import { UserRole } from "@prisma/client"
import Image from "next/image"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { updateUserRoleAction, deleteUserAction } from "@/server/actions/users"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  image: string | null
  createdAt: Date
  emailVerified: boolean
}

interface UsersTableProps {
  initialUsers: User[]
  totalCount: number
  currentPage: number
  pageSize: number
}

/**
 * 🌊 User Governance Table
 * Optimized for high-density RBAC management and server-side pagination.
 */
export function UsersTable({ initialUsers, totalCount, currentPage, pageSize }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const router = useRouter()

  const handleRoleUpdate = async (userId: string, role: UserRole) => {
    const result = await updateUserRoleAction(userId, role)
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success("User role updated successfully")
    } else {
      toast.error(result.error || "Failed to update role")
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke all access for this user?")) return

    const result = await deleteUserAction(userId)
    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success("Access revoked")
    } else {
      toast.error(result.error || "Failed to delete user")
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", newPage.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-muted/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-6">Identity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Security Role</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Created</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/10 border-border/50 transition-colors">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-border flex items-center justify-center text-foreground font-bold text-xs overflow-hidden">
                      {user.image ? (
                          <Image 
                            src={user.image} 
                            alt={user.name || "User"} 
                            fill 
                            className="object-cover" 
                          />
                      ) : (
                          user.name?.[0] || user.email[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground tracking-tight">{user.name || "Anonymous User"}</span>
                      <span className="text-[10px] text-muted-foreground font-mono lowercase">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    user.role === "SUPER_ADMIN" 
                      ? "bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20 font-black text-[9px] uppercase tracking-widest"
                  }>
                    {user.role.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.emailVerified ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-tight">
                          <Icon name="check_circle" className="text-[12px]" />
                          Verified
                      </div>
                  ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-tight">
                          <Icon name="schedule" className="text-[12px]" />
                          Pending
                      </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right px-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/30">
                        <Icon name="more_horiz" className="text-[16px] text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-background border-border text-foreground">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1.5">Manage Access</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-muted/30" />
                      <DropdownMenuItem 
                          onClick={() => handleRoleUpdate(user.id, UserRole.SUPER_ADMIN)}
                          className="gap-2 text-xs focus:bg-muted/30 focus:text-primary cursor-pointer"
                      >
                        <Icon name="shield" className="text-[14px]" />
                        Make Super Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                          onClick={() => handleRoleUpdate(user.id, UserRole.FACILITY_STAFF)}
                          className="gap-2 text-xs focus:bg-muted/30 focus:text-amber-400 cursor-pointer"
                      >
                        <Icon name="manage_accounts" className="text-[14px]" />
                        Make Facility Staff
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-muted/30" />
                      <DropdownMenuItem 
                          onClick={() => handleDelete(user.id)}
                          className="gap-2 text-xs text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                      >
                        <Icon name="delete" className="text-[14px]" />
                        Revoke All Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                      <Icon name="manage_accounts" className="text-[32px] text-muted-foreground/80" />
                      <span className="text-xs font-black uppercase tracking-widest">No Admin Users Found</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {currentPage} / {totalPages || 1} • {totalCount} Total Admins
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/40 border-border/50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <Icon name="keyboard_arrow_left" className="text-[16px]" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/40 border-border/50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <Icon name="keyboard_arrow_right" className="text-[16px]" />
          </Button>
        </div>
      </div>
    </div>
  )
}
