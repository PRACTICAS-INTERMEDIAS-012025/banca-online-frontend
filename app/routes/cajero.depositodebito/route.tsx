import React from 'react'; // Añade esta línea
import { AccountSelector } from "~/components/dashboard/home/AccountSelector";
import { CardStats } from "~/components/dashboard/home/CardStats";
import { CreditCardPreview } from "~/components/partials/CreditCardPreview";
import { DataTable } from "~/components/dashboard/home/DataTable";
import { SearchBar } from "~/components/dashboard/home/SearchBar";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { requireUserSession } from "~/session";
import type { Route } from "../admin.inicio/+types/route";
export async function loader({ request }: Route.LoaderArgs) {
  // await requireUserSession(request);
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  
  // Datos de ejemplo
  const [data, setData] = React.useState<any[]>([]);
  
  // Función para manejar la búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Aquí filtrar los datos o hacer una nueva petición
  };
  
  // Simulamos la carga de datos (reemplaza esto con tu petición real)
  React.useEffect(() => {
    const mockData = [
      { id: 1, name: "Ejemplo 1", status: "Activo" },
      { id: 2, name: "Ejemplo 2", status: "Inactivo" },
      { id: 3, name: "Prueba 3", status: "Activo" },
    ];
    
    setData(mockData);
    
    // En una implementación real, harías algo como:
    // async function fetchData() {
    //   const response = await fetch('tu_endpoint');
    //   const data = await response.json();
    //   setData(data);
    // }
    // fetchData();
  }, []);

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="">
      <section>
        <h1 className="font-bold pb-4 flex justify-between items-center">
          Solicitudes de cuentas nuevas de los usuarios
        </h1>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Filtrar por Nombre</h3>
          <SearchBar onSearch={handleSearch} />
          <DataTable data={filteredData} />
        </div>
      </section>
    </main>
  );
}