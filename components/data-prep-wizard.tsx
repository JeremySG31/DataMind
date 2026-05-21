'use client';

import { useState, useMemo, useEffect } from 'react';
import { WorkspaceDataset, CleanOptions } from '@/hooks/useDataAnalysis';
import { DataRow } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  Filter,
  Trash2,
  RefreshCw,
  Eye,
  Settings,
  Columns,
  Check,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface DataPrepWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: WorkspaceDataset | null;
  onClean: (id: string, options: CleanOptions) => void;
  previewCleanDataset: (id: string, options: CleanOptions) => DataRow[];
}

export function DataPrepWizard({
  isOpen,
  onOpenChange,
  dataset,
  onClean,
  previewCleanDataset,
}: DataPrepWizardProps) {
  const [options, setOptions] = useState<CleanOptions>({
    removeDuplicates: true,
    nullAction: 'fill_mean_na',
    sortByColumn: null,
    sortOrder: 'asc',
    selectedColumns: [],
    trimStrings: true,
    standardizeText: true,
  });

  const [activePreviewTab, setActivePreviewTab] = useState<'original' | 'cleaned'>('original');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    sortByColumn: string | null;
    sortOrder: 'asc' | 'desc';
    selectedColumns: string[];
    nullAction: 'fill_mean_na' | 'drop_rows' | 'keep';
    explanation: string;
  } | null>(null);

  const handleFetchAISuggestion = async () => {
    if (!dataset) return;
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/prep-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataset.data.slice(0, 50),
          columns: dataset.columns,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAiRecommendation(data);
        // Apply options suggested by AI
        setOptions({
          removeDuplicates: true,
          nullAction: data.nullAction || 'fill_mean_na',
          sortByColumn: data.sortByColumn,
          sortOrder: data.sortOrder || 'asc',
          selectedColumns: data.selectedColumns || dataset.columns,
          trimStrings: true,
          standardizeText: true,
        });
      }
    } catch (error) {
      console.error('Error al obtener sugerencia de IA:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Reset parameters when dataset changes
  useEffect(() => {
    if (dataset) {
      setOptions({
        removeDuplicates: true,
        nullAction: 'fill_mean_na',
        sortByColumn: null,
        sortOrder: 'asc',
        selectedColumns: dataset.columns,
        trimStrings: true,
        standardizeText: true,
      });
      setAiRecommendation(null);
    }
  }, [dataset]);

  // Compute Raw / Original statistics
  const rawStats = useMemo(() => {
    if (!dataset) return { rows: 0, cols: 0, nulls: 0, duplicates: 0, score: 0 };
    const rows = dataset.data.length;
    const cols = dataset.columns.length;
    const cells = rows * cols;
    let nulls = 0;
    dataset.data.forEach((row: any) => {
      dataset.columns.forEach((col) => {
        const val = row[col];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (typeof val === 'number' && isNaN(val))
        ) {
          nulls++;
        }
      });
    });
    const stringifiedRows = dataset.data.map((row) => JSON.stringify(row));
    const duplicates = rows - new Set(stringifiedRows).size;
    const score =
      cells === 0
        ? 0
        : Math.max(
            40,
            Math.round(100 - (nulls / cells) * 100 - (duplicates / rows) * 50)
          );
    return { rows, cols, nulls, duplicates, score };
  }, [dataset]);

  // Generate dynamic preview of cleaned data
  const cleanedData = useMemo(() => {
    if (!dataset) return [];
    return previewCleanDataset(dataset.id, options);
  }, [dataset, options, previewCleanDataset]);

  // Compute Cleaned statistics dynamically
  const cleanedStats = useMemo(() => {
    if (!dataset) return { rows: 0, cols: 0, nulls: 0, duplicates: 0, score: 100 };
    const rows = cleanedData.length;
    const cols =
      options.selectedColumns.length > 0
        ? options.selectedColumns.length
        : dataset.columns.length;
    const cells = rows * cols;
    let nulls = 0;
    const colsToCheck =
      options.selectedColumns.length > 0
        ? options.selectedColumns
        : dataset.columns;

    cleanedData.forEach((row: any) => {
      colsToCheck.forEach((col) => {
        const val = row[col];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          val === 'N/A' ||
          (typeof val === 'number' && isNaN(val))
        ) {
          nulls++;
        }
      });
    });

    const stringifiedRows = cleanedData.map((row) => JSON.stringify(row));
    const duplicates = rows - new Set(stringifiedRows).size;
    const score =
      cells === 0
        ? 0
        : Math.max(
            50,
            Math.round(100 - (nulls / cells) * 100 - (duplicates / rows) * 50)
          );
    return { rows, cols, nulls, duplicates, score };
  }, [dataset, cleanedData, options]);

  if (!dataset) return null;

  const handleToggleColumn = (col: string) => {
    setOptions((prev) => {
      const isSelected = prev.selectedColumns.includes(col);
      const nextCols = isSelected
        ? prev.selectedColumns.filter((c) => c !== col)
        : [...prev.selectedColumns, col];
      return { ...prev, selectedColumns: nextCols };
    });
  };

  const handleSelectAllColumns = (checked: boolean) => {
    setOptions((prev) => ({
      ...prev,
      selectedColumns: checked ? dataset.columns : [],
    }));
  };

  const handleApply = () => {
    onClean(dataset.id, options);
    onOpenChange(false);
  };

  // Limit preview rows shown to 5 for optimal performance
  const originalPreview = dataset.data.slice(0, 5);
  const cleanedPreview = cleanedData.slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6 bg-background/95 border-muted-foreground/20 backdrop-blur-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2 font-display">
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
            Asistente de Preparación e Integridad de Datos
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Elimina el caos de tu archivo. Configura el ordenamiento, limpia duplicados y nulos, y verifica el resultado en tiempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto">
          {/* CONTROL SIDEBAR (left col) */}
          <div className="lg:col-span-5 space-y-4 pr-1">
            {/* AI Assistant Banner */}
            <Card className="p-3 bg-gradient-to-r from-blue-950/20 to-purple-950/20 border-blue-500/20 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 rounded-full bg-blue-500/10 blur-xl opacity-50 pointer-events-none" />
              <div className="flex items-center justify-between font-display">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                  <Sparkles className="h-4 w-4 animate-pulse text-yellow-400" />
                  ASISTENTE DE PREPARACIÓN IA
                </div>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[8px] font-bold tracking-wider uppercase px-1 py-0.5 rounded-md">
                  Gratis
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                ¿No estás seguro de cómo estructurar tus datos? Deja que la Inteligencia Artificial analice tus columnas y proponga el mejor ordenamiento y limpieza.
              </p>
              <Button
                onClick={handleFetchAISuggestion}
                disabled={isSuggesting}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-[11px] h-8 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analizando y configurando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Optimizar con IA
                  </>
                )}
              </Button>

              {aiRecommendation && (
                <div className="mt-1.5 p-2 rounded-md bg-background/50 border border-blue-500/10 text-[9px] text-muted-foreground space-y-1">
                  <p className="font-semibold text-blue-300">💡 IA Sugirió:</p>
                  <p className="italic text-foreground/90">"{aiRecommendation.explanation}"</p>
                </div>
              )}
            </Card>

            {/* Step 1: Column Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-display">
                <Columns className="h-3.5 w-3.5 text-blue-400" />
                1. Seleccionar Columnas a Incluir
              </label>
              <Card className="p-3 bg-background/50 border-muted-foreground/15 space-y-2">
                <div className="flex items-center gap-2 border-b border-muted-foreground/10 pb-2 mb-2">
                  <Checkbox
                    id="select-all-cols"
                    checked={options.selectedColumns.length === dataset.columns.length}
                    onCheckedChange={(checked) => handleSelectAllColumns(!!checked)}
                  />
                  <label htmlFor="select-all-cols" className="text-xs font-semibold text-foreground cursor-pointer">
                    Seleccionar Todas ({dataset.columns.length})
                  </label>
                </div>
                <ScrollArea className="h-32">
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {dataset.columns.map((col) => (
                      <div key={col} className="flex items-center gap-2">
                        <Checkbox
                          id={`col-${col}`}
                          checked={options.selectedColumns.includes(col)}
                          onCheckedChange={() => handleToggleColumn(col)}
                        />
                        <label
                          htmlFor={`col-${col}`}
                          className="text-xs truncate font-medium text-foreground/80 hover:text-foreground cursor-pointer"
                          title={col}
                        >
                          {col}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Step 2: Sorting Column */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-display">
                <ArrowUpDown className="h-3.5 w-3.5 text-blue-400" />
                2. Ordenar Filas (Evitar Caos)
              </label>
              <Card className="p-3 bg-background/50 border-muted-foreground/15 flex gap-2 items-center">
                <div className="flex-1">
                  <Select
                    value={options.sortByColumn || 'no-sort'}
                    onValueChange={(val) =>
                      setOptions((prev) => ({
                        ...prev,
                        sortByColumn: val === 'no-sort' ? null : val,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Sin ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-sort">Sin ordenar</SelectItem>
                      {options.selectedColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {options.sortByColumn && (
                  <Select
                    value={options.sortOrder}
                    onValueChange={(val: 'asc' | 'desc') =>
                      setOptions((prev) => ({ ...prev, sortOrder: val }))
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </Card>
            </div>

            {/* Step 3: Cleaning Operations */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-display">
                <Settings className="h-3.5 w-3.5 text-blue-400" />
                3. Operaciones de Limpieza
              </label>
              <Card className="p-3 bg-background/50 border-muted-foreground/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-foreground">Remover duplicados</label>
                    <p className="text-[10px] text-muted-foreground">Elimina filas idénticas o repetidas</p>
                  </div>
                  <Checkbox
                    checked={options.removeDuplicates}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, removeDuplicates: !!checked }))
                    }
                  />
                </div>

                <div className="space-y-1.5 border-t border-muted-foreground/10 pt-2.5">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-foreground">Acción para valores vacíos</label>
                    <p className="text-[10px] text-muted-foreground">Tratamiento de celdas nulas o incompletas</p>
                  </div>
                  <Select
                    value={options.nullAction}
                    onValueChange={(val: 'fill_mean_na' | 'drop_rows' | 'keep') =>
                      setOptions((prev) => ({ ...prev, nullAction: val }))
                    }
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fill_mean_na">Completar con media / 'N/A'</SelectItem>
                      <SelectItem value="drop_rows">Eliminar fila que tenga algún nulo</SelectItem>
                      <SelectItem value="keep">Mantener celdas vacías</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between border-t border-muted-foreground/10 pt-2.5">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-foreground">Trim de textos</label>
                    <p className="text-[10px] text-muted-foreground">Remueve espacios iniciales/finales</p>
                  </div>
                  <Checkbox
                    checked={options.trimStrings}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, trimStrings: !!checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between border-t border-muted-foreground/10 pt-2.5">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-foreground">Normalizar espaciado</label>
                    <p className="text-[10px] text-muted-foreground">Convierte espacios múltiples a individuales</p>
                  </div>
                  <Checkbox
                    checked={options.standardizeText}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, standardizeText: !!checked }))
                    }
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* DYNAMIC PREVIEW & METRICS (right col) */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
            {/* Real-time Quality Stats comparison */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
                Métricas de Calidad Estimadas
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Original stats card */}
                <Card className="p-3 bg-red-950/10 border-red-500/20 space-y-1">
                  <Badge variant="outline" className="border-red-500/25 bg-red-500/5 text-red-400 text-[9px] uppercase font-bold tracking-wider rounded-md">
                    Original (Sucio)
                  </Badge>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xl font-bold text-foreground">{rawStats.rows}</span>
                    <span className="text-[10px] text-muted-foreground">filas</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5 mt-2">
                    <p>⚠️ Celdas vacías: <span className="text-red-400 font-semibold">{rawStats.nulls}</span></p>
                    <p>⚠️ Duplicados: <span className="text-red-400 font-semibold">{rawStats.duplicates}</span></p>
                    <p className="pt-1 border-t border-muted-foreground/10">Score de Calidad: <span className="text-red-400 font-bold">{rawStats.score}%</span></p>
                  </div>
                </Card>

                {/* Cleaned stats card */}
                <Card className="p-3 bg-emerald-950/10 border-emerald-500/20 space-y-1">
                  <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-[9px] uppercase font-bold tracking-wider rounded-md">
                    Optimizado (Preparado)
                  </Badge>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xl font-bold text-foreground">{cleanedStats.rows}</span>
                    <span className="text-[10px] text-muted-foreground">filas</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5 mt-2">
                    <p>✨ Celdas vacías: <span className="text-emerald-400 font-semibold">{cleanedStats.nulls}</span></p>
                    <p>✨ Duplicados: <span className="text-emerald-400 font-semibold">{cleanedStats.duplicates}</span></p>
                    <p className="pt-1 border-t border-muted-foreground/10">Score de Calidad: <span className="text-emerald-400 font-bold">{cleanedStats.score}%</span></p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Table Comparison View */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <Tabs
                value={activePreviewTab}
                onValueChange={(val: any) => setActivePreviewTab(val)}
                className="w-full flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-muted-foreground/15 pb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                    Vista Previa de Filas (Top 5)
                  </label>
                  <TabsList className="bg-muted/50 border h-7 p-0.5">
                    <TabsTrigger value="original" className="text-[10px] py-1 h-6 font-semibold">
                      Original
                    </TabsTrigger>
                    <TabsTrigger value="cleaned" className="text-[10px] py-1 h-6 font-semibold">
                      Limpio & Ordenado
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto mt-2 max-h-[200px] border border-muted-foreground/10 rounded-md bg-background/30">
                  <TabsContent value="original" className="m-0 h-full">
                    {originalPreview.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">Sin registros</div>
                    ) : (
                      <PreviewTable data={originalPreview} columns={dataset.columns} />
                    )}
                  </TabsContent>
                  <TabsContent value="cleaned" className="m-0 h-full">
                    {cleanedPreview.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        Ninguna fila coincide con los filtros aplicados
                      </div>
                    ) : (
                      <PreviewTable
                        data={cleanedPreview}
                        columns={
                          options.selectedColumns.length > 0
                            ? options.selectedColumns
                            : dataset.columns
                        }
                      />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 border-t border-muted-foreground/10 pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer border border-muted-foreground/10 hover:bg-muted/50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={cleanedData.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aplicar Limpieza y Ordenar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Subcomponente de tabla de vista previa compacta
function PreviewTable({ data, columns }: { data: DataRow[]; columns: string[] }) {
  return (
    <table className="w-full text-left border-collapse text-[10px] font-medium">
      <thead>
        <tr className="bg-muted/50 border-b border-muted-foreground/10">
          {columns.map((col) => (
            <th
              key={col}
              className="p-2 border-r border-muted-foreground/10 font-bold text-muted-foreground truncate max-w-[120px]"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rIdx) => (
          <tr key={rIdx} className="border-b border-muted-foreground/5 hover:bg-muted/20">
            {columns.map((col) => {
              const val = row[col];
              const isNull =
                val === undefined ||
                val === null ||
                val === '' ||
                val === 'N/A' ||
                (typeof val === 'number' && isNaN(val));
              return (
                <td
                  key={col}
                  className={`p-2 border-r border-muted-foreground/5 truncate max-w-[120px] ${
                    isNull ? 'text-red-400 bg-red-500/5 font-semibold italic' : 'text-foreground'
                  }`}
                >
                  {isNull ? 'N/A' : String(val)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
