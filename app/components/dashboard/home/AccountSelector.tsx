import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "~/components/ui/select";
import { Check, ChevronsUpDown, PlusCircle, Send } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { Form, useFetcher } from "react-router";

const accounts = [
  {
    value: "0914234",
    type: "Ahorros",
  },
  {
    value: "58-14235",
    type: "Monetaria",
  },
  {
    value: "09-54235",
    type: "Ahorros",
  },
];

export function AccountSelector() {
  const [value, setValue] = useState(accounts[0].value);
  let fetcher = useFetcher();

  return (
    <div className="flex items-center justify-between gap-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-80 justify-between inline-flex"
          >
            {value
              ? `${
                  accounts.find((account) => account.value === value)?.type
                } ・ ${value}`
              : "Seleccionar cuenta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Buscar" />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {accounts.map((account) => (
                  <CommandItem
                    key={account.value}
                    value={account.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? value : currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === account.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>
                      {account.type} -{" "}
                      <span className="font-bold">{account.value}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Dialog>
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
            <div>
              <Label className="my-2 block">Tipo de Cuenta</Label>
              <Select name="tipoCuenta">
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
              <Button type="submit" icon={Send}>
                Enviar solicitud
              </Button>
            </DialogFooter>
          </fetcher.Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
