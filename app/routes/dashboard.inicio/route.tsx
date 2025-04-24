import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { AccountSelector } from "~/components/dashboard/home/AccountSelector";
import { CardStats } from "~/components/dashboard/home/CardStats";
import { CreditCardPreview } from "~/components/partials/CreditCardPreview";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getAllUserAccounts } from "~/lib/api/accounts";
import { getCurrentUserData } from "~/session";
import type { Route } from "../dashboard.inicio/+types/route";
import type { Cuenta } from "~/lib/types/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const userData = await getCurrentUserData(request);
  if (!userData) return null;
  
  const userAccounts = await getAllUserAccounts(request, {
    userId: userData?.usuario.UID,
  });

  return {
    userAccounts,
    userId: userData.usuario.UID
  };
}

export default function DashboardPage({
  loaderData
}: Route.ComponentProps) {
  const [selectedAccount, setSelectedAccount] = useState<Cuenta | null>(null);
  const [accounts, setAccounts] = useState<Cuenta[]>([]);


  useEffect(() => {
    if (loaderData?.userAccounts) {
      setAccounts(loaderData.userAccounts);
      if (loaderData.userAccounts.length > 0) {
        setSelectedAccount(loaderData.userAccounts[0]);
      }
    }
  }, [loaderData]);

  // Manejar cambio de cuenta seleccionada
  useEffect(() => {
    if (selectedAccount) {
     
    }
  }, [selectedAccount]);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-18">
      <section className="">
        <h2 className="font-bold pb-4">Tarjeta principal</h2>

        <CreditCardPreview
          cardNumber={
            selectedAccount?.numero 
              ? `**** **** **** ${selectedAccount.numero.toString().slice(-4)}` 
              : "**** **** **** ****"
          }
          validFrom="01/23"
          validUntil="01/25"
          cvv="123"
          cardHolder={
            selectedAccount?.tipoCuenta === 1 
              ? "Cuenta Monetaria" 
              : "Cuenta de Ahorros"
          }
        />

        <CardStats 
          balance={selectedAccount ? parseFloat(selectedAccount.saldo) : 0} 
          currency="GTQ" 
          status={selectedAccount?.estado || "Desconocido"} 
        />

        <h2 className="font-bold pb-4">Transferencia rápida</h2>

        <div className="flex gap-x-3">
          {[1, 2, 3, 4].map((i) => (
            <Button variant="secondary" className="rounded-full px-2" key={i}>
              NA
            </Button>
          ))}
        </div>

        <div className="space-y-3 mt-4">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            placeholder={selectedAccount ? `Q${selectedAccount.saldo}` : "Q0.00"}
          />
          <Button className="w-full">Transferir</Button>
        </div>
      </section>
      
      <section>
        <h2 className="font-bold pb-4 flex justify-between items-center">
          General
          <AccountSelector 
            onAccountSelect={setSelectedAccount}
            userId={loaderData?.userId || 1} 
            initialAccounts={accounts}
          />
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <h6 className="text-muted-foreground text-sm mb-2 space-x-2">
                <Wallet size={18} className="inline-block mb-1" />
                <span>Saldo disponible</span>
              </h6>
              <p className="text-2xl font-bold">
                {selectedAccount ? `Q${selectedAccount.saldo}` : "Q0.00"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <h6 className="text-muted-foreground text-sm mb-2 space-x-2">
                <ChevronDown size={18} className="inline-block mb-1" />
                <span>Ingresos generales</span>
              </h6>
              <p className="text-2xl font-bold">
                {selectedAccount ? `Q${(parseFloat(selectedAccount.saldo) * 0.1).toFixed(2)}` : "Q0.00"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <h6 className="text-muted-foreground text-sm mb-2 space-x-2">
                <ChevronUp size={18} className="inline-block mb-1" />
                <span>Egresos generales</span>
              </h6>
              <p className="text-2xl font-bold">
                {selectedAccount ? `Q${(parseFloat(selectedAccount.saldo) * 0.05).toFixed(2)}` : "Q0.00"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}