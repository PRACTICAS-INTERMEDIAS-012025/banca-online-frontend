
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import { AccountSelectorTransaction } from "~/components/dashboard/home/AccountSelectorTrasaction";
import type { Cuenta } from "~/lib/types/auth";
import { getAllUserAccounts } from "~/lib/api/accounts";
import { getCurrentUserData } from "~/session";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

interface FormDataState { amount: string; description: string; }
interface FormErrors { originAccount?: string | null; destinationAccount?: string | null; amount?: string | null; description?: string | null; api?: string | null; }
interface TransactionSuccessDetails { originAccount: string; destinationAccount: string; amount: number; description?: string; originAccountName?: string; destinationAccountName?: string; transactionId?: string; timestamp?: string; message?: string; }
interface TransactionErrorDetails { originAccount: string; destinationAccount: string; amount: number; description?: string; originAccountName?: string; destinationAccountName?: string; }
interface TransactionSuccess { status: 'success'; details: TransactionSuccessDetails; }
interface TransactionError { status: 'error'; message: string; details?: TransactionErrorDetails; }
type TransactionResult = TransactionSuccess | TransactionError | null;


interface LoaderData { userAccounts: Cuenta[]; userId: number | null; error?: string | null; }
export async function loader({ request }: { request: Request }) {
    const userData = await getCurrentUserData(request);
    const userId = userData?.usuario?.UID;
    if (!userId) { return { userAccounts: [], userId: null, error: "No autenticado" }; }
    try {
        const userAccounts = await getAllUserAccounts(request, { userId: userId });
        const userIdAsNumber = parseInt(String(userId ?? '0'), 10);
        return { userAccounts: userAccounts || [], userId: isNaN(userIdAsNumber) ? null : userIdAsNumber, error: null };
    } catch (error) {  return { userAccounts: [], userId: parseInt(String(userId ?? '0'), 10), error: "Error al cargar cuentas" }; }
}

// --- Componente Principal ---
export default function InternalTransferSimpleForm({ loaderData }: { loaderData: LoaderData | null }) {
  const navigate = useNavigate();

  // --- Estados ---
  const [selectedAccountOrigin, setSelectedAccountOrigin] = useState<Cuenta | null>(null);
  const [selectedAccountDestination, setSelectedAccountDestination] = useState<Cuenta | null>(null);
  const [accounts, setAccounts] = useState<Cuenta[]>([]);
  const [step, setStep] = useState<'form' | 'review' | 'result'>('form');
  const [formData, setFormData] = useState<FormDataState>({ amount: '', description: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // --- Efecto para inicializar ---
  useEffect(() => {
    if (loaderData?.error) {
        console.error("Error loader:", loaderData.error);
        setFormErrors(prev => ({...prev, api: loaderData.error ?? "Error carga inicial."}));
    }
    if (loaderData?.userAccounts) {
        const validAccounts = loaderData.userAccounts.filter((acc): acc is Cuenta => !!acc && acc.UID !== undefined); // Filtrar y asegurar UID
        setAccounts(validAccounts);
    }
  }, [loaderData]);

  // --- Manejador Cambios Input/Textarea  ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
      const { name, value } = e.target;
      if (name === 'amount' || name === 'description') {
          const formKey = name as keyof FormDataState;
          setFormData(prev => ({ ...prev, [formKey]: value }));
          if (formErrors[formKey]) setFormErrors(prev => ({ ...prev, [formKey]: null }));
      }
  };

  // --- Validación (Usando UID para comparación) ---
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!selectedAccountOrigin) errors.originAccount = "Selecciona una cuenta de origen.";
    if (!selectedAccountDestination) errors.destinationAccount = "Selecciona una cuenta de destino.";

    // *** CAMBIO: Comparar por UID ***
    if (selectedAccountOrigin?.UID !== undefined && selectedAccountDestination?.UID !== undefined && selectedAccountOrigin.UID === selectedAccountDestination.UID) {
        errors.destinationAccount = "La cuenta de destino no puede ser la misma que la de origen.";
    }
    // ... (Validación de monto) ...
     if (!formData.amount) errors.amount = "Ingresa un monto."; else {
        const numericAmount = parseFloat(formData.amount);
        if (isNaN(numericAmount)) errors.amount = "Monto inválido.";
        else if (numericAmount <= 0) errors.amount = "Monto debe ser positivo.";
        // Validar saldo (asumiendo saldo es string en Cuenta)
        if (selectedAccountOrigin && typeof selectedAccountOrigin.saldo === 'string') {
             const originBalance = parseFloat(selectedAccountOrigin.saldo);
             if (!isNaN(originBalance) && numericAmount > originBalance) {
                errors.amount = `Saldo insuficiente (Q${originBalance.toFixed(2)})`;
             }
        }
     }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

   // --- Manejador GoToReview (sin cambios) ---
  const handleGoToReview = (e: React.FormEvent<HTMLFormElement>) => { 
      e.preventDefault();
      setFormErrors(prev => ({ amount: prev.amount, description: prev.description, originAccount: null, destinationAccount: null, api: null }));
      if (validateForm()) setStep('review');
  };

  // --- Manejador Confirmar Transferencia (Usando UID y corrigiendo tipo saldo) ---
  const handleConfirmTransfer = async (): Promise<void> => {
    setShowConfirmDialog(false);
    if (!selectedAccountOrigin || !selectedAccountDestination) {  return; }

    setIsLoading(true);
    setTransactionResult(null);
    setFormErrors({});

    const amountToTransfer = parseFloat(formData.amount);
    // *** USAR UID ***
    const originUID = selectedAccountOrigin.UID;
    const destinationUID = selectedAccountDestination.UID;

    if (originUID === undefined || destinationUID === undefined || isNaN(amountToTransfer)) {  return; }

    // Convertir UID a número para la API
    const originIdNumber = Number(originUID);
    const destinationIdNumber = Number(destinationUID);
    if (isNaN(originIdNumber) || isNaN(destinationIdNumber)) {  return; }

    const apiUrl = "http://localhost:3003";
    const endpoint = "/transaccion/";
    const requestBody = { idCuentaOrinal: originIdNumber, idCuentaDestino: destinationIdNumber, monto: amountToTransfer };

    console.log("Enviando:", JSON.stringify(requestBody));

    const originAccountName = `${selectedAccountOrigin.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountOrigin.numero}`;
    const destinationAccountName = `${selectedAccountDestination.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountDestination.numero}`;

    try {
        const response = await fetch(`${apiUrl}${endpoint}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        let responseData: any = {}; 
        const responseText = await response.text(); try { if(responseText) responseData = JSON.parse(responseText); } catch(e){ console.warn("Respuesta no JSON:", responseText); if (!response.ok) responseData = { message: responseText }; }

        if (response.ok) {
            // --- ÉXITO ---
            const successDetails: TransactionSuccessDetails = {
                originAccount: String(originUID), // Guardar UID como string
                destinationAccount: String(destinationUID), // Guardar UID como string
                amount: amountToTransfer, description: formData.description || undefined,
                originAccountName, destinationAccountName,
                transactionId: responseData?.transactionId || `GEN-${Date.now()}`,
                timestamp: responseData?.timestamp || new Date().toLocaleString(),
                message: responseData?.message === "Transaccion realizada exitosamente" ? responseData.message : "Transacción completada.",
            };
            setTransactionResult({ status: 'success', details: successDetails });
            setStep('result');

            // *** ACTUALIZAR ESTADO LOCAL 'accounts' (CORREGIDO TIPO SALDO) ***
            setAccounts(prevAccounts => {
                const getNumericBalance = (acc: Cuenta): number => parseFloat(String(acc.saldo ?? '0')) || 0;
                return prevAccounts.map(acc => {
                    if (acc.UID !== undefined && acc.UID === originUID) {
                        const newBalance = getNumericBalance(acc) - amountToTransfer;
                        // *** CORRECCIÓN: Convertir a string formateado ***
                        return { ...acc, saldo: newBalance.toFixed(2) };
                    }
                    if (acc.UID !== undefined && acc.UID === destinationUID) {
                         const newBalance = getNumericBalance(acc) + amountToTransfer;
                         // *** CORRECCIÓN: Convertir a string formateado ***
                        return { ...acc, saldo: newBalance.toFixed(2) };
                    }
                    return acc;
                });
            });
            // *************************************************************

        } else { 
          console.error("API Error Response:", response.status, responseData); 
          let errorMessage = "Error al realizar la transacción."; 

          const backendMessage = responseData?.message;
          if (typeof backendMessage === 'string') {
               // Mapear mensajes específicos
               switch (backendMessage) {
                   case 'ACCOUNT_NOT_FOUND': errorMessage = "Cuenta no encontrada."; break;
                   case 'SALDO_INSUFICIENTE':
                       const saldoMatch = backendMessage.match(/cuenta (\S+)/);
                       errorMessage = saldoMatch ? `Saldo insuficiente en la cuenta ${saldoMatch[1]}.` : "Saldo insuficiente.";
                       break;
                   case 'ACCOUNT_NOT_ACTIVATED':
                       const activaMatch = backendMessage.match(/cuenta (\S+)/);
                       errorMessage = activaMatch ? `La cuenta ${activaMatch[1]} no está activa.` : "Cuenta no activa.";
                       break;
                   case 'Transaccion realizada exitosamente': errorMessage = "Respuesta inesperada del servidor."; break;
                   default: errorMessage = backendMessage; // Usar mensaje directo
               }
          } else if (response.status >= 400 && response.status < 500) {
              errorMessage = "Error en los datos enviados o solicitud inválida.";
          } else if (response.status >= 500) {
              errorMessage = "Error interno del servidor. Intente más tarde.";
          }
          const errorDetails: TransactionErrorDetails = {
               originAccount: String(originUID), 
               destinationAccount: String(destinationUID), 
               amount: amountToTransfer,
               description: formData.description || undefined,
               originAccountName: originAccountName, 
               destinationAccountName: destinationAccountName, 
          };

          setTransactionResult({
              status: 'error',
              message: errorMessage, 
              details: errorDetails   
          });
          setStep('result');
         
        }

    } catch (error) {
  
      console.error("Fetch error:", error);
      let networkErrorMessage = "No se pudo conectar con el servidor.";
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
          networkErrorMessage = "Error de red o CORS. No se pudo contactar al servidor.";
      }
      setTransactionResult({
          status: 'error',
          message: networkErrorMessage,
      });

      setStep('result');
  } finally {
      setIsLoading(false);
  }
};

   // --- Manejadores ---
  const handleEdit = (): void => { /* ... */ setStep('form'); setTransactionResult(null); };
  const handleDownloadReceipt = (format: 'pdf' | 'png'): void => { };
  const handleNewTransfer = (): void => {
    setFormData({ amount: '', description: '' });
    setSelectedAccountOrigin(null);
    setSelectedAccountDestination(null);
    setFormErrors({});
    setTransactionResult(null);
    setStep('form');
  };

  // --- Renderizado COMPLETO ---

   if (!loaderData) {
       return ( <div className="container mx-auto py-8 flex justify-center items-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> );
   }
   if (loaderData.error && accounts.length === 0) {
       return ( <div className="container mx-auto py-8 text-center"><p className="text-destructive">{loaderData.error}</p><Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">Volver</Button></div> );
   }

  // 1. Formulario
  if (step === 'form') {
    const userIdAsNumber = Number(loaderData?.userId ?? 0); // Convertir userId

    return (
      <div className="container mx-auto py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader><CardTitle>Transferencia Propia</CardTitle><CardDescription>Mueve fondos entre tus cuentas.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleGoToReview} className="space-y-6" noValidate>
              {/* Cuenta Origen */}
              <div className="space-y-2">
                <Label htmlFor="originAccountSelector">Cuenta Origen (*)</Label>
                <AccountSelectorTransaction
                    accounts={accounts}
                    selectedAccount={selectedAccountOrigin}
                    onAccountSelect={(account) => { setSelectedAccountOrigin(account); if(formErrors.originAccount) setFormErrors(prev => ({...prev, originAccount: null})); }}
                    placeholder="Seleccione cuenta origen"
                    
                />
                {formErrors.originAccount && <p id="originAccount-error" className="text-sm text-destructive pt-1">{formErrors.originAccount}</p>}
              </div>
              {/* Cuenta Destino */}
               <div className="space-y-2">
                <Label htmlFor="destinationAccountSelector">Cuenta Destino (*)</Label>
                 <AccountSelectorTransaction
                    accounts={accounts}
                    selectedAccount={selectedAccountDestination}
                    onAccountSelect={(account) => { setSelectedAccountDestination(account); if(formErrors.destinationAccount) setFormErrors(prev => ({...prev, destinationAccount: null})); }}
                    placeholder="Seleccione cuenta destino"
                 />
                 {formErrors.destinationAccount && <p id="destinationAccount-error" className="text-sm text-destructive pt-1">{formErrors.destinationAccount}</p>}
               </div>
              {/* Monto */}
              <div className="space-y-2"> <Label htmlFor="amount">Monto (*)</Label> <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={handleChange} aria-invalid={!!formErrors.amount} aria-describedby="amount-error"/> {formErrors.amount && <p id="amount-error" className="text-sm text-destructive pt-1">{formErrors.amount}</p>} </div>
              {/* Descripción */}
              <div className="space-y-2"> <Label htmlFor="description">Descripción (Opcional)</Label> <Textarea id="description" name="description" placeholder="Ej: Ahorro mensual..." value={formData.description} onChange={handleChange}/> {formErrors.description && <p id="description-error" className="text-sm text-destructive pt-1">{formErrors.description}</p>} </div>
              {/* Errores API */}
              {formErrors.api && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{formErrors.api}</AlertDescription></Alert>)}
              {/* Botón Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : 'Revisar Transferencia'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Revisión
  if (step === 'review') {
     const originAccountName = selectedAccountOrigin ? `${selectedAccountOrigin.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountOrigin.numero}` : "N/A";
     const destinationAccountName = selectedAccountDestination ? `${selectedAccountDestination.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountDestination.numero}` : "N/A";
     const amountToShow = parseFloat(formData.amount) || 0;
     return (
        <div className="container mx-auto py-8 space-y-6">
           <Button variant="ghost" onClick={handleEdit} className="mb-4" disabled={isLoading}><ArrowLeft className="mr-2 h-4 w-4" /> Editar Datos</Button>
           <Card className="w-full max-w-2xl mx-auto">
             <CardHeader><CardTitle>Revisar Transferencia</CardTitle><CardDescription>Confirma los detalles.</CardDescription></CardHeader>
             <CardContent className="space-y-4">
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Desde:</span><span className="font-medium text-right">{originAccountName}</span></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Hacia:</span><span className="font-medium text-right">{destinationAccountName}</span></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Monto:</span><span className="font-medium text-lg text-primary">${amountToShow.toFixed(2)}</span></div>
               {formData.description && (<div className="flex justify-between items-start"><span className="text-muted-foreground pt-px">Descripción:</span><span className="font-medium text-right break-words max-w-[70%]">{formData.description}</span></div>)}
             </CardContent>
             <CardFooter className="flex justify-end space-x-3">
               <Button variant="outline" onClick={handleEdit} disabled={isLoading}>Editar</Button>
               <Button onClick={() => setShowConfirmDialog(true)} disabled={isLoading}>{isLoading ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando... </>) : ('Confirmar Transferencia')}</Button>
             </CardFooter>
           </Card>
           <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                 <AlertDialogDescription>Transferirás ${amountToShow.toFixed(2)} desde "{originAccountName}" a "{destinationAccountName}". Esta acción no se puede deshacer.</AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
                 <AlertDialogAction onClick={handleConfirmTransfer} disabled={isLoading}>{isLoading ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando... </>) : ('Confirmar')}</AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
          </AlertDialog>
        </div>
      );
  }

   // 3. Resultado
  if (step === 'result' && transactionResult) {
     const isSuccess = transactionResult.status === 'success';
     return (
        <div className="container mx-auto py-8 space-y-6">
           <Card className="w-full max-w-2xl mx-auto">
             <CardHeader>
               {isSuccess ? (<Alert variant="default" className="bg-green-50 border-green-200"><CheckCircle className="h-5 w-5 text-green-600" /><AlertTitle className="text-green-800">¡Transferencia Exitosa!</AlertTitle><AlertDescription className="text-green-700">{transactionResult.details?.message || "Tu transferencia se ha completado correctamente."}</AlertDescription></Alert>)
               : (<Alert variant="destructive"><AlertCircle className="h-5 w-5" /><AlertTitle>Error en la Transferencia</AlertTitle><AlertDescription>{transactionResult.message || "Ocurrió un error inesperado."}</AlertDescription></Alert>)}
             </CardHeader>
             {transactionResult.details && (
               <CardContent className="space-y-4">
                 <h3 className="text-lg font-semibold mb-3">{isSuccess ? "Detalles de la Transacción" : "Detalles del Intento"}</h3>
                 {isSuccess && transactionResult.details.transactionId && !transactionResult.details.transactionId.startsWith('GEN-') && (<div className="flex justify-between"><span className="text-muted-foreground">ID Transacción:</span><span className="font-mono text-sm">{transactionResult.details.transactionId}</span></div>)}
                 {isSuccess && transactionResult.details.timestamp && (<div className="flex justify-between"><span className="text-muted-foreground">Fecha y Hora:</span><span className="font-medium">{transactionResult.details.timestamp}</span></div>)}
                 <div className="flex justify-between items-center"><span className="text-muted-foreground">Cuenta Origen:</span><span className="font-medium text-right">{transactionResult.details.originAccountName ?? `UID: ${transactionResult.details.originAccount}`}</span></div>
                 <div className="flex justify-between items-center"><span className="text-muted-foreground">Cuenta Destino:</span><span className="font-medium text-right">{transactionResult.details.destinationAccountName ?? `UID: ${transactionResult.details.destinationAccount}`}</span></div>
                 <div className="flex justify-between items-center"><span className="text-muted-foreground">Monto:</span><span className={`font-medium text-lg text-right ${isSuccess ? 'text-primary' : 'text-destructive'}`}>${transactionResult.details.amount.toFixed(2)}</span></div>
                 {transactionResult.details.description && (<div className="flex justify-between items-start"><span className="text-muted-foreground pt-px">Descripción:</span><span className="font-medium text-right break-words max-w-[70%]">{transactionResult.details.description}</span></div>)}
               </CardContent>
             )}
             <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
               {isSuccess ? (<div className="flex space-x-2"><Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('pdf')}><Download className="mr-2 h-4 w-4" /> Descargar PDF</Button><Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('png')}><Download className="mr-2 h-4 w-4" /> Descargar PNG</Button></div>) : (<div></div>)}
               <Button onClick={handleNewTransfer} className="w-full sm:w-auto">{isSuccess ? 'Realizar Nueva Transferencia' : 'Volver a Intentar'}</Button>
             </CardFooter>
           </Card>
        </div>
     );
  }

  // Fallback final
   return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[300px]">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
  );
}