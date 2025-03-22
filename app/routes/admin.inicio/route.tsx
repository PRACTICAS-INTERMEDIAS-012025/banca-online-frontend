import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { AccountSelector } from "~/components/dashboard/home/AccountSelector";
import { CardStats } from "~/components/dashboard/home/CardStats";
import { CreditCardPreview } from "~/components/partials/CreditCardPreview";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireUserSession } from "~/session";
import type { Route } from "../admin.inicio/+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  // await requireUserSession(request);
}

export default function DashboardPage() {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-18">
      <section className="">
        <h2 className="font-bold pb-4">Tarjeta principal</h2>

        <CreditCardPreview
          cardNumber="**** **** **** 1234"
          validFrom="01/23"
          validUntil="01/25"
          cvv="123"
          cardHolder="Titular tarjeta cr"
        />

        <CardStats balance={1000} currency="GTQ" status="Activa" />

        <h2 className="font-bold pb-4">Transferencia rápida</h2>

        <div className="flex gap-x-3">
          {/* some mock avatars */}
          {[1, 2, 3, 4].map((i) => (
            <Button
              variant="secondary"
              className="rounded-full px-2"
              key={i}
            >
              NA
            </Button>
          ))}
        </div>

        <div className="space-y-3 mt-4">
          <Label htmlFor="amount" >
            Monto
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Q0.00"
          />
          <Button className="w-full">Transferir</Button>
        </div>
      </section>
      <section>
        <h2 className="font-bold pb-4 flex justify-between items-center">
          General
          <AccountSelector />
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <h6 className="text-muted-foreground text-sm mb-2 space-x-2">
                <Wallet size={18} className="inline-block mb-1" />
                <span>Saldo disponible</span>
              </h6>
              <p className="text-2xl font-bold">Q1,000.00</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h6 className="text-muted-foreground text-sm mb-2 space-x-2">
                <ChevronDown size={18} className="inline-block mb-1" />
                <span>Ingresos generales</span>
              </h6>
              <p className="text-2xl font-bold">Q1,000.00</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h6 className="text-muted-foreground text-sm mb-2 space-x-2">
                <ChevronUp size={18} className="inline-block mb-1" />
                <span>Egresos generales</span>
              </h6>
              <p className="text-2xl font-bold">Q1,000.00</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
