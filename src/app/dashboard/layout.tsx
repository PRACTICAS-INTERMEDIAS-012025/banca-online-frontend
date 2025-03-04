import ActiveLink from "@/components/partials/ActiveLink";
import { LogoLink } from "@/components/partials/LogoLink";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowDownUp,
  HandCoins,
  History,
  LayoutGrid,
  MenuIcon,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { label: "Inicio", icon: LayoutGrid, href: "/dashboard" },
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
      <nav className="fixed w-full border-b px-6 py-2.5 flex items-center justify-between">
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
                    <ActiveLink
                      activeClassName="bg-zinc-200 transition"
                      className="py-2 px-3 flex items-center gap-2"
                      href={item.href}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </ActiveLink>
                  </li>
                ))}
              </ul>
            </div>
            <SheetFooter>Información de perfil</SheetFooter>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-12 ">
          <div className="flex ">
            <LogoLink href="/dashboard" />
          </div>
          <ul className="gap-5 text-sm hidden md:flex">
            {menuItems.map((item) => (
              <li
                key={item.label}
                className="hover:ring-2 hover:ring-zinc-200 transition duration-200 hover:ring-offset-1 hover:ring-offset-white"
              >
                <ActiveLink
                  activeClassName="bg-zinc-200 transition"
                  className="py-2 px-3 flex items-center gap-2"
                  href={item.href}
                >
                  <item.icon size={18} />
                  {item.label}
                </ActiveLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden md:flex">Profile</div>
      </nav>
      <div className="max-w-screen-xl mx-auto pt-18 px-8">{children}</div>
    </div>
  );
}
