import { Landmark } from "lucide-react";
import Link from "next/link";

export function LogoLink({
  href,
}: {
  href: string;
}) {
  return (
    <Link href={href} className="inline-block">
      <div className="flex font-semibold items-center gap-3 hover:opacity-80 transition">
        <div className="bg-card-foreground p-1.5 text-card">
          <Landmark />
        </div>
        Banco XYZ
      </div>
    </Link>
  );
}
