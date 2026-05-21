'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Download, Save, Share2, FileJson, FileText, Copy } from 'lucide-react';
import { exportAnalysisToPDF, exportAnalysisAsJSON, exportAnalysisAsCSV } from '@/lib/export-utils';
import { useAuthContext } from '@/app/providers';
import { useToast } from '@/components/ui/use-toast';

interface ExportAnalysisProps {
  data: Record<string, any>;
  datasetName: string;
  analysisType: string;
  statistics: Record<string, any>;
  insights: string[];
}

export function ExportAnalysis({
  data,
  datasetName,
  analysisType,
  statistics,
  insights,
}: ExportAnalysisProps) {
  const [analysisName, setAnalysisName] = useState(`${datasetName}-${new Date().toISOString().slice(0, 10)}`);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();

  const handleExportPDF = async () => {
    setIsSaving(true);
    try {
      const rowCount = Array.isArray(data) ? data.length : 0;
      const columnsList = Array.isArray(data) && data[0] ? Object.keys(data[0]) : [];

      const reportData = {
        title: analysisName,
        description: 'Reporte completo de análisis de datos e insights generado por DataMind.',
        generatedAt: new Date(),
        datasetName,
        summary: {
          rowCount,
          columnCount: columnsList.length,
          columns: columnsList,
        },
        statistics,
        insights,
        visualizations: [],
      };

      await exportAnalysisToPDF(reportData, `${analysisName}.pdf`);
      toast({
        title: 'Exportación Exitosa',
        description: 'El reporte PDF se ha generado y descargado correctamente.',
      });
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      toast({
        title: 'Error de Exportación',
        description: 'No se pudo generar el PDF del reporte.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const analysisData = {
        metadata: {
          name: analysisName,
          datasetName,
          analysisType,
          createdAt: new Date().toISOString(),
          creator: user?.email || 'anonymous',
        },
        data,
        statistics,
        insights,
      };

      exportAnalysisAsJSON(analysisData, `${analysisName}.json`);
      toast({
        title: 'Exportación Exitosa',
        description: 'El archivo JSON se ha descargado correctamente.',
      });
    } catch (err) {
      console.error('Error al exportar JSON:', err);
      toast({
        title: 'Error de Exportación',
        description: 'No se pudo generar el archivo JSON.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    try {
      if (Array.isArray(data)) {
        exportAnalysisAsCSV(data, `${analysisName}.csv`);
      } else {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const firstCol = data[keys[0]];
          if (Array.isArray(firstCol)) {
            const rows = firstCol.map((_, i) =>
              Object.fromEntries(keys.map(key => [key, data[key][i]]))
            );
            exportAnalysisAsCSV(rows, `${analysisName}.csv`);
          }
        }
      }
      toast({
        title: 'Exportación Exitosa',
        description: 'El archivo CSV se ha descargado correctamente.',
      });
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      toast({
        title: 'Error de Exportación',
        description: 'No se pudo generar el archivo CSV.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAnalysis = async () => {
    if (!user || user.uid === 'guest-user-id') {
      toast({
        title: 'Acceso Denegado',
        description: 'Debes iniciar sesión con una cuenta para guardar análisis en la nube.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let token = 'guest-token';
      if (typeof user.getIdToken === 'function') {
        token = await user.getIdToken();
      }

      const response = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.uid,
          analysisData: {
            data,
            statistics,
            insights,
          },
          datasetName,
          analysisType,
          isPublic: false, // Guardado privado en tu cuenta
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSavedAnalysisId(result.analysisId);
        toast({
          title: 'Análisis Guardado',
          description: 'El análisis ha sido guardado exitosamente de forma privada en tu cuenta.',
        });
      } else {
        toast({
          title: 'Error al Guardar',
          description: `No se pudo guardar el análisis: ${result.error}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error guardando análisis:', error);
      toast({
        title: 'Error de Red',
        description: 'Error al guardar el análisis en la nube.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyReport = () => {
    try {
      const rowCount = Array.isArray(data) ? data.length : 0;
      const columnsList = Array.isArray(data) && data[0] ? Object.keys(data[0]) : [];

      let markdownReport = `# Reporte de Análisis: ${analysisName}\n`;
      markdownReport += `**Dataset:** ${datasetName}\n`;
      markdownReport += `**Fecha:** ${new Date().toLocaleDateString()}\n`;
      markdownReport += `**Total de Registros:** ${rowCount}\n`;
      markdownReport += `**Total de Columnas:** ${columnsList.length}\n\n`;

      if (statistics && Object.keys(statistics).length > 0) {
        markdownReport += `## Resumen Estadístico\n`;
        Object.entries(statistics).forEach(([col, stats]: [string, any]) => {
          markdownReport += `### Columna: ${col}\n`;
          if (stats.mean !== undefined) markdownReport += `- **Promedio:** ${typeof stats.mean === 'number' ? stats.mean.toFixed(2) : stats.mean}\n`;
          if (stats.median !== undefined) markdownReport += `- **Mediana:** ${typeof stats.median === 'number' ? stats.median.toFixed(2) : stats.median}\n`;
          if (stats.min !== undefined) markdownReport += `- **Mínimo:** ${stats.min}\n`;
          if (stats.max !== undefined) markdownReport += `- **Máximo:** ${stats.max}\n`;
          if (stats.uniqueCount !== undefined) markdownReport += `- **Valores Únicos:** ${stats.uniqueCount}\n`;
          if (stats.mostFrequent !== undefined) markdownReport += `- **Más Frecuente:** ${stats.mostFrequent}\n`;
          markdownReport += `\n`;
        });
      }

      if (insights && insights.length > 0) {
        markdownReport += `## Descubrimientos e Insights Clave\n`;
        insights.forEach((insight, index) => {
          markdownReport += `${index + 1}. ${insight}\n`;
        });
      }

      markdownReport += `\n---\n*Generado automáticamente por DataMind.*`;

      navigator.clipboard.writeText(markdownReport);
      toast({
        title: '¡Reporte Copiado!',
        description: 'El reporte en formato Markdown se ha copiado al portapapeles. Listo para pegar en Slack, Teams o correo.',
      });
    } catch (err) {
      console.error('Error al copiar el reporte:', err);
      toast({
        title: 'Error de Copiado',
        description: 'No se pudo copiar el reporte al portapapeles.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-background/50 border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Download className="h-5 w-5 text-blue-500" />
            Exportar y Guardar
          </CardTitle>
          <CardDescription>Genera archivos locales o guarda tu análisis de forma privada en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-semibold mb-2 block text-muted-foreground">Nombre del Análisis</label>
            <Input
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
              placeholder="Nombre del análisis"
              className="bg-background/40 border-muted-foreground/20 focus-visible:ring-blue-500/30"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Exportar localmente</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="gap-2 border-muted-foreground/20 hover:bg-muted/50"
              >
                <FileText className="h-4 w-4 text-rose-500" />
                <span>PDF</span>
              </Button>

              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="gap-2 border-muted-foreground/20 hover:bg-muted/50"
              >
                <FileJson className="h-4 w-4 text-amber-500" />
                <span>JSON</span>
              </Button>

              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="gap-2 border-muted-foreground/20 hover:bg-muted/50"
              >
                <Download className="h-4 w-4 text-emerald-500" />
                <span>CSV</span>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-muted-foreground/10 space-y-3">
            {user && user.uid !== 'guest-user-id' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleSaveAnalysis}
                  disabled={isSaving}
                  variant="outline"
                  className="gap-2 border-muted-foreground/20 hover:bg-muted/50 cursor-pointer"
                >
                  <Save className="h-4 w-4 text-blue-500" />
                  <span>Guardar Análisis</span>
                </Button>

                <Button
                  onClick={handleCopyReport}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar Reporte IA</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleCopyReport}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar Reporte IA</span>
                </Button>
                <p className="text-xs text-foreground/40 text-center">
                  Inicia sesión si deseas guardar tus análisis de forma privada en la nube.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

