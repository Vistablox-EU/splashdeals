import {
  getOwnerTicketPricesAction,
  getOwnerSalesAction,
  getOwnerAnalyticsAction,
} from "@/app/(server)/actions/owner";
import { getDictionary } from "@/lib/dictionaries";
import { notFound } from "next/navigation";
import { prisma } from "@/app/(server)/lib/prisma";
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
  const dict = await getDictionary();
  const t = dict.owner as Record<string, string>;

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
        <h1 className="text-2xl font-bold tracking-tight">{t.dashboard_title}</h1>
        <p className="text-muted-foreground text-sm">{t.dashboard_subtitle}</p>
      </div>

      {/* Sales summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t.revenue_30d}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t.tickets_sold_30d}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t.transactions_30d}
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
          <TabsTrigger value="analytics">{t.analytics_tab}</TabsTrigger>
          <TabsTrigger value="prices">{t.prices_tab}</TabsTrigger>
          <TabsTrigger value="sales">{t.sales_tab}</TabsTrigger>
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
            dict={dict}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.daily_sales_revenue}</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart data={analytics.dailyBreakdown} dict={dict} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.top_tickets}</CardTitle>
              </CardHeader>
              <CardContent>
                <TopTicketsTable data={analytics.topTicketTypes} dict={dict} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t.report}</CardTitle>
                  <CsvExportButton sales={sales} facilityName={facility.name} dict={dict} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{t.report_desc}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t.transaction_count}</dt>
                    <dd className="font-medium">{sales.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t.tickets_count}</dt>
                    <dd className="font-medium">{totalTickets}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t.total_revenue}</dt>
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
              <CardTitle className="text-lg">{t.ticket_prices}</CardTitle>
            </CardHeader>
            <CardContent>
              <OwnerTicketPricesClient prices={ticketPrices} facilityId={id} dict={dict} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.recent_transactions}</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {t.no_transactions}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">{t.date_header}</th>
                        <th className="pb-2 font-medium">{t.amount_header}</th>
                        <th className="pb-2 font-medium">{t.tickets_header}</th>
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
