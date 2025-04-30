import React from 'react';
// import { AccountSelector } from "~/components/dashboard/home/AccountSelector"; // Comentado si no se usa en este archivo
// import { CardStats } from "~/components/dashboard/home/CardStats"; // Comentado si no se usa
// import { CreditCardPreview } from "~/components/partials/CreditCardPreview"; // Comentado si no se usa
import { DataTable } from "~/components/dashboard/home/DataTable"; // Verifica esta ruta
import { SearchBar } from "~/components/dashboard/home/SearchBar"; // Verifica esta ruta
import { Label } from "~/components/ui/label";
import { requireUserSession } from "~/session"; // Verifica esta ruta
import type { Route } from "../admin.inicio/+types/route"; // Verifica esta ruta si es necesaria
import { Button } from "~/components/ui/button";
import type { CuentaAceptar } from "~/lib/types/auth"; // Verifica esta ruta
import { $api } from "~/lib/apiFetch"; // Verifica esta ruta
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
  DialogFooter
} from "~/components/ui/dialog";
import { Loader2 } from 'lucide-react';

// Interfaz genérica para respuestas simples de la API
interface ApiResponse {
  message?: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
  return null;
}

export default function DashboardPage() {
  // --- Estados ---
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<CuentaAceptar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogTitle, setDialogTitle] = React.useState("");
  const [dialogDescription, setDialogDescription] = React.useState("");
  const [currentAction, setCurrentAction] = React.useState<"accept" | "reject" | null>(null);
  const [currentUID, setCurrentUID] = React.useState<number | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  // --- Función para cargar datos (usa $api) ---
  const fetchCuentasPendientes = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedData = await $api<CuentaAceptar[]>('/cuenta/getCuentasUsuarioByEstado/pendiente');
      setData(fetchedData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar cuentas pendientes';
      setError(errorMessage);
      console.error("Error fetching data via $api:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar
  React.useEffect(() => {
    fetchCuentasPendientes();
  }, [fetchCuentasPendientes]);

  // --- Manejar búsqueda ---
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // --- Filtrar datos ---
  const filteredData = data.filter(item =>
    item.numero.toString().includes(searchTerm) ||
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.dPi.includes(searchTerm) ||
    (item.tipoCuenta === 1 ? 'Monetaria' : 'Ahorros').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Handlers para abrir diálogo ---
   const handleAcceptAccount = (uid: number) => {
     setCurrentUID(uid);
     setCurrentAction("accept");
     setDialogTitle("¿Aceptar esta cuenta?");
     setDialogDescription(`Aprobar la solicitud de cuenta para el usuario ${filteredData.find(d => d.UID === uid)?.username ?? 'N/A'}. ¿Estás seguro?`);
     setDialogOpen(true);
   };

   const handleRejectAccount = (uid: number) => {
     setCurrentUID(uid);
     setCurrentAction("reject");
     setDialogTitle("¿Rechazar esta cuenta?");
     setDialogDescription(`Denegar la solicitud de cuenta para el usuario ${filteredData.find(d => d.UID === uid)?.username ?? 'N/A'}. ¿Estás seguro?`);
     setDialogOpen(true);
   };

  // --- Función para confirmar acción (usa $api) ---
  const confirmAction = async () => {
    if (!currentUID || !currentAction) return;

    const actionText = currentAction === "accept" ? "aceptar" : "rechazar";
    const nuevoEstado = currentAction === "accept" ? "activa" : "inactiva";

    setActionLoading(true);
    setError(null);

    try {
      const endpoint = `/cuenta/updateEstado/${currentUID}`;
      const requestBody = { estado: nuevoEstado };
      const responseData = await $api<ApiResponse>(endpoint, {
        method: 'PUT',
        body: requestBody,
      });

      setDialogTitle(currentAction === "accept" ? "Cuenta Aceptada" : "Cuenta Rechazada");
      setDialogDescription(
        responseData?.message ||
        `La cuenta ha sido ${actionText === 'aceptar' ? 'aprobada' : 'rechazada'} exitosamente.`
      );
      setCurrentAction(null);
      await fetchCuentasPendientes();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Ocurrió un error al ${actionText} la cuenta`;
      setDialogTitle("Error");
      setDialogDescription(errorMessage);
      console.error(`Error al ${actionText} cuenta via $api:`, err);
      setCurrentAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Renderizado ---
  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="ml-2 text-muted-foreground">Cargando solicitudes...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-red-600 font-semibold">Error al cargar datos:</p>
        <p className="text-red-500 mt-1">{error}</p>
        <Button onClick={fetchCuentasPendientes} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <section>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-xl font-bold">
              Solicitudes de Cuentas Pendientes
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Gestiona las solicitudes de nuevas cuentas de usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              {/* Nota: La prop 'htmlFor' aquí podría no funcionar si SearchBar no tiene un input con id="search-cuentas" */}
              <Label htmlFor="search-cuentas" className="text-lg font-semibold mb-2 block">Filtrar Solicitudes</Label>
              {/* ***** CORRECCIÓN AQUÍ: Se eliminaron inputId y placeholder ***** */}
              <SearchBar
                onSearch={handleSearch}
                // Si SearchBar no define placeholder, puedes añadirlo en el Input *dentro* de SearchBar.tsx
              />
            </div>

            {loading ? (
                 <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Actualizando...</p>
                 </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {searchTerm ? `No se encontraron solicitudes que coincidan con "${searchTerm}".` : "No hay solicitudes pendientes por el momento."}
              </div>
            ) : (
              <DataTable
                data={filteredData}
                onAccept={handleAcceptAccount}
                onReject={handleRejectAccount}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Diálogo de Confirmación / Resultado */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (actionLoading) return;
          setDialogOpen(open);
          if (!open) {
            setCurrentAction(null);
            setCurrentUID(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {dialogDescription && <DialogDescription>{dialogDescription}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="mt-4">
            {currentAction ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmAction}
                  disabled={actionLoading}
                  className={currentAction === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                     currentAction === 'accept' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setDialogOpen(false)}
              >
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}