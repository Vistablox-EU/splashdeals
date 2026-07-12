"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Facility {
  id: string;
  name: string;
  city: string;
}

export default function AdminOwnersPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { getOwnerFacilitiesAction } = await import("@/app/(server)/actions/owner");
        const result = await getOwnerFacilitiesAction();
        setFacilities(result);
      } catch {
        toast.error("Failed to load facilities");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAssign = async () => {
    if (!email.trim()) {
      toast.error("Unesite email adresu");
      return;
    }
    if (!facilityId) {
      toast.error("Izaberite objekat");
      return;
    }

    setSubmitting(true);
    try {
      const { assignFacilityOwnerAction } = await import("@/app/(server)/actions/users");
      const result = await assignFacilityOwnerAction(email.trim(), facilityId);
      if (result.success) {
        toast.success("Vlasnik uspešno dodeljen");
        setEmail("");
        setFacilityId("");
        router.refresh();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Greška pri dodeli vlasnika");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Dodela vlasnika</CardTitle>
          <CardDescription>
            Dodelite vlasništvo nad objektom korisniku putem email adrese. Korisnik će dobiti
            FACILITY_OWNER rolu i moći će da upravlja cenama i pregleda prodaju.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email adresa korisnika</label>
            <Input
              type="email"
              placeholder="korisnik@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Objekat</label>
            <Select value={facilityId} onValueChange={setFacilityId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Učitavanje..." : "Izaberite objekat"} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} — {f.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAssign}
            disabled={submitting || !email.trim() || !facilityId}
            className="w-full"
          >
            {submitting ? "Dodeljivanje..." : "Dodeli"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
