import { getAdminUsersAction } from "@/app/(server)/actions/users";
import { UsersTable } from "./users-table";
import type { User } from "@prisma/client";

interface UsersListProps {
  page?: string;
  limit?: string;
}

/**
 * 🌊 User Registry Extraction
 * Server-side pagination to minimize bandwidth and memory footprint.
 */
export async function UsersList({ page, limit }: UsersListProps) {
  const result = await getAdminUsersAction({
    page: Number(page) || 1,
    limit: Number(limit) || 15,
  });

  if (!result.success) {
    const errorMsg =
      (result as { error?: string }).error || "Došlo je do neočekivane greške na serveru.";
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center">
        <p className="text-sm font-black tracking-widest text-red-400 uppercase">
          Greška pri učitavanju korisnika
        </p>
        <p className="mt-2 text-xs font-medium text-red-200/60">{errorMsg}</p>
      </div>
    );
  }

  const successResult = result as {
    success: true;
    data: User[];
    totalCount: number;
    page: number;
    limit: number;
  };

  return (
    <UsersTable
      key={`${successResult.page}-${successResult.limit}-${successResult.data.length}`}
      initialUsers={successResult.data}
      totalCount={successResult.totalCount || 0}
      currentPage={successResult.page || 1}
      pageSize={successResult.limit || 15}
    />
  );
}
