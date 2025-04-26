"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import type { Cuenta } from "~/lib/types/auth";

interface AccountSelectorProps {
  accounts: Cuenta[]; 
  selectedAccount: Cuenta | null; 
  onAccountSelect: (account: Cuenta | null) => void; 
  placeholder?: string;
}

export function AccountSelectorTransaction({
  accounts = [],
  selectedAccount,
  onAccountSelect,
  placeholder = "Seleccionar cuenta...",
}: AccountSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (account: Cuenta) => {
       onAccountSelect(account);
    setOpen(false); 
  };

  // Determinar el valor a mostrar en el botón
  const displayValue = selectedAccount
    ? `${selectedAccount.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} · ${selectedAccount.numero}`
    : placeholder;

   // Formatear saldo de forma segura
   const formatBalance = (balance: string | number | null | undefined): string => {
    const numericBalance = parseFloat(String(balance ?? '0'));
    return isNaN(numericBalance) ? '0.00' : numericBalance.toFixed(2);
   };

   const getKey = (account: Cuenta): string | number => account.UID ?? account.UID ?? account.numero;
   const isSelected = (account: Cuenta): boolean => selectedAccount ? getKey(account) === getKey(selectedAccount) : false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !selectedAccount && "text-muted-foreground" )} 
        >
           <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0",  "w-[var(--radix-popover-trigger-width)]")}>
        <Command>
          
          <CommandList>
            <CommandEmpty>No se encontraron cuentas.</CommandEmpty>
            <CommandGroup>
              {accounts.length === 0 && !open && (
                 <div className="p-4 text-sm text-muted-foreground">Cargando...</div> // Mostrar algo si está vacío inicialmente
              )}
              {accounts.map((account) => (
                <CommandItem
                  key={getKey(account)} // Clave única
                  // Valor combinado para la búsqueda
                  value={`${account.numero} ${account.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} ${account.usuario ?? ''} ${formatBalance(account.saldo)}`}
                  onSelect={() => handleSelect(account)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                       isSelected(account) ? "opacity-100" : "opacity-0" // Usar función de comparación
                    )}
                  />
                  <div className="flex flex-col">
                    <span>
                      {account.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} · {account.numero}
                    </span>
                    {/* Mostrar saldo actualizado */}
                    <span className="text-xs text-muted-foreground">
                      Saldo: Q{formatBalance(account.saldo)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}