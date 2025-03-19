import { Label } from "@radix-ui/react-label";
import { Landmark, LogIn } from "lucide-react";
import { NavLink } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 h-screen">
      <div className="flex items-center gap-3 text-2xl">
        <div className="bg-brand-blue p-2.5 text-brand-red">
          <Landmark />
        </div>
        BanCuchus
      </div>

      <Card className="w-full max-w-lg pt-9 pb-12">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-xl font-bold">
            Bienvenido de vuelta
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Ingresa tus credenciales para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <Button asChild  className="w-full mt-6" icon={<LogIn />}>
                {/* just for testing go to dashboard page */}
                <NavLink to="/dashboard/inicio">Iniciar sesión</NavLink>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
