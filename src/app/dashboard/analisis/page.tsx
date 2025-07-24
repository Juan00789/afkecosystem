'use client';
import { useState }from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bot, FileUp, Sparkles, Wand2, AlertTriangle, ThumbsUp, ShieldCheck } from 'lucide-react';
import { analyzeFileContent, type FileAnalysisOutput } from '@/ai/flows/file-analysis-flow';
import { Skeleton } from '@/components/ui/skeleton';

const analysisSchema = z.object({
  file: z.any().refine((files) => files?.length === 1, 'File is required.'),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

function ResultDisplay({ result }: { result: FileAnalysisOutput }) {
  return (
      <Card className="mt-6 bg-secondary/10">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Bot className="h-6 w-6" />
                  Auditoría de Oniara
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Resumen Ejecutivo</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
              </div>
              {result.strengths.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-green-600"><ThumbsUp className="h-5 w-5" />Puntos Fuertes</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {result.strengths.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
              )}
              {result.risks.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Riesgos Identificados</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {result.risks.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
              )}
              {result.recommendations.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" />Recomendaciones</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                </div>
              )}
          </CardContent>
      </Card>
  );
}


export default function AnalisisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisOutput | null>(null);
  const [fileName, setFileName] = useState('');

  const { control, handleSubmit, register, formState: { errors } } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
  });

  const onSubmit = async (data: AnalysisFormData) => {
    if (!user) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const file = data.file[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const fileDataUrl = e.target?.result as string;
        try {
            const result = await analyzeFileContent({
                fileName: file.name,
                fileContent: fileDataUrl,
            });
            setAnalysisResult(result);
            toast({ title: 'Auditoría Completa', description: 'Tu archivo ha sido analizado.' });
        } catch (error) {
            console.error('Error during file analysis:', error);
            toast({ title: 'Error', description: 'No se pudo analizar el archivo.', variant: 'destructive' });
        } finally {
            setIsAnalyzing(false);
        }
    };
    reader.onerror = () => {
        toast({ title: 'Error', description: 'Failed to read file.', variant: 'destructive' });
        setIsAnalyzing(false);
    }
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoría de Documentos con Oniara</h1>
        <p className="text-muted-foreground">Sube cualquier archivo y obtén una auditoría experta para tomar mejores decisiones.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sube tu Documento para Auditar</CardTitle>
          <CardDescription>Formatos soportados: PDF, TXT, CSV, DOCX. Tamaño máximo: 5MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="file-upload">Archivo</Label>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                            </p>
                            {fileName && <p className="text-xs text-primary">{fileName}</p>}
                        </div>
                        <input id="file-upload" type="file" className="hidden" {...register('file')} onChange={e => setFileName(e.target.files?.[0]?.name || '')}/>
                    </label>
                </div>
                {errors.file && <p className="text-sm text-destructive">{errors.file.message?.toString()}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isAnalyzing}>
              {isAnalyzing ? (
                <> <Sparkles className="mr-2 h-4 w-4 animate-spin" /> Auditando... </>
              ) : (
                <> <Wand2 className="mr-2 h-4 w-4" /> Auditar Archivo </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isAnalyzing && (
        <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      )}

      {analysisResult && <ResultDisplay result={analysisResult}/>}

    </div>
  );
}
