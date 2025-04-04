import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

export function CardStats({
  balance,
  currency,
  status,
}: {
  balance: number;
  currency: string;
  status: string;
}) {
  return (
    <Card className="my-5">
      <CardContent>
        <div className="space-y-4">
          <h6 className="text-muted-foreground text-sm">Saldo disponible</h6>
          <p className="text-2xl font-bold">
            {balance.toLocaleString("es-GT", {
              style: "currency",
              currency: currency,
            })}
          </p>
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h6 className="text-muted-foreground text-sm">Moneda</h6>
            <p>{currency}</p>
          </div>
          <div className="space-y-2 text-right">
            <h6 className="text-muted-foreground text-sm">Estado</h6>
            <p>{status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
