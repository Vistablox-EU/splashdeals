import {
  getOwnerTicketPricesAction,
  getOwnerSalesAction,
  getOwnerAnalyticsAction,
} from "@/app/(server)/actions/owner";
import { notFound } from "next/navigation";
import { prisma } from "@/server/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { OwnerTicketPricesClient } from "./_components/owner-ticket-prices-client";
import { AnalyticsOverview } from "./_components/analytics-overview";
import { SalesChart } from "./_components/sales-chart";
import { TopTicketsTable } from "./_components/top-tickets-table";
import { CsvExportButton } from "./_components/csv-export-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OwnerFacilityDashboardPage({ params }: Props) {
  const { id } = await params;

  let ticketPrices, sales, analytics, facility;
  try {
    [ticketPrices, sales, analytics, facility] = await Promise.all([
      getOwnerTicketPricesAction(id),
      getOwnerSalesAction(id),
      getOwnerAnalyticsAction(id),
      prisma.facility.findUnique({
        where: { id },
        select: { name: true },
      }),
    ]);
  } catch {
    notFound();
  }

  if (!facility) notFound();

  const totalRevenue = sales.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
  const totalTickets = sales.reduce((sum, tx) => sum + tx.issuedTickets.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel objekta</h1>
        <p className="text-muted-foreground text-sm">
          Upravljanje cenama ulaznica i pregled prodaje.
        </p>
      </div>

      {/* Sales summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Ukupna zarada (30 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Prodatih karata (30 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Transakcija (30 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sales.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics tab panel */}
      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analitika</TabsTrigger>
          <TabsTrigger value="prices">Cene ulaznica</TabsTrigger>
          <TabsTrigger value="sales">Transakcije</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          <AnalyticsOverview
            totalViews={analytics.totalViews}
            views7d={analytics.views7d}
            totalSales={analytics.totalSales}
            sales7d={analytics.sales7d}
            totalRevenue={analytics.totalRevenue}
            revenue7d={analytics.revenue7d}
            conversionRate={analytics.conversionRate}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dnevna prodaja i prihod</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart data={analytics.dailyBreakdown} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Najprodavanije ulaznice</CardTitle>
              </CardHeader>
              <CardContent>
                <TopTicketsTable data={analytics.topTicketTypes} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Izveštaj</CardTitle>
                  <CsvExportButton sales={sales} facilityName={facility.name} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Preuzmite poslednjih 30 dana transakcija kao CSV datoteku.
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Transakcija</dt>
                    <dd className="font-medium">{sales.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Prodatih karata</dt>
                    <dd className="font-medium">{totalTickets}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ukupan prihod</dt>
                    <dd className="font-medium">{formatCurrency(totalRevenue)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cene ulaznica</CardTitle>
            </CardHeader>
            <CardContent>
              <OwnerTicketPricesClient prices={ticketPrices} facilityId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Poslednje transakcije</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Nema transakcija u poslednjih 30 dana.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Datum</th>
                        <th className="pb-2 font-medium">Iznos</th>
                        <th className="pb-2 font-medium">Karata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((tx) => (
                        <tr key={tx.id} className="border-b last:border-0">
                          <td className="text-muted-foreground py-2">
                            {new Date(tx.createdAt).toLocaleDateString("sr-RS", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2 font-medium">
                            {formatCurrency(Number(tx.totalAmount))}
                          </td>
                          <td className="text-muted-foreground py-2">{tx.issuedTickets.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
