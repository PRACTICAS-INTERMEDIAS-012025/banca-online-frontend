import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 h-screen">
      <div className="flex items-center gap-3 text-2xl">
        <div className="bg-card-foreground p-2.5 text-card">
          <Landmark />
        </div>
        Banco XYZ
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
              <Button asChild className="w-full mt-6">
                {/* just for testing go to dashboard page */}
                <Link href="/dashboard">Iniciar sesión</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
