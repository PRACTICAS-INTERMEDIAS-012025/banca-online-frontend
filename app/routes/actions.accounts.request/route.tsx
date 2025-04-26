import type { Route } from "./+types/route";
import { $api } from "~/lib/apiFetch";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const usuario = formData.get("userId")?.toString(); 
  const tipoCuenta = formData.get("tipoCuenta")?.toString();

  if (!usuario || !tipoCuenta) {
    return {
      error: true,
      message: "Faltan datos requeridos (userId o tipoCuenta)"
    };
  }

  if (!["1", "2"].includes(tipoCuenta)) {
    return {
      error: true,
      message: "Tipo de cuenta inválido. Use 1 (Monetaria) o 2 (Ahorro)"
    };
  }

  try {
    const response = await $api(
      "/cuenta/",
      {
        method: "POST",
        body: JSON.stringify({ 
          usuario,      
          tipoCuenta   
        }),
      },
      request
    );

    return { success: true, data: response };

  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : "Error al solicitar la cuenta"
    };
  }
}

export default function RequestAccountRoute() {
  return null;
}