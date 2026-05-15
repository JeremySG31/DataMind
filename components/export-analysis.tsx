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
  const { user } = useAuthContext();

  const handleExportPDF = async () => {
    // Aquí iría la lógica para capturar gráficos y exportar a PDF
    alert('Exportación a PDF: Funcionalidad en desarrollo');
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
    const csvData = Array.isArray(data) ? data : Object.values(data)[0];
    if (Array.isArray(csvData)) {
      const rows = csvData.map((_, i) => 
        Object.fromEntries(
          Object.entries(data).map(([key, values]: any) => [key, values[i]])
        )
      );
      exportAnalysisAsCSV(rows, `${analysisName}.csv`);
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
        alert(`Análisis guardado: ${result.analysisId}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando análisis:', error);
      alert('Error guardando análisis');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareAnalysis = async () => {
    if (!user) {
      alert('Debes estar autenticado para compartir');
      return;
    }

    try {
      const response = await fetch('/api/share-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: 'analysis-id', // Esto vendría del análisis guardado
          userId: user.uid,
          isPublic,
        }),
      });

      const result = await response.json();
      if (result.success && result.shareLink) {
        alert(`Enlace de compartición: ${result.shareLink}`);
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      alert('Error compartiendo análisis');
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
