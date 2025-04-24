import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { DataTable } from "~/components/dashboard/home/DataTableTransaccion";
import { SearchBar } from "~/components/dashboard/home/SearchBar";
import type { Route } from "../admin.inicio/+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  // await requireUserSession(request);
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  
  // Datos de ejemplo para transacciones
  const [data, setData] = React.useState<any[]>([]);
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  React.useEffect(() => {
    // Datos de ejemplo para transacciones
    const mockTransactions = [
      { 
        id: 1, 
        fecha: "2023-05-15", 
        monto: 1500.50, 
        cuentaOrigen: "123456789", 
        cuentaDestino: "987654321",
        tipo: "Transferencia"
      },
      { 
        id: 2, 
        fecha: "2023-05-16", 
        monto: 250.75, 
        cuentaOrigen: "555555555", 
        cuentaDestino: "123456789",
        tipo: "Depósito"
      },
      { 
        id: 3, 
        fecha: "2023-05-17", 
        monto: 1000.00, 
        cuentaOrigen: "987654321", 
        cuentaDestino: "555555555",
        tipo: "Transferencia"
      },
    ];
    
    setData(mockTransactions);
  }, []);

  const filteredData = data.filter(item =>
    item.cuentaOrigen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cuentaDestino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fecha.toLowerCase().includes(searchTerm.toLowerCase())
  );

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