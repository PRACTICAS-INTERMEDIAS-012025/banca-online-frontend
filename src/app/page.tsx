"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [testLoading, setTestLoading] = useState(false);

  const handleTestLoading = () => {
    setTestLoading(true);
    setTimeout(() => {
      setTestLoading(false);
    }, 2000);
  };

  return (
    <>
      <div className="grid place-items-center h-screen space-x-3">
        <Button
          icon={<LogIn />}
          variant="outline"
          loading={testLoading}
          onClick={handleTestLoading}
        >
          Iniciar sesión
        </Button>
       
      </div>
    </>
  );
}
