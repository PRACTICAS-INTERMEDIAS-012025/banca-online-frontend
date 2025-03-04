import { CreditCardPreview } from "@/components/dashboard/home/CreditCardPreview";

export default function DashboardPage() {
  return (
    <main className="grid grid-cols-[auto,1fr] gap-4">
      <section>
        <h2 className="font-bold pb-4">Tarjeta principal</h2>

        <CreditCardPreview
          cardNumber="**** **** **** 1234"
          validFrom="01/23"
          validUntil="01/25"
          cvv="123"
          cardHolder="Titular tarjeta cr"
        />
      </section>
    </main>
  );
}
