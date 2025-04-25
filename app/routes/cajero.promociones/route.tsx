import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { DataTable } from "~/components/dashboard/home/DataTableTransaccion";
import { SearchBar } from "~/components/dashboard/home/SearchBar";
import type { Route } from "../admin.inicio/+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  // await requireUserSession(request);
}

export default function TransactionsPage() {

  return (
    <main className="">
      <section>
        <Card className="opacity-75">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-xl font-bold">
              
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-gray-500"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="M9.5 9a3 3 0 0 0 5 0" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Función no disponible
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta función estará disponible en una futura actualización.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}