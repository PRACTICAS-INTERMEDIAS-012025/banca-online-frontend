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
