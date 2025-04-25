// *** CORRECCIÓN PRINCIPAL: Importa Link desde react-router-dom ***
import { Link } from "react-router-dom";

// El resto de los imports de componentes UI y Lucide se mantienen igual
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRightLeft, Users, Landmark } from "lucide-react";

// Nota: Este componente, al ser un menú, no necesita 'loader' o 'action'
// directamente, ni tampoco 'Form' o 'useNavigation'.

export default function DashboardTransaccionesPage() {
  const transactionOptions = [
    {
      title: "Transferencias Propias",
      description: "Mueve fondos entre tus propias cuentas.",
      icon: ArrowRightLeft,
      href: "/dashboard/transacciones-internas", // Ruta de tu componente de transferencias internas
      disabled: false,
    },
    {
      title: "Transferencias a Terceros",
      description: "Envía dinero a otras personas dentro del mismo banco.",
      icon: Users,
      href: "/dashboard/third-party-transfer",
      disabled: true,
    },
    {
      title: "A Otros Bancos (ACH)",
      description: "Transfiere a cuentas en otras instituciones bancarias.",
      icon: Landmark,
      href: "/dashboard/interbank-transfer",
      disabled: true,
    },
  ];

  // El JSX se mantiene igual, ya que la estructura y estilos son correctos
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Seleccione una Opción</CardTitle>
          <CardDescription>
            Elija el tipo de transferencia que desea realizar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {transactionOptions.map((option) => (
              // Usamos el Link importado de react-router-dom
              <Link
                to={option.href} // 'to' es la prop estándar
                key={option.title}
                className={option.disabled ? "pointer-events-none" : ""}
                aria-disabled={option.disabled}
                tabIndex={option.disabled ? -1 : undefined}
              >
                <Button
                  variant="outline"
                  className="w-full h-full flex flex-col items-center justify-start p-6 space-y-3 text-center whitespace-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={option.disabled}
                  asChild={!option.disabled}
                >
                   <div>
                    <option.icon
                      className={`h-8 w-8 mb-3 mx-auto ${option.disabled ? 'text-muted-foreground' : 'text-primary'}`}
                      aria-hidden="true"
                    />
                    <p className="font-semibold text-base">{option.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                   </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}