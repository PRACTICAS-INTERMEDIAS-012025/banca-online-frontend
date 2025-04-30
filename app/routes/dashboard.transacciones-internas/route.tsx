import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AccountSelectorTransaction } from "~/components/dashboard/home/AccountSelectorTrasaction"; // Asegúrate que la ruta es correcta
import type { Cuenta } from "~/lib/types/auth";
import { getAllUserAccounts } from "~/lib/api/accounts"; // Asegúrate que la ruta es correcta
import { $api } from "~/lib/apiFetch"; // <--- Importa tu helper $api
import { getCurrentUserData } from "~/session"; // Asegúrate que la ruta es correcta
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

// --- Interfaces (Sin cambios respecto a tu código original) ---
interface FormDataState { amount: string; description: string; }
interface FormErrors { originAccount?: string | null; destinationAccount?: string | null; amount?: string | null; description?: string | null; api?: string | null; }
interface TransactionSuccessDetails {
  originAccount: string;
  destinationAccount: string;
  amount: number;
  description?: string;
  originAccountName?: string;
  destinationAccountName?: string;
  transactionId?: string;
  timestamp: string;
  message?: string;
}
interface TransactionErrorDetails { originAccount: string; destinationAccount: string; amount: number; description?: string; originAccountName?: string; destinationAccountName?: string; }
interface TransactionSuccess { status: 'success'; details: TransactionSuccessDetails; }
interface TransactionError { status: 'error'; message: string; details?: TransactionErrorDetails; }
type TransactionResult = TransactionSuccess | TransactionError | null;

interface LoaderData { userAccounts: Cuenta[]; userId: number | null; error?: string | null; }

// --- Interfaz para la respuesta de la API de transacción ---
// (Necesaria para tipar la respuesta de $api)
interface TransactionApiResponse {
    transactionId?: string;
    timestamp?: string;
    message?: string;
    // Otros campos que tu API podría devolver en éxito
}


// --- Loader (Sin cambios) ---
export async function loader({ request }: { request: Request }) {
  const userData = await getCurrentUserData(request);
  const userId = userData?.usuario?.UID;
  if (!userId) { return { userAccounts: [], userId: null, error: "No autenticado" }; }
  try {
    const userAccounts = await getAllUserAccounts(request, { userId: userId });
    const userIdAsNumber = parseInt(String(userId ?? '0'), 10);
    return {
      userAccounts: userAccounts || [],
      userId: isNaN(userIdAsNumber) ? null : userIdAsNumber,
      error: null
    };
  } catch (error) {
    console.error("Error en loader:", error);
    const userIdAsNumber = parseInt(String(userId ?? '0'), 10);
    return {
      userAccounts: [],
      userId: isNaN(userIdAsNumber) ? null : userIdAsNumber,
      error: "Error al cargar cuentas"
    };
  }
}


// --- Componente ---
export default function InternalTransferSimpleForm({ loaderData }: { loaderData: LoaderData | null }) {
  const navigate = useNavigate();
  const receiptCardRef = useRef<HTMLDivElement>(null);

  // --- Estados (Sin cambios) ---
  const [selectedAccountOrigin, setSelectedAccountOrigin] = useState<Cuenta | null>(null);
  const [selectedAccountDestination, setSelectedAccountDestination] = useState<Cuenta | null>(null);
  const [accounts, setAccounts] = useState<Cuenta[]>([]);
  const [step, setStep] = useState<'form' | 'review' | 'result'>('form');
  const [formData, setFormData] = useState<FormDataState>({ amount: '', description: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<false | 'pdf' | 'png'>(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);


  // --- useEffect y Handlers de Formulario (Sin cambios) ---
  useEffect(() => {
    if (loaderData?.error) {
      console.error("Error loader:", loaderData.error);
      setFormErrors(prev => ({...prev, api: loaderData.error ?? "Error carga inicial."}));
    }
    if (loaderData?.userAccounts) {
      const validAccounts = loaderData.userAccounts.filter((acc): acc is Cuenta => !!acc && acc.UID !== undefined);
      setAccounts(validAccounts);
    } else {
      setAccounts([]);
    }
  }, [loaderData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'amount' || name === 'description') {
      const formKey = name as keyof FormDataState;
      setFormData(prev => ({ ...prev, [formKey]: value }));
      if (formErrors[formKey]) setFormErrors(prev => ({ ...prev, [formKey]: null }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!selectedAccountOrigin) errors.originAccount = "Selecciona cuenta origen.";
    if (!selectedAccountDestination) errors.destinationAccount = "Selecciona cuenta destino.";
    if (selectedAccountOrigin?.UID !== undefined && selectedAccountDestination?.UID !== undefined && selectedAccountOrigin.UID === selectedAccountDestination.UID) {
      errors.destinationAccount = "Cuentas no pueden ser iguales.";
    }
    if (!formData.amount) errors.amount = "Ingresa un monto."; else {
      const numericAmount = parseFloat(formData.amount);
      if (isNaN(numericAmount)) errors.amount = "Monto inválido.";
      else if (numericAmount <= 0) errors.amount = "Monto debe ser positivo.";
      if (selectedAccountOrigin && typeof selectedAccountOrigin.saldo === 'string') {
        const originBalance = parseFloat(selectedAccountOrigin.saldo);
        if (!isNaN(originBalance) && numericAmount > originBalance) {
          errors.amount = `Saldo insuficiente (Q${originBalance.toFixed(2)})`;
        }
      } else if (selectedAccountOrigin && typeof selectedAccountOrigin.saldo === 'number') {
        if (numericAmount > selectedAccountOrigin.saldo) {
          errors.amount = `Saldo insuficiente (Q ${selectedAccountOrigin.saldo})`; // Asegurar formato
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoToReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Limpia solo errores de selección al ir a revisar, mantiene otros errores (monto, etc.) si los hubiera
    setFormErrors(prev => ({ ...prev, originAccount: null, destinationAccount: null }));
    if (validateForm()) {
      setStep('review');
    }
  };

  // --- Función de Confirmación de Transferencia MODIFICADA ---
  const handleConfirmTransfer = async (): Promise<void> => {
    setShowConfirmDialog(false);
    if (!selectedAccountOrigin || !selectedAccountDestination) return;

    setIsLoading(true);
    setTransactionResult(null);
    setFormErrors({}); // Limpia errores antes del intento

    const amountToTransfer = parseFloat(formData.amount);
    const originUID = selectedAccountOrigin.UID;
    const destinationUID = selectedAccountDestination.UID;

    // Validación de datos antes de la llamada (importante)
    if (originUID === undefined || destinationUID === undefined || isNaN(amountToTransfer) || amountToTransfer <= 0) {
        console.error("Datos de transferencia inválidos pre-API:", { originUID, destinationUID, amountToTransfer });
        // Establece un error genérico si la validación falla aquí
        setTransactionResult({
            status: 'error',
            message: "Error interno: Datos de transferencia inválidos antes de enviar.",
             // Opcional: añadir detalles del intento si es útil
            details: {
                originAccount: String(originUID ?? 'N/A'),
                destinationAccount: String(destinationUID ?? 'N/A'),
                amount: isNaN(amountToTransfer) ? 0 : amountToTransfer,
                description: formData.description || undefined,
                originAccountName: selectedAccountOrigin?.numero ? `${selectedAccountOrigin.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountOrigin.numero}` : undefined,
                destinationAccountName: selectedAccountDestination?.numero ? `${selectedAccountDestination.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountDestination.numero}`: undefined,
            }
        });
        setStep('result');
        setIsLoading(false);
        return;
    }

    const originIdNumber = Number(originUID); // Asume que UID es convertible a número si la API lo espera
    const destinationIdNumber = Number(destinationUID);

    if (isNaN(originIdNumber) || isNaN(destinationIdNumber)) {
        console.error("Error convirtiendo UIDs a números:", { originUID, destinationUID });
        setTransactionResult({ status: 'error', message: "Error interno: IDs de cuenta inválidos." });
        setStep('result');
        setIsLoading(false);
        return;
    }

    // Preparación de datos para la API
    const endpoint = "/transaccion/";
    const requestBody = {
        idCuentaOrinal: originIdNumber, // <-- Asegúrate que estos nombres coinciden con tu API
        idCuentaDestino: destinationIdNumber,
        monto: amountToTransfer
    };
    const originAccountName = `${selectedAccountOrigin.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountOrigin.numero}`;
    const destinationAccountName = `${selectedAccountDestination.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountDestination.numero}`;

    try {
      // ---- Llamada a la API usando $api ----
      const responseData = await $api<TransactionApiResponse>(endpoint, {
        method: 'PUT',
        body: requestBody,
        // Asumiendo que $api maneja 'Content-Type' y JSON.stringify
      });
      // --------------------------------------

      // Si $api no lanzó error, la transacción fue exitosa (status 2xx)
      const successDetails: TransactionSuccessDetails = {
        originAccount: String(originUID), // Guardamos los UIDs originales
        destinationAccount: String(destinationUID),
        amount: amountToTransfer,
        description: formData.description || undefined,
        originAccountName,
        destinationAccountName,
        transactionId: responseData?.transactionId || `GEN-${Date.now()}`, // Fallback si la API no devuelve ID
        timestamp: responseData?.timestamp || new Date().toISOString(),     // Fallback si la API no devuelve timestamp
        message: responseData?.message || "Transacción completada.",         // Mensaje de la API o genérico
      };
      setTransactionResult({ status: 'success', details: successDetails });
      setStep('result');

    } catch (error) {
      // $api debería lanzar un error en caso de fallo (red o status >= 400)
      console.error("Error durante la transacción via $api:", error);

      // Intenta obtener un mensaje de error útil
      let errorMessage = "Ocurrió un error al procesar la transacción.";
       if (error instanceof Error) {
            // Si $api adjunta datos del error (ej. error.data.message desde el backend)
            // podrías intentar accederlos:
            // errorMessage = (error as any).data?.message || error.message;
            errorMessage = error.message; // Por defecto, usa el mensaje del objeto Error
       } else if (typeof error === 'string') {
           errorMessage = error; // Si el error es solo un string
       }

      // Prepara detalles del intento fallido para mostrar al usuario
      const errorDetails: TransactionErrorDetails = {
        originAccount: String(originUID),
        destinationAccount: String(destinationUID),
        amount: amountToTransfer,
        description: formData.description || undefined,
        originAccountName,
        destinationAccountName,
      };

      setTransactionResult({
        status: 'error',
        message: `Error: ${errorMessage}`, // Muestra el mensaje de error capturado
        details: errorDetails             // Incluye los detalles del intento
      });
      setStep('result'); // Cambia a la vista de resultado (mostrando el error)

    } finally {
      setIsLoading(false); // Asegura que el estado de carga se desactive
    }
  };

  // --- Handlers de Navegación y Descarga (Sin cambios) ---
  const handleEdit = (): void => { setStep('form'); };
  const handleNewTransfer = (): void => {
    setStep('form');
    setFormData({ amount: '', description: '' });
    setSelectedAccountOrigin(null);
    setSelectedAccountDestination(null);
    setTransactionResult(null);
    setFormErrors({}); // Limpia errores al empezar de nuevo
  };

  const handleDownloadReceipt = async (format: 'pdf' | 'png') => {
    // ... (lógica de descarga sin cambios, asegúrate que funciona con transactionResult.details) ...
    console.log(`--- [handleDownloadReceipt] START - Format: ${format} ---`);
    if (step !== 'result' || transactionResult?.status !== 'success' || !transactionResult.details?.timestamp || !transactionResult.details.transactionId) {
      console.error(">>> CONDICIÓN FALLÓ:", { step, status: transactionResult?.status, hasDetails: !!transactionResult?.details }); alert("Datos inválidos para generar comprobante."); return;
    }
    const details = transactionResult.details;
    console.log(">>> Detalles para comprobante:", details);

    const timestampDate = new Date(details.timestamp);
    if (isNaN(timestampDate.getTime())) {
      console.error("Timestamp inválido:", details.timestamp);
      alert("Error interno con la fecha del comprobante.");
      setIsDownloading(false);
      return;
    }

    const dateForFilename = timestampDate.toISOString().split('T')[0];
    const filenameBase = `Comprobante_Transferencia_${dateForFilename}_${details.transactionId?.slice(-4) ?? Date.now().toString().slice(-4)}`; // Añadir algo único
    const displayDate = timestampDate.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const displayTime = timestampDate.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

    setIsDownloading(format);
    try {
      console.log(`>>> Generando ${format.toUpperCase()}`);
      if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        console.log("   - jsPDF instancia creada");
        const margin = 15; let currentY = margin + 10; const lineHeight = 7; const valueOffset = 50; // Aumentado para más espacio
        doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text("Comprobante de Transferencia", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' }); currentY += lineHeight * 2.5;

        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${displayDate}`, margin, currentY);
        doc.text(`Hora: ${displayTime}`, doc.internal.pageSize.getWidth() - margin, currentY, { align: 'right' });
        currentY += lineHeight * 1.5; // Más espacio

        if(details.transactionId){
            doc.text(`ID Transacción:`, margin, currentY);
            doc.setFont('helvetica', 'bold'); // ID en negrita
            doc.text(details.transactionId, margin + valueOffset, currentY);
            doc.setFont('helvetica', 'normal');
            currentY += lineHeight * 1.5; // Más espacio
        } else {
            currentY += lineHeight;
        }

        // Función helper para filas de detalles
        const drawDetailRow = (label: string, value: string | undefined, isValueBold: boolean = false, valueMaxWidth?: number) => {
            if (value) {
                doc.setFont('helvetica', 'bold'); // Etiqueta siempre en negrita
                doc.text(label, margin, currentY);
                doc.setFont('helvetica', isValueBold ? 'bold' : 'normal');
                const textValue = valueMaxWidth ? doc.splitTextToSize(value, valueMaxWidth) : value;
                doc.text(textValue, margin + valueOffset, currentY);
                // Incrementar Y basado en si el valor es multilínea
                if (Array.isArray(textValue)) {
                    currentY += lineHeight * textValue.length;
                } else {
                    currentY += lineHeight;
                }
            }
        };

        const valueMaxWidth = doc.internal.pageSize.getWidth() - margin - (margin + valueOffset);

        drawDetailRow("Cuenta Origen:", details.originAccountName || `UID: ${details.originAccount}`, false, valueMaxWidth);
        drawDetailRow("Cuenta Destino:", details.destinationAccountName || `UID: ${details.destinationAccount}`, false, valueMaxWidth);
        drawDetailRow("Monto:", `Q ${details.amount.toFixed(2)}`, true); // Monto en negrita

        if (details.description) {
            currentY += lineHeight / 2; // Pequeño espacio antes de descripción
            drawDetailRow("Descripción:", details.description, false, valueMaxWidth);
        }

        // Footer
        currentY = doc.internal.pageSize.getHeight() - margin;
        doc.setFontSize(9); doc.setTextColor(150); doc.text("Generado por BanCuchus.", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });

        console.log("   - Llamando doc.save()");
        doc.save(`${filenameBase}.pdf`);
        console.log("   - PDF guardado.");

      } else  if (format === 'png' && receiptCardRef.current) {
          const elementToCapture = receiptCardRef.current;
          const buttonsContainer = elementToCapture.querySelector('.download-buttons-container');
          const newTransferButton = elementToCapture.querySelector('.new-transfer-button');

          // Ocultar botones temporalmente
          if (buttonsContainer) (buttonsContainer as HTMLElement).style.visibility = 'hidden';
          if (newTransferButton) (newTransferButton as HTMLElement).style.visibility = 'hidden';

           // Forzar fondo blanco si es necesario (p.ej., si el tema es oscuro)
           const originalBg = elementToCapture.style.backgroundColor;
           elementToCapture.style.backgroundColor = 'white'; // Fondo blanco para PNG

          await new Promise(resolve => setTimeout(resolve, 50)); // Pausa breve

          const canvas = await html2canvas(elementToCapture, {
              scale: 2,
              useCORS: true,
              logging: true,
              backgroundColor: null, // Dejar que el fondo del elemento (ahora blanco) se use
               // Intenta quitar elementos específicos por selector si ignoreElements no funciona bien
               ignoreElements: (element) => element.classList.contains('download-buttons-container') || element.classList.contains('new-transfer-button')
          });

          // Restaurar visibilidad y fondo
          elementToCapture.style.backgroundColor = originalBg;
          if (buttonsContainer) (buttonsContainer as HTMLElement).style.visibility = 'visible';
          if (newTransferButton) (newTransferButton as HTMLElement).style.visibility = 'visible';


          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `${filenameBase}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log("   - PNG generado y descarga iniciada.");
      }
    } catch (error) {
      console.error(`Error al generar ${format.toUpperCase()}:`, error);
      alert(`No se pudo generar el ${format.toUpperCase()}. Intente nuevamente.`);
        // Asegurar restauración de visibilidad/fondo en caso de error
        if (receiptCardRef.current) {
            const element = receiptCardRef.current;
            const buttonsContainer = element.querySelector('.download-buttons-container');
            const newTransferButton = element.querySelector('.new-transfer-button');
            // Asume que el fondo original era transparente o el default
            element.style.backgroundColor = '';
            if (buttonsContainer) (buttonsContainer as HTMLElement).style.visibility = 'visible';
            if (newTransferButton) (newTransferButton as HTMLElement).style.visibility = 'visible';
        }
    } finally {
      setIsDownloading(false);
       console.log(`--- [handleDownloadReceipt] END - Format: ${format} ---`);
    }
  };


  // --- Renderizado (Sin cambios lógicos significativos) ---

  // Estado inicial o error fatal del loader
  if (!loaderData) {
    return ( <div className="container mx-auto py-8 flex justify-center items-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> );
  }
  if (loaderData.error && accounts.length === 0) {
    return ( <div className="container mx-auto py-8 text-center"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{loaderData.error}</AlertDescription></Alert><Button variant="link" onClick={() => navigate('/dashboard')} className="mt-4">Volver al Dashboard</Button></div> );
  }

  // 1. Formulario
  if (step === 'form') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
         {formErrors.api && !loaderData.error && (
             <Alert variant="destructive" className="mb-4">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Error</AlertTitle>
                 <AlertDescription>{formErrors.api}</AlertDescription>
             </Alert>
         )}
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
                    onAccountSelect={(account: Cuenta | null) => { // Asegurar tipo Cuenta si es posible
                        setSelectedAccountOrigin(account);
                        // Limpiar errores relacionados al seleccionar
                        if(formErrors.originAccount || formErrors.destinationAccount === "Cuentas no pueden ser iguales.") {
                            setFormErrors(prev => ({...prev, originAccount: null, destinationAccount: prev.destinationAccount === "Cuentas no pueden ser iguales." ? null : prev.destinationAccount }));
                        }
                    }}
                    placeholder="Seleccione cuenta origen"
                    aria-describedby="originAccount-error"
                />
                {formErrors.originAccount && <p id="originAccount-error" className="text-sm text-destructive pt-1">{formErrors.originAccount}</p>}
              </div>
              {/* Cuenta Destino */}
               <div className="space-y-2">
                <Label htmlFor="destinationAccountSelector">Cuenta Destino (*)</Label>
                 <AccountSelectorTransaction
                    accounts={accounts}
                    selectedAccount={selectedAccountDestination}
                    onAccountSelect={(account: Cuenta | null) => { // Asegurar tipo Cuenta
                        setSelectedAccountDestination(account);
                        // Limpiar error de destino o de igualdad
                        if(formErrors.destinationAccount) {
                            setFormErrors(prev => ({...prev, destinationAccount: null}));
                        }
                    }}
                    placeholder="Seleccione cuenta destino"
                    aria-describedby="destinationAccount-error"
                 />
                 {formErrors.destinationAccount && <p id="destinationAccount-error" className="text-sm text-destructive pt-1">{formErrors.destinationAccount}</p>}
               </div>
              {/* Monto */}
              <div className="space-y-2">
                  <Label htmlFor="amount">Monto (*)</Label>
                  <Input
                      id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01"
                      placeholder="0.00" value={formData.amount} onChange={handleChange}
                      aria-invalid={!!formErrors.amount} aria-describedby="amount-error"
                  />
                  {formErrors.amount && <p id="amount-error" className="text-sm text-destructive pt-1">{formErrors.amount}</p>}
              </div>
              {/* Descripción */}
              <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Textarea
                      id="description" name="description" placeholder="Ej: Ahorro mensual..."
                      value={formData.description} onChange={handleChange} maxLength={100}
                      aria-describedby="description-error"
                  />
                  {formErrors.description && <p id="description-error" className="text-sm text-destructive pt-1">{formErrors.description}</p>}
              </div>
              {/* Botón Submit */}
              <Button type="submit" className="w-full" disabled={isLoading || accounts.length < 2}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Revisando...</> : 'Revisar Transferencia'}
              </Button>
              {accounts.length < 2 && <p className="text-sm text-muted-foreground text-center pt-2">Necesitas al menos dos cuentas para realizar una transferencia.</p>}
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
          <CardHeader><CardTitle>Revisar Transferencia</CardTitle><CardDescription>Confirma los detalles antes de proceder.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Desde:</span><span className="font-medium text-right">{originAccountName}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Hacia:</span><span className="font-medium text-right">{destinationAccountName}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Monto a transferir:</span><span className="font-medium text-lg text-primary">Q {amountToShow.toFixed(2)}</span></div>
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
                <AlertDialogDescription>
                    Estás a punto de transferir <strong className="text-primary">Q {amountToShow.toFixed(2)}</strong> desde la cuenta "{originAccountName}" hacia la cuenta "{destinationAccountName}".
                    <br/>
                    Esta acción no se puede deshacer.
                 </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmTransfer} disabled={isLoading}>
                    {isLoading ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando... </>) : ('Sí, transferir ahora')}
                 </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

 // 3. Resultado
  if (step === 'result' && transactionResult) {
    // const isSuccess = transactionResult.status === 'success'; // Ya no es estrictamente necesario aquí, pero podemos mantenerlo por legibilidad si se usa en otros lugares
    const details = transactionResult.details; // details sigue siendo TransactionSuccessDetails | TransactionErrorDetails | undefined

    return (
      <div className="container mx-auto py-8 space-y-6">
        <Card ref={receiptCardRef} className="w-full max-w-2xl mx-auto overflow-hidden">
          <CardHeader className="pb-4">
            {/* --- CORRECCIÓN 1: Acceder a .message basado en el tipo de transactionResult --- */}
            {transactionResult.status === 'success' ? (
              // Si el status es 'success', sabemos que transactionResult es TransactionSuccess
              // y por lo tanto transactionResult.details TIENE .message
              <Alert variant="default" className="bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700">
                  <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-200">¡Transferencia Exitosa!</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-300">
                      {/* Accedemos a través de transactionResult que está correctamente tipado aquí */}
                      {transactionResult.details?.message || "Tu transferencia se ha completado correctamente."}
                   </AlertDescription>
              </Alert>
            ) : (
              // Si el status NO es 'success', sabemos que transactionResult es TransactionError
              // y por lo tanto transactionResult TIENE .message
              <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>Error en la Transferencia</AlertTitle>
                  <AlertDescription>
                      {/* Accedemos a través de transactionResult que está correctamente tipado aquí */}
                      {transactionResult.message || "No se pudo completar la transferencia."}
                  </AlertDescription>
              </Alert>
            )}
          </CardHeader>

          {/* Detalles (mostrar siempre que details exista) */}
          {details && ( // Asegura que details no sea undefined
            <CardContent className="space-y-4 pt-2">
              {/* El título SÍ puede usar isSuccess o transactionResult.status */}
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">{transactionResult.status === 'success' ? "Detalles de la Transacción" : "Detalles del Intento"}</h3>

              {/* --- CORRECCIÓN 2 y 3: Verificar status ANTES de acceder a props específicas --- */}
              {/* Mostrar ID Transacción solo si status es 'success' */}
              {transactionResult.status === 'success' && transactionResult.details?.transactionId && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ID Transacción:</span>
                    {/* Acceso seguro porque verificamos status y existencia */}
                    <span className="font-mono text-sm">{transactionResult.details.transactionId}</span>
                </div>
              )}
              {/* Mostrar Fecha y Hora solo si status es 'success' */}
              {transactionResult.status === 'success' && transactionResult.details?.timestamp && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fecha y Hora:</span>
                     {/* Acceso seguro */}
                    <span className="font-medium text-sm">{new Date(transactionResult.details.timestamp).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}

              {/* Mostrar siempre los datos comunes (estos existen en details sin importar el status) */}
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cuenta Origen:</span><span className="font-medium text-right text-sm">{details.originAccountName || `UID: ${details.originAccount}`}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cuenta Destino:</span><span className="font-medium text-right text-sm">{details.destinationAccountName || `UID: ${details.destinationAccount}`}</span></div>
              <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monto:</span>
                  {/* El estilo puede depender de isSuccess (o transactionResult.status) */}
                  <span className={`font-semibold text-lg text-right ${transactionResult.status === 'success' ? 'text-primary' : 'text-destructive'}`}>
                      Q {details.amount.toFixed(2)}
                  </span>
              </div>
              {details.description && (
                  <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground pt-px">Descripción:</span>
                      <span className="font-medium text-right break-words max-w-[70%] text-sm">{details.description}</span>
                  </div>
              )}
            </CardContent>
          )}

          {/* Footer con botones */}
           <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-6 bg-muted/30 dark:bg-muted/10 p-4 mt-4 border-t dark:border-gray-700">
             {/* --- CORRECCIÓN 4: Condición para botones de descarga --- */}
             {/* Botones de descarga solo si status es 'success' y transactionId existe */}
             {transactionResult.status === 'success' && transactionResult.details?.transactionId ? (
               <div className="flex space-x-2 download-buttons-container">
                 <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('pdf')} disabled={isDownloading === 'pdf'}>
                   {isDownloading === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} PDF
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('png')} disabled={isDownloading === 'png'}>
                   {isDownloading === 'png' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} PNG
                 </Button>
               </div>
             ) : (
               <div className="hidden sm:block"> </div> // Espacio reservado
             )}
              {/* Botón 'Nueva/Intentar' puede usar isSuccess o status */}
              <Button onClick={handleNewTransfer} className="w-full sm:w-auto new-transfer-button">
                  {transactionResult.status === 'success' ? 'Realizar Nueva Transferencia' : 'Volver a Intentar'}
              </Button>
           </CardFooter>
        </Card>
      </div>
    );
  }


  // Fallback final (no debería alcanzarse si la lógica es correcta)
  console.warn("Estado de renderizado inesperado:", { step, transactionResult });
  return ( <div className="container mx-auto py-8 text-center text-muted-foreground">Cargando interfaz...</div> );
}