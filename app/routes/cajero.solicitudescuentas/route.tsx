import React from 'react';
import { AccountSelector } from "~/components/dashboard/home/AccountSelector";
import { CardStats } from "~/components/dashboard/home/CardStats";
import { CreditCardPreview } from "~/components/partials/CreditCardPreview";
import { DataTable } from "~/components/dashboard/home/DataTable";
import { SearchBar } from "~/components/dashboard/home/SearchBar";
import { Label } from "~/components/ui/label";
import { requireUserSession } from "~/session";
import type { Route } from "../admin.inicio/+types/route";
import { Button } from "~/components/ui/button";
import type { CuentaAceptar } from "~/lib/types/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
// Definimos el tipo para los datos de la cuenta

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<CuentaAceptar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogTitle, setDialogTitle] = React.useState("");
  const [dialogDescription, setDialogDescription] = React.useState("");
  const [currentAction, setCurrentAction] = React.useState<"accept" | "reject" | null>(null);
  const [currentUID, setCurrentUID] = React.useState<number | null>(null);
  // Función para cargar los datos desde la API
  const fetchCuentasPendientes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3003/cuenta/getCuentasUsuarioByEstado/pendiente');
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.statusText}`);
      }
      
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  React.useEffect(() => {
    fetchCuentasPendientes();
  }, []);

  // Función para manejar la búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Filtrar datos basados en el término de búsqueda


// Actualiza el filtrado de datos
const filteredData = data.filter(item =>
  item.numero.toString().includes(searchTerm) ||
  item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.dPi.includes(searchTerm) ||
  (item.tipoCuenta === 1 ? 'Monetaria' : 'Ahorros').toLowerCase().includes(searchTerm.toLowerCase())
);

  const updateAccountStatus = async (uid: number, nuevoEstado: 'aprobado' | 'rechazado') => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3003/cuenta/updateEstado/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar el estado a ${nuevoEstado}`);
      }

      // Recargar los datos después de la actualización
      await fetchCuentasPendientes();
    } catch (err) {
      console.error(`Error al actualizar estado:`, err);
      setError(err instanceof Error ? err.message : `Error al actualizar estado`);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  const handleAcceptAccount = (uid: number) => {
    setCurrentUID(uid);
    setCurrentAction("accept");
    setDialogTitle("¿Aceptar esta cuenta?");
    setDialogDescription("Esta acción aprobará la solicitud de cuenta. ¿Estás seguro?");
    setDialogOpen(true);
  };
  
  const handleRejectAccount = (uid: number) => {
    setCurrentUID(uid);
    setCurrentAction("reject");
    setDialogTitle("¿Rechazar esta cuenta?");
    setDialogDescription("Esta acción denegará la solicitud de cuenta. ¿Estás seguro?");
    setDialogOpen(true);
  };
  
  const confirmAction = async () => {
    if (!currentUID || !currentAction) return;
    
    try {
      setLoading(true);
      const nuevoEstado = currentAction === "accept" ? "activa" : "inactiva";
      const response = await fetch(`http://localhost:3003/cuenta/updateEstado/${currentUID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
  
      if (!response.ok) {
        throw new Error(`Error al ${currentAction === "accept" ? "aceptar" : "rechazar"} la cuenta`);
      }
  
      // Mostrar mensaje de éxito
      setDialogTitle(currentAction === "accept" ? "Cuenta aceptada" : "Cuenta rechazada");
      setDialogDescription(
        currentAction === "accept" 
          ? "La cuenta ha sido aprobada exitosamente."
          : "La cuenta ha sido rechazada exitosamente."
      );
      
      // Limpiar la acción actual
      setCurrentAction(null);
      
      // Recargar los datos
      await fetchCuentasPendientes();
    } catch (err) {
      setDialogTitle("Error");
      setDialogDescription(
        err instanceof Error 
          ? err.message 
          : `Ocurrió un error al ${currentAction === "accept" ? "aceptar" : "rechazar"} la cuenta`
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="">
      <section>
        <Card className="">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-xl font-bold">
              Solicitudes de cuentas nuevas
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Aquí puedes aceptar o rechazar las solicitudes de nuevas cuentas de los usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Filtrar por Número de Cuenta o Usuario</h3>
            <SearchBar onSearch={handleSearch} />
            <DataTable 
              data={filteredData} 
              onAccept={handleAcceptAccount} 
              onReject={handleRejectAccount} 
            />
          </CardContent>
        </Card>
      </section>
      <Dialog open={dialogOpen} onOpenChange={(open) => {
  setDialogOpen(open);
  if (!open) {
    // Resetear estados cuando se cierra el diálogo
    setCurrentAction(null);
    setCurrentUID(null);
  }
}}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogDescription>{dialogDescription}</DialogDescription>
    </DialogHeader>
    
    <div className="flex justify-end space-x-4 mt-4">
      {currentAction ? (
        <>
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmAction}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Confirmar"}
          </Button>
        </>
      ) : (
        <Button 
          onClick={() => setDialogOpen(false)}
        >
          Cerrar
        </Button>
      )}
    </div>
  </DialogContent>
</Dialog>
    </main>
  );
}