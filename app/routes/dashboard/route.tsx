import { LogoLink } from "~/components/partials/LogoLink";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  ArrowDownUp,
  BellRing,
  HandCoins,
  History,
  LayoutGrid,
  MenuIcon,
  Settings2,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { label: "Inicio", icon: LayoutGrid, href: "/dashboard/inicio" },
    {
      label: "Transacciones",
      icon: ArrowDownUp,
      href: "/dashboard/transacciones",
    },
    { label: "Pagos/Servicios", icon: HandCoins, href: "/dashboard/pagos" },
    { label: "Historial", icon: History, href: "/dashboard/historial" },
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
              <LogoLink to="/dashboard" />
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar>
                    <AvatarFallback>NA</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sesión iniciada como:</p>
                  <p className="font-bold">Nombre y Apellido</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </nav>
      <div className="max-w-screen-2xl mx-auto pt-18 px-6">
        <Outlet />
      </div>
    </div>
  );
}
