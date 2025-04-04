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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-80 justify-between"
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
  );
}
