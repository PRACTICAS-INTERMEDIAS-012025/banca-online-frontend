import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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


export default function InternalTransferSimpleForm({ loaderData }: { loaderData: LoaderData | null }) {
  const navigate = useNavigate();
  const receiptCardRef = useRef<HTMLDivElement>(null);

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
          errors.amount = `Saldo insuficiente (Q ${selectedAccountOrigin.saldo})`;
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoToReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors(prev => ({ amount: prev.amount, description: prev.description, originAccount: null, destinationAccount: null, api: prev.api }));
    if (validateForm()) {
      setStep('review');
    }
  };


  const handleConfirmTransfer = async (): Promise<void> => {
    setShowConfirmDialog(false);
    if (!selectedAccountOrigin || !selectedAccountDestination) return;
    setIsLoading(true); setTransactionResult(null); setFormErrors({});
    const amountToTransfer = parseFloat(formData.amount);
    const originUID = selectedAccountOrigin.UID; const destinationUID = selectedAccountDestination.UID;
    if (originUID === undefined || destinationUID === undefined || isNaN(amountToTransfer)) { setIsLoading(false); return; }
    const originIdNumber = Number(originUID); const destinationIdNumber = Number(destinationUID);
    if (isNaN(originIdNumber) || isNaN(destinationIdNumber)) { setIsLoading(false); return; }

    const apiUrl = "http://localhost:3003"; const endpoint = "/transaccion/";
    const requestBody = { idCuentaOrinal: originIdNumber, idCuentaDestino: destinationIdNumber, monto: amountToTransfer };
    const originAccountName = `${selectedAccountOrigin.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountOrigin.numero}`;
    const destinationAccountName = `${selectedAccountDestination.tipoCuenta === 1 ? "Monetaria" : "Ahorros"} - ${selectedAccountDestination.numero}`;

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      let responseData: any = {}; const responseText = await response.text();
      try { if(responseText) responseData = JSON.parse(responseText); } catch(e){ if (!response.ok) responseData = { message: responseText }; }

      if (response.ok) {
        const successDetails: TransactionSuccessDetails = {
          originAccount: String(originUID), destinationAccount: String(destinationUID),
          amount: amountToTransfer, description: formData.description || undefined,
          originAccountName, destinationAccountName,
          transactionId: responseData?.transactionId || `GEN-${Date.now()}`,
          timestamp: responseData?.timestamp || new Date().toISOString(),
          message: responseData?.message === "Transaccion realizada exitosamente" ? responseData.message : "Transacción completada.",
        };
        setTransactionResult({ status: 'success', details: successDetails });
        setStep('result');
       
      } else { /* ... manejo de error ... */ }
    } catch (error) { /* ... manejo de error ... */ }
    finally { setIsLoading(false); }
  };


  const handleEdit = (): void => { setStep('form'); };
  const handleNewTransfer = (): void => { 
    setStep('form');
    setFormData({ amount: '', description: '' });
    setSelectedAccountOrigin(null);
    setSelectedAccountDestination(null);
    setTransactionResult(null);
  };

  const handleDownloadReceipt = async (format: 'pdf' | 'png') => {
    console.log(`--- [handleDownloadReceipt] START - Format: ${format} ---`);
    if (step !== 'result' || transactionResult?.status !== 'success' || !transactionResult.details?.timestamp || !transactionResult.details.transactionId) {
      console.error(">>> CONDICIÓN FALLÓ:", { step, status: transactionResult?.status, hasDetails: !!transactionResult?.details }); alert("Datos inválidos."); return;
    }
    const details = transactionResult.details;
    console.log(">>> Detalles:", details);

    const timestampDate = new Date(details.timestamp); 
    if (isNaN(timestampDate.getTime())) {
      console.error("Timestamp inválido incluso después de la corrección:", details.timestamp);
      alert("Error interno con la fecha.");
      setIsDownloading(false); 
      return;
    }

    const dateForFilename = timestampDate.toISOString().split('T')[0];
    const filenameBase = `Comprobante_Transferencia_${dateForFilename}`;
    const displayDate = timestampDate.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const displayTime = timestampDate.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

    setIsDownloading(format);
    try {
      console.log(`>>> Generando ${format.toUpperCase()}`);
      if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        console.log("   - jsPDF instancia creada");
        const margin = 15; let currentY = margin + 10; const lineHeight = 7;
        doc.setFontSize(18); doc.setFont('bold'); doc.text("Comprobante", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' }); currentY += lineHeight * 2.5;
        doc.setFontSize(11); doc.setFont('normal'); doc.text(`Fecha: ${displayDate}`, margin, currentY); doc.text(`Hora: ${displayTime}`, doc.internal.pageSize.getWidth() - margin, currentY, { align: 'right' }); currentY += lineHeight;
        if(details.transactionId){ doc.text(`ID:`, margin, currentY); doc.setFont('bold'); doc.text(details.transactionId, margin + 35, currentY); doc.setFont('normal'); currentY += lineHeight * 1.5; } else { currentY += lineHeight; }
        const drawDetailRow = (label: string, value: string | undefined) => { if (value) { doc.setFont('bold'); doc.text(label, margin, currentY); doc.setFont('normal'); doc.text(value, margin + 45, currentY); currentY += lineHeight; } };
        drawDetailRow("Origen:", details.originAccountName || `UID: ${details.originAccount}`);
        drawDetailRow("Destino:", details.destinationAccountName || `UID: ${details.destinationAccount}`);
        drawDetailRow("Monto:", `Q ${details.amount.toFixed(2)}`);
        if (details.description) { currentY += lineHeight / 2; doc.setFont('bold'); doc.text("Descripción:", margin, currentY); currentY += lineHeight; doc.setFont('normal'); const descLines = doc.splitTextToSize(details.description, doc.internal.pageSize.getWidth() - margin * 2); doc.text(descLines, margin, currentY); currentY += lineHeight * descLines.length; }
        currentY = doc.internal.pageSize.getHeight() - margin; doc.setFontSize(9); doc.setTextColor(150); doc.text("Generado por BanCuchus.", doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        console.log("   - Llamando doc.save()");
        doc.save(`${filenameBase}.pdf`); console.log("   - PDF guardado.");
      } else  if (format === 'png' && receiptCardRef.current) {
        // 1. Clonar el elemento y su árbol completo
        const elementToCapture = receiptCardRef.current.cloneNode(true) as HTMLElement;
        
        // 2. Posicionar el clon fuera de la pantalla
        elementToCapture.style.position = 'fixed';
        elementToCapture.style.left = '-9999px';
        elementToCapture.style.top = '0';
        document.body.appendChild(elementToCapture);
  
        // 3. Función para limpiar estilos OKLCH
        const cleanOklchStyles = (element: HTMLElement) => {
          // Obtener estilos computados
          const style = window.getComputedStyle(element);
          
          // Reemplazar background-color
          if (style.backgroundColor.includes('oklch')) {
            element.style.backgroundColor = '#ffffff'; // Fondo blanco
          }
          
          // Reemplazar color de texto
          if (style.color.includes('oklch')) {
            element.style.color = '#000000'; // Texto negro
          }
          
          // Reemplazar border-color si es necesario
          if (style.borderColor.includes('oklch')) {
            element.style.borderColor = '#e5e7eb'; // Gris neutral
          }
  
          // Procesar todos los hijos recursivamente
          Array.from(element.children).forEach(child => {
            cleanOklchStyles(child as HTMLElement);
          });
        };
  
        // 4. Limpiar estilos en el clon
        cleanOklchStyles(elementToCapture);
  
        // 5. Esperar a que se apliquen los cambios
        await new Promise(resolve => setTimeout(resolve, 100));
  
        // 6. Configuración para html2canvas
        const options = {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: true,
          ignoreElements: (el: Element) => {
            return (el as HTMLElement).classList.contains('new-transfer-button') || (el as HTMLElement).closest('.download-buttons-container') !== null;
          }
        };
  
        // 7. Generar el canvas
        const canvas = await html2canvas(elementToCapture, options);
        const imgData = canvas.toDataURL('image/png');
  
        // 8. Crear enlace de descarga
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `Comprobante_Transferencia_${new Date(transactionResult.details.timestamp).toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        // 9. Limpiar el clon
        document.body.removeChild(elementToCapture);
      }
    } catch (error) {
      console.error('Error al generar PNG:', error);
      alert('No se pudo generar la imagen. Intente nuevamente.');
    } finally {
      setIsDownloading(false);
    }
  };


  if (!loaderData) {
    return ( <div className="container mx-auto py-8 flex justify-center items-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> );
  }
  
  if (loaderData.error && accounts.length === 0) {
    return ( <div className="container mx-auto py-8 text-center"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{loaderData.error}</AlertDescription></Alert><Button variant="link" onClick={() => navigate('/dashboard')} className="mt-4">Volver</Button></div> );
  }

  // 1. Formulario
  if (step === 'form') {
    const userIdAsNumber = Number(loaderData?.userId ?? 0); 

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
                    onAccountSelect={(account: any) => { setSelectedAccountOrigin(account); if(formErrors.originAccount) setFormErrors(prev => ({...prev, originAccount: null})); }}
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
                    onAccountSelect={(account: any) => { setSelectedAccountDestination(account); if(formErrors.destinationAccount) setFormErrors(prev => ({...prev, destinationAccount: null})); }}
                    placeholder="Seleccione cuenta destino"
                 />
                 {formErrors.destinationAccount && <p id="destinationAccount-error" className="text-sm text-destructive pt-1">{formErrors.destinationAccount}</p>}
               </div>
              {/* Monto */}
              <div className="space-y-2"> <Label htmlFor="amount">Monto (*)</Label> <Input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={formData.amount} onChange={handleChange} aria-invalid={!!formErrors.amount} aria-describedby="amount-error"/> {formErrors.amount && <p id="amount-error" className="text-sm text-destructive pt-1">{formErrors.amount}</p>} </div>
              {/* Descripción */}
              <div className="space-y-2"> <Label htmlFor="description">Descripción (Opcional)</Label> <Textarea id="description" name="description" placeholder="Ej: Ahorro mensual..." value={formData.description} onChange={handleChange} aria-describedby="description-error"/> {formErrors.description && <p id="description-error" className="text-sm text-destructive pt-1">{formErrors.description}</p>} </div>
              {/* Botón Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Revisando...</> : 'Revisar Transferencia'}</Button>
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
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Monto:</span><span className="font-medium text-lg text-primary">Q{amountToShow.toFixed(2)}</span></div>
            {formData.description && (<div className="flex justify-between items-start"><span className="text-muted-foreground pt-px">Descripción:</span><span className="font-medium text-right break-words max-w-[70%]">{formData.description}</span></div>)}
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleEdit} disabled={isLoading}>Editar</Button>
            <Button onClick={() => setShowConfirmDialog(true)} disabled={isLoading}>{isLoading ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando... </>) : ('Confirmar Transferencia')}</Button>
          </CardFooter>
        </Card>
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Transferirás Q{amountToShow.toFixed(2)} desde "{originAccountName}" a "{destinationAccountName}". Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmTransfer} disabled={isLoading}>{isLoading ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando... </>) : ('Confirmar')}</AlertDialogAction></AlertDialogFooter>
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
        {/* Tarjeta con ref */}
        <Card ref={receiptCardRef} className="w-full max-w-2xl mx-auto">
          <CardHeader>
            {isSuccess ? (<Alert variant="default" className="bg-green-50 border-green-200"><CheckCircle className="h-5 w-5 text-green-600" /><AlertTitle className="text-green-800">¡Transferencia Exitosa!</AlertTitle><AlertDescription className="text-green-700">{transactionResult.details?.message || "Tu transferencia se ha completado correctamente."}</AlertDescription></Alert>)
            : (<Alert variant="destructive"><AlertCircle className="h-5 w-5" /><AlertTitle>Error en la Transferencia</AlertTitle><AlertDescription>{transactionResult.message || "Ocurrió un error inesperado."}</AlertDescription></Alert>)}
          </CardHeader>
          {/* Detalles */}
          {transactionResult.details && (
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">{isSuccess ? "Detalles de la Transacción" : "Detalles del Intento"}</h3>
              {/* Asegurar que details existe antes de acceder */}
              {isSuccess && transactionResult.details.transactionId && (<div className="flex justify-between"><span className="text-muted-foreground">ID Transacción:</span><span className="font-mono text-sm">{transactionResult.details.transactionId}</span></div>)}
              {isSuccess && transactionResult.details.timestamp && (<div className="flex justify-between"><span className="text-muted-foreground">Fecha y Hora:</span><span className="font-medium">{new Date(transactionResult.details.timestamp).toLocaleString('es-GT')}</span></div>)} {/* Formatear timestamp */}
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Cuenta Origen:</span><span className="font-medium text-right">{transactionResult.details.originAccountName || `UID: ${transactionResult.details.originAccount}`}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Cuenta Destino:</span><span className="font-medium text-right">{transactionResult.details.destinationAccountName || `UID: ${transactionResult.details.destinationAccount}`}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Monto:</span><span className={`font-medium text-lg text-right ${isSuccess ? 'text-primary' : 'text-destructive'}`}>Q{transactionResult.details.amount.toFixed(2)}</span></div>
              {transactionResult.details.description && (<div className="flex justify-between items-start"><span className="text-muted-foreground pt-px">Descripción:</span><span className="font-medium text-right break-words max-w-[70%]">{transactionResult.details.description}</span></div>)}
            </CardContent>
          )}
          {/* Footer con botones */}
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
            {isSuccess ? (
              <div className="flex space-x-2 download-buttons-container">
                <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('pdf')} disabled={isDownloading === 'pdf'}>
                  {isDownloading === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt('png')} disabled={isDownloading === 'png'}>
                  {isDownloading === 'png' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} PNG
                </Button>
              </div>
            ) : ( <div></div> )}
            <Button onClick={handleNewTransfer} className="w-full sm:w-auto new-transfer-button">{isSuccess ? 'Realizar Nueva Transferencia' : 'Volver a Intentar'}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback final
  return ( <div className="container mx-auto py-8 flex justify-center items-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> );
}