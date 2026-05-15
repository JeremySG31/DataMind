'use client';

import { useState, useMemo } from 'react';
import { DataRow } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface DataTableProps {
  data: DataRow[];
  columns: string[];
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, columns }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 10;

  // Filtrar datos
  const filteredData = useMemo(() => {
    return data.filter(row =>
      columns.some(col =>
        String(row[col]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, columns, searchTerm]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginar datos
  const paginatedData = useMemo(() => {
    const start = pageIndex * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, pageIndex]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
    setPageIndex(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en los datos..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPageIndex(0);
          }}
          className="pl-10 bg-muted border-muted-foreground/20"
        />
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden border-muted-foreground/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-muted-foreground/20">
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{col}</span>
                      {sortColumn === col && (
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 180 }}
                          transition={{ duration: 0.2 }}
                        >
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-blue-400" />
                          )}
                        </motion.div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron datos
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <motion.tr
                    key={rowIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: rowIdx * 0.02 }}
                    className="border-b border-muted-foreground/10 hover:bg-muted/30 transition-colors"
                  >
                    {columns.map(col => (
                      <td
                        key={`${rowIdx}-${col}`}
                        className="px-4 py-3 text-foreground/90 max-w-xs truncate"
                      >
                        {String(row[col])}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-muted-foreground/20 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Mostrando {pageIndex * itemsPerPage + 1} a{' '}
              {Math.min((pageIndex + 1) * itemsPerPage, sortedData.length)} de{' '}
              {sortedData.length} filas
            </p>
            <div className="flex gap-1">
              <Button
                onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                disabled={pageIndex === 0}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <span className="px-2 py-1 text-sm flex items-center">
                {pageIndex + 1} / {totalPages}
              </span>
              <Button
                onClick={() => setPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={pageIndex === totalPages - 1}
                variant="outline"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
