import { getSession } from "~/session";
import { $api } from "../apiFetch";

export const getAllUserAccounts = async (
  req: Request,
  params: { userId: number }
) => {
  try {
    const response = await $api(`/cuenta/getCuentaByID/${params.userId}`, {}, req);
    return response;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return {
      error: true,
      message: error
    };
  }
};

export const requestNewAccount = async (
  req: Request,
  data: { id: number, tipoCuenta: string }
) => {
  try {
    const response = await $api(
      `/cuenta/${data.id}`, // Endpoint para solicitar cuenta
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      req
    );
    return response;
  } catch (error) {
    console.error("Error requesting account:", error);
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
};