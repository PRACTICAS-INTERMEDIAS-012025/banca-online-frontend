import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { AccountSelector } from "~/components/dashboard/home/AccountSelector";
import { CardStats } from "~/components/dashboard/home/CardStats";
import { CreditCardPreview } from "~/components/partials/CreditCardPreview";
import { Button } from "~/components/ui/button";
import { requireUserSession } from "~/session";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRef } from "react";
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
import { Calendar } from "~/components/ui/calendar-alt";
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
import type { Route } from "../+types/registro";
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
export async function loader({ request }: Route.LoaderArgs) {
  // await requireUserSession(request);
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  const body = await request.formData();

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
        // testing cashier role
        // rol: 2,
      },
    });

    toast.success("Usuario registrado correctamente", {
      description: "",
    });
    
  } catch (error) {
    if (error instanceof FetchError) {
      if (error.data) {
        toast.error(error.data.message, {
          description: "Intente nuevamente",
        });
      } else {
        toast.error("Servicio no disponible", {
          description: "Intente nuevamente",
        });
      }
    }
  }
}
export default function DashboardPage() {

  const [date, setDate] = useState<Date>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <main className="">
      <section className="">
      <div className="">
        <Card className="">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-xl font-bold">
            Registro de usuario
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Ingresa todos los datos del usuario nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form className="lg:px-6" method="POST" ref={formRef}>
            <h3 className="text-lg font-light my-3">Información personal</h3>
            <fieldset className="grid grid-cols-3 gap-y-2 gap-x-5 ">
              <Input
                type="text"
                name="name"
                icon={User}
                autoComplete="name"
                required
                label="Nombre (*)"
              />

              <Input
                type="text"
                name="lastname"
                label="Apellido (*)"
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
                label="DPI (*)"
              />

              <div>
                <Label className="">Fecha de nacimiento (*)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full mt-2 justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "PPP", { locale: es })
                      ) : (
                        <span>Elige una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className=" w-auto p-0">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown-buttons"
                      selected={date}
                      onSelect={setDate}
                      fromYear={1960}
                      toYear={2030}
                    />
                  </PopoverContent>
                </Popover>
                {/* <Popover>
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
                        <span>Selecciona una fecha</span>
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
                </Popover> */}
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
                label="Dirección (*)"
              />
              <Input
                type="text"
                name="phone"
                icon={PhoneCall}
                required
                label="Teléfono (*)"
              />

              <div>
                <Label className="my-2 block">Género (*)</Label>
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
            <fieldset className="grid grid-cols-3 gap-y-2 gap-x-5 ">
              <Input
                type="email"
                name="email"
                rootClassName="col-span-2 sm:col-span-1"
                icon={AtSign}
                autoComplete="email"
                required
                label="Correo (*)"
              />
              <Input
                type="text"
                name="username"
                icon={Contact}
                autoComplete="username"
                required
                label="Usuario (*)"
              />
              <Input
                type="password"
                name="password"
                icon={Lock}
                autoComplete="new-password"
                required
                label="Contraseña (*)"
              />
            </fieldset>

            <div className="mx-auto w-min">
              <Button
                variant="destructive"
                size="lg"
                type="submit"
                className="mt-6"
                icon={ArrowRight}
                loading={navigation.state === "submitting"}
              >
                Continuar
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
       </div>
      </section>
    </main>
  );
}
