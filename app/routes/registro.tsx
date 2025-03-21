"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  AtSign,
  CalendarIcon,
  Contact,
  IdCard,
  Landmark,
  Lock,
  MapPin,
  PhoneCall,
  User,
} from "lucide-react";
import { useState } from "react";
import { Form, NavLink, redirect, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { $api } from "~/lib/apiFetch";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/registro";
import { toast } from "sonner";
import { FetchError } from "ofetch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const body = await request.formData();
  console.log(body);

  try {
    const response = await $api<any>("/usuario", {
      method: "POST",
      body: {
        //persona values
        nombre: body.get("name"),
        apellido: body.get("lastname"),
        dpi: body.get("dpi"),
        nacimiento: body.get("birthdate"),
        direccion: body.get("address"),
        sexo: body.get("gender"),
        telefono: body.get("phone"),

        //usuario values
        username: body.get("username"),
        email: body.get("email"),
        password: body.get("password"),
        rol: 3,
      },
    });

    toast.success("Usuario registrado correctamente", {
      description: "Ahora puedes iniciar sesión",
    });

    return redirect("/login");
  } catch (error) {
    if (error instanceof FetchError) {
      if (error.data) {
        // return {
        //   error: {
        //     statusCode: error.statusCode,
        //     data: error.data,
        //   },
        // };
        toast.error(error.data.message, {
          description: "Intente nuevamente",
        });
      } else {
        // return {
        //   error: {
        //     statusCode: 500,
        //     data: {
        //       message: "Servicio no disponible",
        //     },
        //   },
        // };
        toast.error("Servicio no disponible", {
          description: "Intente nuevamente",
        });
      }
    }
  }
}

export default function RegistroPage() {
  const [date, setDate] = useState<Date>();
  const navigation = useNavigation();

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
          <Form className="lg:px-6" method="POST">
            <h3 className="text-lg font-light my-3">Información personal</h3>
            <fieldset className="grid grid-cols-2 gap-y-2 gap-x-5 ">
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

              <div>
                <Label className="">Fecha de nacimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon />
                      {date ? (
                        format(date, "PPP", { locale: es })
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {/* hidden input for date formdata value */}
                <input
                  type="hidden"
                  name="birthdate"
                  value={date ? format(date, "yyyy-MM-dd") : ""}
                />
              </div>

              <Input
                type="text"
                name="address"
                icon={MapPin}
                required
                label="Dirección"
              />
              <Input
                type="text"
                name="phone"
                icon={PhoneCall}
                required
                label="Teléfono"
              />

              <div>
                <Label className="my-2 block">Género</Label>
                <Select name="gender">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="M">Másculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </fieldset>

            <h3 className="text-lg font-light my-3">Información de cuenta</h3>
            <fieldset className="grid grid-cols-2 gap-y-2 gap-x-5 ">
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
                variant="tertiary"
                size="lg"
                type="submit"
                className="mt-6"
                icon={<ArrowRight />}
                loading={navigation.state === "submitting"}
              >
                Continuar
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
