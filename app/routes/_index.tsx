import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  
  return (
    <>
      <div className="grid place-items-center h-screen space-x-3">
        <h1 className="text-4xl font-bold">Bienvenido a la aplicación</h1>
        <h1 className="text-4xl font-bold">Landing Page</h1>
        {/* <Button icon={<LogIn />} variant="outline" asChild>
          <a href="/login">Iniciar sesión</a>
        </Button> */}
      </div>
    </>
  );
}
