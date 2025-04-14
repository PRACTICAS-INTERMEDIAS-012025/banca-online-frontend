import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { LogIn } from "lucide-react";
import { Button } from "~/components/ui/button";
import '../assets/css/styles-index.css';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
{
  /*
export default function Home() {
  
  return (
    <>
      <div className="grid place-items-center h-screen space-x-3">
        <h1 className="text-4xl font-bold">Bienvenido a la aplicación</h1>
        <h1 className="text-4xl font-bold">Landing Page</h1>
        {/* <Button icon={<LogIn />} variant="outline" asChild>
          <a href="/login">Iniciar sesión</a>
        </Button>
        </div>
        </>
      );
    }
  */
}

export default function Home() {
  return (
    <>
      <nav className="bg-gray-100 p-4 nav-fixed"
      >
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">BanCuchus</div>
          <ul className="flex space-x-4">
            <li>
              <a href="#productos" className="hover:text-blue-500"></a>
            </li>
          </ul>
          <div className="flex space-x-2">
            <Button icon={LogIn} variant="outline">
              <a href="/login">Iniciar sesión</a>
            </Button>
            <Button>
              <a href="/registro">Registrarme</a>
            </Button>
          </div>
        </div>
      </nav>
      <div className="flex flex-col h-screen">
        <main className="container mx-auto p-8 mt-16">
          <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Visión</h2>
              <p className="text-gray-700">
                Ser el banco líder en el mercado, reconocida por nuestra
                innovación, seguridad y excelencia en el servicio.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Misión</h2>
              <p className="text-gray-700">
                Facilitar la gestión financiera de nuestros clientes, ofreciendo
                soluciones personalizadas y accesibles a través de nuestra
                plataforma digital.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Servicios</h2>
              <ul className="list-disc list-inside text-gray-700">
                <li>Cuentas de ahorro</li>
                <li>Tarjetas de crédito</li>
                <li>Préstamos personales</li>
                <li>Inversiones</li>
              </ul>
            </div>
          </section>
        </main>

        <footer
          className="bg-gray-200 p-4 text-center footer-fixed"
        >
          <p>BanCuchus tu lider financiero, te hace crecer</p>
          <p>Contacto: bancuchus_oficial@bancuchus.com</p>
        </footer>
      </div>
    </>
  );
}
