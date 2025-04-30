import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { DataTable } from "~/components/dashboard/home/DataTableTransaccion"; // Verifica ruta
import { SearchBar } from "~/components/dashboard/home/SearchBar"; // Verifica ruta
import type { Route } from "../admin.inicio/+types/route"; // Verifica ruta si es necesaria
import { requireUserSession } from "~/session"; // Verifica ruta
import { Button } from "~/components/ui/button";
import { $api } from "~/lib/apiFetch"; // Verifica ruta
import { Loader2 } from 'lucide-react';

// Interfaz para la estructura de datos que usa el DataTable
interface Transaccion {
  id: number;
  fecha: string; // ISO String date
  monto: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  tipo_transaccion: string;
}

// Interfaz para la estructura de datos COMO VIENE DE LA API
interface RawTransaccion {
  id: number;
  fecha?: string | Date | null;
  monto: number;
  cuenta1?: number | string | null;
  cuenta2?: number | string | null;
  tipo_transaccion?: number | string | null;
  [key: string]: any;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
  return null;
}

export default function TransactionsPage() {
  // --- Estados ---
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<Transaccion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // --- Manejar búsqueda ---
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // --- Función para cargar datos (usa $api) ---
  const fetchTransacciones = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rawTransacciones = await $api<RawTransaccion[]>('/transaccion/');

      if (!Array.isArray(rawTransacciones)) {
         console.error("API did not return an array for transactions.");
         throw new Error("Formato de respuesta inesperado de la API.");
      }

      const normalizedData = rawTransacciones.map((t): Transaccion => ({
        id: t.id,
        monto: t.monto,
        cuentaOrigen: String(t.cuenta1 ?? 'N/A'),
        cuentaDestino: String(t.cuenta2 ?? 'N/A'),
        fecha: t.fecha ? new Date(t.fecha).toISOString() : new Date(0).toISOString(),
        tipo_transaccion: String(t.tipo_transaccion ?? 'Desconocido'),
      }));

      setData(normalizedData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar transacciones";
      setError(errorMessage);
      console.error("Error fetching transactions via $api:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Cargar datos al montar ---
  React.useEffect(() => {
    fetchTransacciones();
  }, [fetchTransacciones]);

  // --- Filtrar datos ---
  const filteredData = data.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      item.cuentaOrigen?.toLowerCase().includes(searchTermLower) ||
      item.cuentaDestino?.toLowerCase().includes(searchTermLower) ||
      item.tipo_transaccion?.toLowerCase().includes(searchTermLower) ||
      item.fecha?.toLowerCase().includes(searchTermLower) ||
      item.monto?.toString().includes(searchTerm)
    );
  });

  // --- Renderizado ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando transacciones...</p>
      </div>
    );
  }

  if (error) {
    return (
       <div className="flex flex-col items-center justify-center h-64 text-center">
         <p className="text-red-600 font-semibold">Error al cargar transacciones:</p>
         <p className="text-red-500 mt-1">{error}</p>
         <Button
           variant="outline"
           onClick={fetchTransacciones}
           className="mt-4"
         >
           Reintentar
         </Button>
       </div>
    );
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <section>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-xl font-bold">
              Historial de Transacciones
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Visualiza todas las transacciones realizadas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
               <h3 className="text-lg font-semibold mb-2">Filtrar Transacciones</h3>
               {/* ***** CORRECCIÓN AQUÍ: Se eliminó la prop placeholder ***** */}
               <SearchBar
                 onSearch={handleSearch}
                 // Si necesitas un placeholder, añádelo directamente en el <Input>
                 // dentro del componente SearchBar.tsx, o modifica SearchBar
                 // para que acepte esta prop.
               />
            </div>

            {filteredData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    {searchTerm ? `No se encontraron transacciones que coincidan con "${searchTerm}".` : "No hay transacciones registradas."}
                </div>
            ) : (
                <DataTable data={filteredData} />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}