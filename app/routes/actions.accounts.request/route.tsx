import type { Route } from "./+types/route";

export async function clientAction({ request }: Route.ClientActionArgs) {
  console.log("client action", Object.fromEntries(await request.formData()));
  return null;
}

export default function TestPage() {
  
}