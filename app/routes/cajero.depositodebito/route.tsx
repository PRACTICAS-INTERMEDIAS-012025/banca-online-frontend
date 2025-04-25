import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { DataTable } from "~/components/dashboard/home/DataTableTransaccion";
import { SearchBar } from "~/components/dashboard/home/SearchBar";
import type { Route } from "../admin.inicio/+types/route";
import { requireUserSession } from "~/session";
import { Button } from "~/components/ui/button";

interface Transaccion {
  id: number;
  fecha: string;
  monto: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  tipo_transaccion: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
  return null;
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<Transaccion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const fetchTransacciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3003/transaccion/');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const transacciones = await response.json();
      
      const normalizedData = transacciones.map((t: any) => ({
        ...t,
        cuentaOrigen: t.cuenta1?.toString() || '',
        cuentaDestino: t.cuenta2?.toString() || '',
        fecha: t.fecha ? new Date(t.fecha).toISOString() : '',
        tipo_transaccion: t.tipo_transaccion?.toString() || ''
      }));
      
      setData(normalizedData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransacciones();
  }, []);

  const filteredData = data.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      item.cuentaOrigen.toLowerCase().includes(searchTermLower) ||
      item.cuentaDestino.toLowerCase().includes(searchTermLower) ||
      item.tipo_transaccion.toLowerCase().includes(searchTermLower) ||
      item.fecha.toLowerCase().includes(searchTermLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando transacciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          onClick={fetchTransacciones}
          className="ml-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <main className="">
      <section>
        <Card className="">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-xl font-bold">
              Historial de Transacciones
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Visualiza todas las transacciones realizadas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Filtrar Transacciones</h3>
            <SearchBar onSearch={handleSearch} />
            <DataTable data={filteredData} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}