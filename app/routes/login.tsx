import { Landmark, Lock, LogIn, User2 } from "lucide-react";
import { FetchError } from "ofetch";
import { Form, redirect, useNavigation } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { $api } from "~/lib/apiFetch";
import type { LoginResponse } from "~/lib/types/auth";
import { commitSession, getSession } from "~/session";
import type { Route } from "./+types/login";



export async function action({ request }: Route.ActionArgs) {
  // const session = await getSession(request.headers.get("Cookie"));
  const session = await getSession();

  const body = await request.formData();
  const username = body.get("username");
  const password = body.get("password");
  try {
    const response = await $api.raw<LoginResponse>("/login", {
      method: "POST",
      body: {
        username,
        password,
      },
    });
    const token = response.headers.get("Authorization");
    session.set("credentials", response._data);
    session.set("token", token);

    return redirect("/admin/inicio", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    if (error instanceof FetchError) {
      if (error.data) {
        return {
          error: {
            statusCode: error.statusCode,
            data: error.data,
          },
        };
      } else {
        return {
          error: {
            statusCode: 500,
            data: {
              message: "Servicio no disponible",
            }
          }
        };
      }
    }
  }
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();

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
          <Form className="space-y-4 max-w-sm mx-auto" method="POST">
            <Input
              type="text"
              label="Nombre de usuario"
              name="username"
              required
              icon={User2}
            />

            <Input
              type="password"
              label="Contraseña"
              name="password"
              required
              icon={Lock}
            />

            <div>
              <Button
                type="submit"
                className="w-full mt-6"
                icon={<LogIn />}
                loading={navigation.state === "submitting"}
              >
                Iniciar sesión
              </Button>
            </div>

            {actionData?.error && (
              <div className="text-sm text-red-500">
                <h6 className="font-bold">
                  Ha ocurrido un error al iniciar sesión:
                </h6>
                <p>{actionData?.error.data?.message}</p>
                {actionData?.error.statusCode === 401 && (
                  <p className="text-muted-foreground">
                    Por favor, verifica tus credenciales e intenta de nuevo
                  </p>
                )}
              </div>
            )}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
