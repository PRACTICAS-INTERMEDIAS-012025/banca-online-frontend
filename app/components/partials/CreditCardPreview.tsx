import { Landmark, Nfc } from "lucide-react";
import visa from "./visa.svg";

export function CreditCardPreview({
  cardNumber,
  cardHolder,
  validUntil,
}: {
  cardNumber: string;
  validFrom: string;
  validUntil: string;
  cvv: string;
  cardHolder: string;
}) {
  return (
    <div className="select-none hover:shadow-xl  h-48 w-full bg-gradient-to-tr  from-neutral-800 to-slate-500 text-white shadow-sm transition ">
      <div className="px-6 pt-4 pb-5 h-full flex flex-col justify-between">
        <header className="flex justify-between">
          <div className="flex font-semibold text-sm items-center gap-2">
            <Landmark />
            BanCuchus
          </div>
          <div className="space-x-2">
            <img
              src={visa}
              alt="Visa"
              className="w-10 pointer-events-none inline-block invert"
            />
            <Nfc size={28} className="inline-block" />
          </div>
        </header>
        <p className="tracking-more-wider py-3 font-mono  font-medium text-lg">
          {cardNumber}
        </p>
        <div>
          <div className="flex flex-row justify-between">
            <p className="text-sm uppercase  flex justify-between">
              {cardHolder}
            </p>
            <p className="text-sm font-semibold tracking-wider ">
              {validUntil}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
