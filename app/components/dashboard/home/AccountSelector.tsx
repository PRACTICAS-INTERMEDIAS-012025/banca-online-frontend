"use client";

import { Check, ChevronsUpDown, PlusCircle, Send } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { $api } from "~/lib/apiFetch";
import type { Cuenta } from "~/lib/types/auth";
import { Form, useFetcher } from "react-router";

interface AccountSelectorProps {
  onAccountSelect: (account: Cuenta) => void;
  userId: number;
  initialAccounts?: Cuenta[];
}

export function AccountSelector({ onAccountSelect, userId, initialAccounts = [] }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Cuenta[]>(initialAccounts);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(initialAccounts.length === 0);
  const [error, setError] = useState("");
  const fetcher = useFetcher();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // Función para cargar cuentas (reutilizable)
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await $api<Cuenta[]>(`/cuenta/getCuentaById/${userId}`);
      
      if (!Array.isArray(response)) {
        throw new Error("Formato de respuesta inválido");
      }

      setAccounts(response);
      if (response.length > 0) {
        setSelectedNumber(response[0].numero);
        onAccountSelect(response[0]);
      } else {
        setError("No se encontraron cuentas");
      }
    } catch (err) {
      console.error("Error al cargar cuentas:", err);
      setError(err instanceof Error ? err.message : "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  }, [userId, onAccountSelect]);

  useEffect(() => {
    if (initialAccounts.length === 0) {
      fetchAccounts();
    } else {
      if (initialAccounts.length > 0) {
        setSelectedNumber(initialAccounts[0].numero);
        onAccountSelect(initialAccounts[0]);
      }
      setLoading(false);
    }
  }, [userId, onAccountSelect, initialAccounts, fetchAccounts]);

  // Efecto para manejar la respuesta del formulario
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setIsRequestDialogOpen(false); // Cierra el diálogo de solicitud
      }
    }
  }, [fetcher.data]);

  const handleSelect = (numero: number) => {
    const selected = accounts.find(a => a.numero === numero);
    if (selected) {
      setSelectedNumber(numero);
      onAccountSelect(selected);
    }
  };

  return (
    <div className="flex items-center justify-between gap-x-2">
      {/* Selector de cuentas */}
      <div className="flex-1">
        {loading ? (
          <div className="p-2 text-sm">Cargando cuentas...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : accounts.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between inline-flex"
              >
                {selectedNumber
                  ? `${accounts.find(a => a.numero === selectedNumber)?.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} · ${selectedNumber}`
                  : "Seleccionar cuenta..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <Command>
                <CommandInput placeholder="Buscar cuenta..." />
                <CommandList>
                  <CommandEmpty>Sin resultados</CommandEmpty>
                  <CommandGroup>
                    {accounts.map((account) => (
                      <CommandItem
                        key={account.numero}
                        value={account.numero.toString()}
                        onSelect={() => handleSelect(account.numero)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedNumber === account.numero ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>
                            {account.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} · {account.numero}
                          </span>
                          <span className="text-sm text-gray-500">
                            Saldo: Q{account.saldo}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="text-sm text-muted-foreground">No hay cuentas disponibles</div>
        )}
      </div>

      {/* Diálogo para solicitar cuenta */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" icon={PlusCircle}>
            Solicitar cuenta
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Solicitar nueva cuenta bancaria</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de cuenta que deseas solicitar.
            </DialogDescription>
          </DialogHeader>
          <fetcher.Form
            className="grid gap-4 py-4"
            method="POST"
            action="/actions/accounts/request"
          >
            <input 
              type="hidden" 
              name="userId" 
              value={userId}
              required 
            />
            
            <div>
              <Label className="my-2 block">Tipo de Cuenta</Label>
              <Select 
                name="tipoCuenta"
                required 
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1">Monetaria</SelectItem>
                    <SelectItem value="2">Ahorro</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                icon={Send}
                disabled={fetcher.state === "submitting"} 
              >
                {fetcher.state === "submitting" ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </DialogFooter>
          </fetcher.Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación (éxito/error) */}
      <Dialog 
        open={!!fetcher.data} 
        onOpenChange={(open) => {
          if (!open) {
            // Al cerrar el diálogo de confirmación
            fetcher.data = null; // Limpia los datos
            fetchAccounts(); // Recarga las cuentas
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {fetcher.data?.success ? "¡Solicitud exitosa!" : "Error en la solicitud"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {fetcher.data?.success ? (
              <div className="text-green-500">
                <p>Tu solicitud de cuenta ha sido procesada correctamente.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  La nueva cuenta estará disponible después de ser aprobada.
                </p>
              </div>
            ) : (
              <div className="text-red-500">
                <p>{fetcher.data?.message || "Ocurrió un error al procesar tu solicitud."}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Por favor intenta nuevamente más tarde.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant={fetcher.data?.success ? "default" : "destructive"}
              onClick={() => {
                fetcher.data = null;
                fetchAccounts();
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}