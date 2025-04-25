// src/routes/dashboard.internal-transfer.jsx

// Import React y los hooks necesarios
import React, { useState } from "react"; // Importar React para los tipos de evento
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";

// --- Componentes UI (Asegúrate de tenerlos instalados via shadcn/ui) ---
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

// --- Definición de Tipos para TypeScript ---

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface FormData {
  originAccount: string;
  destinationAccount: string;
  amount: string; // Mantenemos string aquí porque viene del input
  description: string;
}

// Los errores pueden ser string o null/undefined si no hay error
interface FormErrors {
  originAccount?: string | null;
  destinationAccount?: string | null;
  amount?: string | null;
  description?: string | null;
}

// Usamos una Unión Discriminada para el resultado
interface TransactionSuccess {
  status: 'success';
  details: {
    originAccount: string;
    destinationAccount: string;
    amount: number; // El monto procesado sí es numérico
    description?: string;
    originAccountName?: string;
    destinationAccountName?: string;
    transactionId: string;
    timestamp: string;
  };
}

interface TransactionError {
  status: 'error';
  message: string;
  details?: { // Detalles del intento pueden ser útiles
    originAccount: string;
    destinationAccount: string;
    amount: number; // El monto intentado
    description?: string;
    originAccountName?: string;
    destinationAccountName?: string;
  };
}

// El estado puede ser uno de los dos o null inicialmente
type TransactionResult = TransactionSuccess | TransactionError | null;

// --- Datos Simulados (Reemplazar con datos reales) ---
const userAccounts: Account[] = [ // <-- Tipado explícito del array
  { id: "acc1", name: "Cuenta Corriente Principal - 1234", balance: 5000.00 },
  { id: "acc2", name: "Cuenta de Ahorros - 5678", balance: 15000.00 },
  { id: "acc3", name: "Cuenta Secundaria - 9012", balance: 1200.50 },
];
// --- Fin Datos Simulados ---

export default function InternalTransferSimpleForm() {
  const navigate = useNavigate();

  // --- Estados con Tipos Explícitos ---
  const [step, setStep] = useState<'form' | 'review' | 'result'>('form'); // Más específico

  const [formData, setFormData] = useState<FormData>({
    originAccount: '',
    destinationAccount: '',
    amount: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [transactionResult, setTransactionResult] = useState<TransactionResult>(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // --- Manejador de Cambios Genérico (Inputs, Textarea) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Asegurarnos que 'name' es una clave válida de FormData
    const formKey = name as keyof FormData;

    setFormData(prev => ({ ...prev, [formKey]: value }));

    // Limpiar error específico al cambiar el campo
    if (formErrors[formKey]) {
        setFormErrors(prev => ({ ...prev, [formKey]: null }));
    }
  };

  // --- Manejador de Cambios para Select ---
  const handleSelectChange = (name: keyof FormData, value: string) => {
     setFormData(prev => ({ ...prev, [name]: value }));
     if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // --- Validación Manual Simple ---
  const validateForm = (): boolean => {
    // Inicializamos con el tipo correcto
    const errors: FormErrors = {};
    if (!formData.originAccount) {
        errors.originAccount = "Selecciona una cuenta de origen.";
    }
    if (!formData.destinationAccount) {
        errors.destinationAccount = "Selecciona una cuenta de destino.";
    }
    // Solo validar si ambas cuentas están seleccionadas
    if (formData.originAccount && formData.destinationAccount && formData.originAccount === formData.destinationAccount) {
        errors.destinationAccount = "La cuenta de destino no puede ser la misma que la de origen.";
    }
    if (!formData.amount) {
        errors.amount = "Ingresa un monto.";
    } else {
        const numericAmount = parseFloat(formData.amount);
        if (isNaN(numericAmount)) {
            errors.amount = "El monto debe ser un número válido.";
        } else if (numericAmount <= 0) {
            errors.amount = "El monto debe ser positivo.";
        }
        // Opcional: Validar contra saldo si tienes acceso a él aquí
        // const originAccountDetails = userAccounts.find(a => a.id === formData.originAccount);
        // if (originAccountDetails && numericAmount > originAccountDetails.balance) {
        //     errors.amount = `Saldo insuficiente (${originAccountDetails.balance.toFixed(2)})`;
        // }
    }

    // if (formData.description.length > 100) errors.description = "Máximo 100 caracteres."

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Retorna true si no hay errores
  };

  // --- Manejador para ir a Revisión ---
  const handleGoToReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevenir envío de formulario HTML
    if (validateForm()) {
      setStep('review');
    }
  };

  // --- Manejador para Confirmar Transferencia ---
  const handleConfirmTransfer = async (): Promise<void> => { // Retorna Promise<void>
    setShowConfirmDialog(false);
    setIsLoading(true);

    // Asegurar que el monto es numérico antes de la simulación
    const amountToTransfer = parseFloat(formData.amount);
    if (isNaN(amountToTransfer)) {
        // Esto no debería pasar si la validación es correcta, pero es una salvaguarda
        setTransactionResult({
            status: 'error',
            message: 'Monto inválido detectado antes de enviar.',
        });
        setStep('result');
        setIsLoading(false);
        return;
    }

    // --- Simulación de Llamada a API ---
    console.log("Simulating API call with data:", { ...formData, amount: amountToTransfer });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const success = Math.random() > 0.2; // 80% éxito

    const originAccountName = userAccounts.find(a => a.id === formData.originAccount)?.name;
    const destinationAccountName = userAccounts.find(a => a.id === formData.destinationAccount)?.name;

    if (success) {
      // Construir el objeto asegurando que cumple la interfaz TransactionSuccess
      setTransactionResult({
        status: 'success',
        details: {
          originAccount: formData.originAccount,
          destinationAccount: formData.destinationAccount,
          amount: amountToTransfer, // Usar el número parseado
          description: formData.description || undefined, // Enviar undefined si está vacío
          originAccountName,
          destinationAccountName,
          transactionId: `TXN-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
        }
      });
    } else {
       // Construir el objeto asegurando que cumple la interfaz TransactionError
      setTransactionResult({
        status: 'error',
        message: "No se pudo completar la transferencia. Fondos insuficientes o error del servidor.",
        details: {
             originAccount: formData.originAccount,
             destinationAccount: formData.destinationAccount,
             amount: amountToTransfer, // Usar el número parseado
             description: formData.description || undefined,
             originAccountName,
             destinationAccountName,
        }
      });
    }
    // --- Fin Simulación ---

    setStep('result');
    setIsLoading(false);
  };

  // --- Manejador para Editar ---
  const handleEdit = (): void => { // Retorna void
    setStep('form');
    setTransactionResult(null); // Limpiar resultado previo si se edita
  };

  // --- Manejador para Nueva Transferencia ---
  const handleNewTransfer = (): void => { // Retorna void
    setFormData({
      originAccount: '',
      destinationAccount: '',
      amount: '',
      description: '',
    });
    setFormErrors({});
    setTransactionResult(null);
    setStep('form');
  };

  // --- Manejador Placeholder Descarga ---
  const handleDownloadReceipt = (format: 'pdf' | 'png'): void => { // Tipo explícito para format
    console.log(`Simulating download receipt in ${format.toUpperCase()} format...`);
    alert(`Funcionalidad de descarga (${format.toUpperCase()}) no implementada.`);
  };

  // --- Renderizado ---

  // 1. Formulario
  if (step === 'form') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Transacciones
        </Button>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Transferencia entre Cuentas Propias</CardTitle>
            <CardDescription>Mueve fondos entre tus cuentas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGoToReview} className="space-y-6" noValidate> {/* Añadir noValidate para que la validación HTML no interfiera */}
              {/* Cuenta Origen */}
              <div className="space-y-2">
                <Label htmlFor="originAccount">Cuenta Origen</Label>
                <Select
                    value={formData.originAccount}
                    // Pasamos explícitamente 'originAccount' como clave
                    onValueChange={(value) => handleSelectChange('originAccount', value)}
                >
                    <SelectTrigger id="originAccount" aria-invalid={!!formErrors.originAccount} aria-describedby="originAccount-error">
                        <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                        {userAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            {account.name} (Saldo: ${account.balance.toFixed(2)})
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {formErrors.originAccount && <p id="originAccount-error" className="text-sm text-destructive pt-1">{formErrors.originAccount}</p>}
              </div>

              {/* Cuenta Destino */}
               <div className="space-y-2">
                <Label htmlFor="destinationAccount">Cuenta Destino</Label>
                 <Select
                    value={formData.destinationAccount}
                     // Pasamos explícitamente 'destinationAccount' como clave
                    onValueChange={(value) => handleSelectChange('destinationAccount', value)}
                 >
                    <SelectTrigger id="destinationAccount" aria-invalid={!!formErrors.destinationAccount} aria-describedby="destinationAccount-error">
                        <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                        {userAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            {account.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 {formErrors.destinationAccount && <p id="destinationAccount-error" className="text-sm text-destructive pt-1">{formErrors.destinationAccount}</p>}
               </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="amount">Monto a Transferir</Label>
                <Input
                  id="amount"
                  name="amount" // name es importante para handleChange
                  type="number" // Sigue siendo útil para el teclado móvil, aunque manejemos como string
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  aria-invalid={!!formErrors.amount}
                  aria-describedby="amount-error"
                />
                 {formErrors.amount && <p id="amount-error" className="text-sm text-destructive pt-1">{formErrors.amount}</p>}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                 <Label htmlFor="description">Descripción (Opcional)</Label>
                 <Textarea
                    id="description"
                    name="description" // name es importante para handleChange
                    placeholder="Ej: Ahorro mensual, Pago..."
                    value={formData.description}
                    onChange={handleChange}
                    // Podrías añadir aria-invalid si validas la descripción
                  />
                  {formErrors.description && <p id="description-error" className="text-sm text-destructive pt-1">{formErrors.description}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Validando...' : 'Revisar Transferencia'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Revisión
  if (step === 'review') {
    // Busca los nombres de las cuentas para mostrarlos (con fallback por si acaso)
    const originAccountName = userAccounts.find(a => a.id === formData.originAccount)?.name ?? 'Cuenta no encontrada';
    const destinationAccountName = userAccounts.find(a => a.id === formData.destinationAccount)?.name ?? 'Cuenta no encontrada';
    // Parsear el monto para mostrarlo, con fallback a 0 si es inválido
    const amountToShow = parseFloat(formData.amount) || 0;

    return (
      <div className="container mx-auto py-8 space-y-6">
         <Button variant="ghost" onClick={handleEdit} className="mb-4" disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Editar Datos
        </Button>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Revisar Transferencia</CardTitle>
            <CardDescription>Confirma los detalles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desde:</span>
              <span className="font-medium text-right">{originAccountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hacia:</span>
              <span className="font-medium text-right">{destinationAccountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-medium text-lg text-primary">${amountToShow.toFixed(2)}</span>
            </div>
            {formData.description && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Descripción:</span>
                    <span className="font-medium text-right">{formData.description}</span>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleEdit} disabled={isLoading}>
              Editar
            </Button>
            <Button onClick={() => setShowConfirmDialog(true)} disabled={isLoading}>
                {isLoading ? (
                   <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando... </>
                ) : (
                   'Confirmar Transferencia'
                )}
            </Button>
          </CardFooter>
        </Card>

        {/* Diálogo de Confirmación Final */}
         <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Transferirás ${amountToShow.toFixed(2)} desde "{originAccountName}" a "{destinationAccountName}". Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmTransfer} disabled={isLoading}>
                {isLoading ? (
                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando... </>
                ) : (
                    'Confirmar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

   // 3. Resultado (Éxito o Error)
  if (step === 'result' && transactionResult) {
    // Ahora podemos usar la unión discriminada de forma segura
    const isSuccess = transactionResult.status === 'success';

    return (
       <div className="container mx-auto py-8 space-y-6">
         <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                 {isSuccess ? (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                         <CheckCircle className="h-5 w-5 text-green-600" />
                         <AlertTitle className="text-green-800">¡Transferencia Exitosa!</AlertTitle>
                         <AlertDescription className="text-green-700">
                             Tu transferencia se ha completado correctamente.
                         </AlertDescription>
                    </Alert>
                 ) : ( // Sabemos que es 'error'
                    <Alert variant="destructive">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>Error en la Transferencia</AlertTitle>
                        <AlertDescription>
                            {transactionResult.message || "Ocurrió un error inesperado."}
                        </AlertDescription>
                    </Alert>
                 )}
            </CardHeader>
            {/* Mostramos detalles siempre que existan en el objeto transactionResult */}
            {transactionResult.details && (
                <CardContent className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">
                        {isSuccess ? "Detalles de la Transacción" : "Detalles del Intento"}
                    </h3>
                    {/* Campos específicos del éxito */}
                    {isSuccess && transactionResult.details.transactionId && (
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">ID Transacción:</span>
                            <span className="font-mono text-sm">{transactionResult.details.transactionId}</span>
                         </div>
                    )}
                     {isSuccess && transactionResult.details.timestamp && (
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha y Hora:</span>
                            <span className="font-medium">{transactionResult.details.timestamp}</span>
                         </div>
                    )}
                     {/* Campos comunes */}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Cuenta Origen (*):</span>
                        {/* Usamos ?? para fallback si el nombre no se encontró antes */}
                        <span className="font-medium text-right">{transactionResult.details.originAccountName ?? transactionResult.details.originAccount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Cuenta Destino (*):</span>
                        <span className="font-medium text-right">{transactionResult.details.destinationAccountName ?? transactionResult.details.destinationAccount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Monto (*):</span>
                        <span className={`font-medium text-lg text-right ${isSuccess ? 'text-primary' : 'text-destructive'}`}>
                            ${transactionResult.details.amount.toFixed(2)}
                        </span>
                    </div>
                    {transactionResult.details.description && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Descripción:</span>
                            <span className="font-medium text-right">{transactionResult.details.description}</span>
                        </div>
                    )}
                </CardContent>
            )}
             <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
                 {isSuccess ? (
                     <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Descargar PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('png')}>
                            <Download className="mr-2 h-4 w-4" /> Descargar PNG
                        </Button>
                     </div>
                 ) : (
                     // Espacio vacío para alinear el botón a la derecha en caso de error
                     <div></div>
                 )}
                 <Button onClick={handleNewTransfer} className="w-full sm:w-auto">
                    {isSuccess ? 'Realizar Nueva Transferencia' : 'Volver a Intentar'}
                 </Button>
             </CardFooter>
         </Card>
       </div>
    );
  }

  // Fallback (Renderizado inicial o estado inesperado)
   return (
      <div className="container mx-auto py-8">
         {/* Podríamos mostrar un spinner aquí mientras se decide el primer render */}
         <p>Cargando...</p>
         {/* <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /> */}
      </div>
  );
}