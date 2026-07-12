import { getOwnerFacilitiesAction } from "@/app/(server)/actions/owner";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

export default async function OwnerFacilitiesPage() {
  const facilities = await getOwnerFacilitiesAction();

  if (facilities.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Nemate dodeljenih objekata</CardTitle>
            <CardDescription className="text-center">
              Kontaktirajte administratora da bi vam dodelili objekat.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moji objekti</h1>
        <p className="text-muted-foreground text-sm">
          Izaberite objekat za upravljanje cenama i pregled prodaje.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => (
          <Link key={facility.id} href={`/owner/facilities/${facility.id}`}>
            <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="store" className="text-primary size-5" />
                  {facility.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Icon name="location_on" className="size-4" />
                  {facility.city}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
