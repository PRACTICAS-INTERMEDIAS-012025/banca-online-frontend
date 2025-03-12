import { Label } from "~/components/ui/label";
import {
  ArrowRight,
  AtSign,
  Contact,
  IdCard,
  Landmark,
  Lock,
  User,
} from "lucide-react";
import { NavLink } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export default function RegistroPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 h-screen p-4">
      <div className="flex items-center gap-3 text-2xl">
        <div className="bg-brand-blue p-2.5 text-brand-red">
          <Landmark />
        </div>
        BanCuchus
      </div>

      <Card className="w-full lg:max-w-3xl pt-9 pb-12">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-xl font-bold">
            Registrate
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Ingresa todos tus datos para registrarte y comenzar a usar BanCuchus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <fieldset className="grid grid-cols-2 gap-y-2 gap-x-5 lg:px-6">
              <Input
                type="text"
                name="name"
                icon={User}
                autoComplete="name"
                required
                label="Nombre"
              />

              <Input
                type="text"
                name="lastname"
                label="Apellido"
                icon={User}
                autoComplete="lastname"
                required
              />
              <Input
                type="text"
                name="dpi"
                icon={IdCard}
                rootClassName="col-span-2 sm:col-span-1"
                autoComplete="dpi"
                required
                label="DPI"
              />
              <Input
                type="email"
                name="email"
                rootClassName="col-span-2 sm:col-span-1"
                icon={AtSign}
                autoComplete="email"
                required
                label="Correo"
              />
              <Input
                type="text"
                name="username"
                icon={Contact}
                autoComplete="username"
                required
                label="Usuario"
              />
              <Input
                type="password"
                name="password"
                icon={Lock}
                autoComplete="new-password"
                required
                label="Contraseña"
              />
            </fieldset>

            <div className="mx-auto w-min">
              <Button
                asChild
                variant="tertiary"
                size="lg"
                className="mt-6"
                icon={<ArrowRight />}
              >
                {/* just for testing go to dashboard page */}
                <NavLink to="/dashboard/inicio">Continuar</NavLink>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
