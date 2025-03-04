import { Landmark, Nfc } from "lucide-react";

export function CreditCardPreview({
  cardNumber,
  validFrom,
  cardHolder,
  validUntil,
  cvv,
}: {
  cardNumber: string;
  validFrom: string;
  validUntil: string;
  cvv: string;
  cardHolder: string;
}) {
  return (
    <div className="select-none  h-48 w-80 bg-gradient-to-tr from-[#283990] via-[#773871] to-[#E7232C] text-white shadow-sm transition ">
      <div className="px-6 pt-4 pb-5 h-full flex flex-col justify-between">
        <header className="flex justify-between">
          <div className="flex font-semibold text-sm items-center gap-3">
            <Landmark />
            Banco XYZ
          </div>
          <div className="space-x-2">
            <img
              src="/img/visa.svg"
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
