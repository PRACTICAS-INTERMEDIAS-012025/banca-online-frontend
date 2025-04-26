import { ChevronDown, ChevronUp, Wallet, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
export function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar..."
        className="pl-10"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
