import { Landmark } from "lucide-react";
import { NavLink } from "react-router";

export function LogoLink({
  to,
}: {
  to: string;
}) {
  return (
    <NavLink to={to} className="inline-block">
      <div className="flex font-semibold items-center gap-3 hover:opacity-80 transition">
        <div className="bg-brand-blue p-1.5 text-brand-red">
          <Landmark />
        </div>
        BanCuchus 
      </div>
    </NavLink>
  );
}
