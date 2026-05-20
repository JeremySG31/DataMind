'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Download, Save, Share2, FileJson, FileText } from 'lucide-react';
import { exportAnalysisToPDF, exportAnalysisAsJSON, exportAnalysisAsCSV } from '@/lib/export-utils';
import { useAuthContext } from '@/app/providers';

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
  const [isPublic, setIsPublic] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const { user } = useAuthContext();

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
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Error al generar el PDF del reporte.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
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
  };

  const handleExportCSV = () => {
    if (Array.isArray(data)) {
      exportAnalysisAsCSV(data, `${analysisName}.csv`);
    } else {
      // Si la estructura del dataset fuese un objeto de columnas: { colA: [...], colB: [...] }
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
  };

  const handleSaveAnalysis = async () => {
    if (!user) {
      alert('Debes estar autenticado para guardar análisis');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          analysisData: {
            data,
            statistics,
            insights,
          },
          datasetName,
          analysisType,
          isPublic,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSavedAnalysisId(result.analysisId);
        alert(`¡Análisis guardado exitosamente!\nID: ${result.analysisId}`);
      } else {
        alert(`Error guardando análisis: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando análisis:', error);
      alert('Error al guardar el análisis en la nube.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareAnalysis = async () => {
    if (!user) {
      alert('Debes estar autenticado para compartir');
      return;
    }

    let currentAnalysisId = savedAnalysisId;

    // Si aún no está guardado, guardamos primero para generar el ID en Firestore
    if (!currentAnalysisId) {
      setIsSaving(true);
      try {
        const response = await fetch('/api/save-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            analysisData: {
              data,
              statistics,
              insights,
            },
            datasetName,
            analysisType,
            isPublic,
          }),
        });

        const result = await response.json();
        if (result.success) {
          currentAnalysisId = result.analysisId;
          setSavedAnalysisId(result.analysisId);
        } else {
          alert(`Error guardando análisis para compartir: ${result.error}`);
          setIsSaving(false);
          return;
        }
      } catch (error) {
        console.error('Error guardando análisis antes de compartir:', error);
        alert('Error al procesar el guardado preliminar.');
        setIsSaving(false);
        return;
      } finally {
        setIsSaving(false);
      }
    }

    if (!currentAnalysisId) return;

    try {
      const response = await fetch('/api/share-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: currentAnalysisId,
          userId: user.uid,
          isPublic,
        }),
      });

      const result = await response.json();
      if (result.success && result.shareLink) {
        navigator.clipboard.writeText(result.shareLink);
        alert(`¡Enlace de compartición copiado al portapapeles!:\n${result.shareLink}`);
      } else {
        alert('No se pudo generar el enlace. Asegúrate de marcar la casilla "Hacer público" primero.');
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      alert('Error al compartir el análisis.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-500" />
            Exportar y Compartir
          </CardTitle>
          <CardDescription>Guarda y comparte tus análisis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre del Análisis</label>
            <Input
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
              placeholder="Nombre del análisis"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Hacer público (compartible)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>

            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              <span className="hidden sm:inline">JSON</span>
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>

            <Button
              onClick={handleSaveAnalysis}
              disabled={isSaving || !user}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          </div>

          {user && (
            <Button
              onClick={handleShareAnalysis}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" />
              Compartir Análisis
            </Button>
          )}

          {!user && (
            <p className="text-sm text-foreground/60 text-center">
              Inicia sesión para guardar y compartir tus análisis
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
