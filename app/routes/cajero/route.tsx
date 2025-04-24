import {
  ArrowDownUp,
  BellRing,
  LayoutGrid,LayoutList,
  LogOut,
  MenuIcon,
  Settings2,
} from "lucide-react";
import { Form, NavLink, Outlet, redirect } from "react-router";
import { LogoLink } from "~/components/partials/LogoLink";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { commitSession, getCurrentUserData, getSession, requireUserSession } from "~/session";
import type { Route } from "../admin/+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
  const userData = await getCurrentUserData(request);

  return {
    userData,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);
  session.unset("credentials");

  return redirect("/login", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const menuItems = [
    { label: "Usuarios", icon: LayoutGrid, href: "/cajero/inicio" },
    {
      label: "Solicitudes de Cuenta",
      icon: LayoutGrid,
      href: "/cajero/solicitudescuentas",
    },{
      label: "Historial de depositos",
      icon: LayoutList,
      href: "/cajero/depositodebito",
    },{
      label: "solicitudes de crédito",
      icon: LayoutList,
      href: "/cajero/promociones",
    },{
      label: "promociones",
      icon: LayoutList,
      href: "/cajero/promociones",
    },
  ];

  return (
    <div>
      <nav className="fixed w-full border-b  py-2.5 px-6 ">
        <div className="flex items-center max-w-screen-2xl mx-auto justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="text-lg">Navegación</SheetTitle>
              </SheetHeader>
              <div className="px-6">
                <ul className="space-y-3 text-lg">
                  {menuItems.map((item) => (
                    <li
                      key={item.label}
                      className="hover:ring-2 hover:ring-zinc-200 transition duration-200 hover:ring-offset-1 hover:ring-offset-white"
                    >
                      <NavLink
                        // activeClassName="bg-zinc-200 transition"
                        // className="py-2 px-3 flex items-center gap-2"
                        to={item.href}
                        className={({ isActive }) => `
                          py-2 px-3 flex items-center gap-2 transition
                          ${
                            isActive
                              ? "bg-zinc-200"
                              : "text-foreground/60 hover:text-foreground"
                          }
                          `}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
              <SheetFooter>Información de perfil</SheetFooter>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-12 ">
            <div className="flex ">
              <LogoLink to="/admin/inicio" />
            </div>
            <ul className="gap-5 text-sm hidden md:flex">
              {menuItems.map((item) => (
                <li
                  key={item.label}
                  className="hover:ring-2 hover:ring-zinc-200 transition duration-200 hover:ring-offset-1 hover:ring-offset-white"
                >
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => `
                          py-2 px-3 flex items-center gap-2 transition
                          ${
                            isActive
                              ? "bg-zinc-200"
                              : "text-foreground/60 hover:text-foreground"
                          }
                          `}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"}>
                    <BellRing />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    <span className="font-bold">0</span> Notificaciones
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"}>
                    <Settings2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configuraciones</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar>
                        <AvatarFallback>
                          {loaderData.userData?.usuario.persona.nombre.charAt(
                            0,
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sesión iniciada como:</p>
                      <p className="font-bold">
                        {loaderData.userData?.usuario.persona.nombre}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">
                      {`${loaderData.userData?.usuario.persona.nombre} ${loaderData.userData?.usuario.persona.apellido}`}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {loaderData.userData?.usuario.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Form method="POST">
                  <DropdownMenuItem asChild>
                    <Button
                      type="submit"
                      className="w-full font-normal"
                      variant="ghost"
                      icon={LogOut}
                    >
                      Cerrar sesión
                    </Button>
                  </DropdownMenuItem>
                </Form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      <div className="max-w-screen-2xl mx-auto pt-18 px-6">
        <Outlet />
      </div>
    </div>
  );
}
