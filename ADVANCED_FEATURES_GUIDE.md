# Guía de Características Avanzadas - DataMind

## Resumen de Nuevas Características

Se han agregado tres pilares de funcionalidad avanzada a DataMind:

### 1. Machine Learning Integrado
### 2. Visualización 3D Interactiva
### 3. Exportación y Gestión de Análisis

---

## 1. Machine Learning Integrado

### Características

**Regresión Lineal y Polinomial**
- Ajusta modelos lineales y polinómicos a tus datos
- Calcula métricas: R², RMSE
- Visualiza predicciones vs valores reales

**K-Means Clustering**
- Agrupa datos automáticamente
- Selecciona número de clusters (2-8)
- Calcula inercia y centroides

**Detección de Anomalías**
- Identifica valores atípicos usando Z-Score
- Umbral configurable (default: 3σ)
- Porcentaje de anomalías detectadas

### Cómo Usar

1. Carga tu archivo CSV
2. Ve a la pestaña "Machine Learning"
3. Selecciona variables y tipo de análisis
4. Haz clic en "Ejecutar"
5. Visualiza resultados y gráficos

### Ejemplos de Uso

**Predecir Ingresos Futuros**
- X: Tiempo (meses)
- Y: Ingresos
- Tipo: Regresión Lineal
- Resultado: Tendencia y predicciones

**Segmentar Clientes**
- Selecciona: Edad, Gastos, Visitas
- K-Means con 4 clusters
- Identifica grupos de clientes similares

**Detectar Fraude**
- Analiza: Monto de transacción
- Detecta transacciones anómalas
- Alertas automáticas

### Stack Técnico

- **ML.js**: Operaciones de álgebra lineal
- **TensorFlow.js**: Soporte para redes neuronales futuras
- **Custom algorithms**: Regresión, K-Means, Z-Score

---

## 2. Visualización 3D Interactiva

### Características

**Scatter Plot 3D**
- Visualiza 3 variables simultáneamente
- Rotación interactiva con mouse
- Zoom y pan
- Hover para ver valores exactos

**Heatmap 3D de Correlaciones**
- Matriz de correlación entre todas las variables
- Visualización en color degradado
- Identifica relaciones fuertes rápidamente

**Surface Plot**
- Visualiza funciones matemáticas en 3D
- Superficies interactivas
- Útil para visualizar tendencias complejas

### Cómo Usar

1. Ve a la pestaña "Visualización 3D"
2. Selecciona tipo de gráfico
3. Para Scatter 3D: Elige 3 variables (X, Y, Z)
4. Interactúa: Rota, zoom, hover
5. Exporta como imagen (png)

### Ejemplos de Uso

**Análisis de Ventas Multi-dimensional**
```
X: Mes
Y: Región
Z: Ingresos
Resultado: Patrones de ventas en 3D
```

**Matriz de Correlaciones**
- Visualiza todas las relaciones
- Identifica variables altamente correlacionadas
- Detecta multicolinealidad

**Tendencias Complejas**
- Surface plot con datos reales
- Identifica patrones no lineales
- Predicciones visuales

### Stack Técnico

- **Plotly.js**: Gráficos 3D interactivos
- **Custom visualization utilities**: Formateo de datos
- **CDN loading**: Carga dinámica de Plotly

---

## 3. Exportación y Gestión de Análisis

### Características

**Exportar a Múltiples Formatos**
- PDF: Reporte completo con gráficos
- JSON: Datos crudos para procesamiento
- CSV: Tabla de datos para Excel

**Guardar en la Nube (Firestore)**
- Guarda análisis completos en Firebase
- Acceso desde cualquier dispositivo
- Historial de análisis

**Compartir Análisis**
- Genera enlaces compartibles
- Controla privacidad (público/privado)
- Compartición con usuarios específicos

**Reportes Profesionales**
- PDF con:
  - Resumen del dataset
  - Estadísticas clave
  - Insights generados por IA
  - Gráficos y visualizaciones

### Cómo Usar

**Exportar PDF**
1. Ve a "Exportar"
2. Ingresa nombre del análisis
3. Haz clic en "PDF"
4. Se descarga reporte completo

**Guardar en la Nube**
1. Inicia sesión (requerido)
2. Ve a "Exportar"
3. Haz clic en "Guardar"
4. Análisis guardado en Firestore

**Compartir**
1. Marca "Hacer público"
2. Haz clic en "Compartir Análisis"
3. Recibe enlace para compartir

### Firestore Schema

```
analyses/
├── {analysisId}
│   ├── userId: string
│   ├── datasetName: string
│   ├── analysisType: string
│   ├── data: object
│   ├── statistics: object
│   ├── insights: array
│   ├── isPublic: boolean
│   ├── sharedWith: array
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### APIs Creadas

**POST /api/save-analysis**
Guardar nuevo análisis o actualizar existente
```json
{
  "userId": "user-id",
  "analysisData": { ... },
  "datasetName": "mi-dataset",
  "analysisType": "comprehensive",
  "isPublic": false
}
```

**GET /api/load-analyses**
Cargar análisis del usuario o específico
```
?userId={userId}  - Cargar todos
?analysisId={id}  - Cargar específico
```

**POST /api/share-analysis**
Configurar compartición
```json
{
  "analysisId": "id",
  "userId": "user-id",
  "isPublic": true,
  "sharedWith": ["user@example.com"]
}
```

---

## Integración en Dashboard

Todas las características están integradas en el dashboard principal:

```
Dashboard Principal
├── Análisis (IA automático)
├── Visualizaciones (gráficos 2D)
├── Tabla (datos completos)
├── Machine Learning ⭐ (nuevo)
├── Visualización 3D ⭐ (nuevo)
├── Exportar ⭐ (nuevo)
└── Chat (conversacional)
```

Cada pestaña es independiente pero comparte el contexto de datos del usuario.

---

## Casos de Uso Reales

### Caso 1: Análisis Inmobiliario
```
Dataset: Precios de casas
Pasos:
1. Carga CSV con: precio, m², ubicación, edad
2. ML → Regresión para predecir precios
3. 3D → Visualiza precio vs m² vs edad
4. Exporta → PDF para presentación
```

### Caso 2: Análisis de Clientes
```
Dataset: Datos de clientes
Pasos:
1. Carga datos: edad, gastos, visitas, región
2. ML → K-Means para segmentar en 4 grupos
3. 3D → Heatmap de correlaciones
4. Guarda en nube para acceso posterior
5. Comparte con equipo
```

### Caso 3: Control de Calidad
```
Dataset: Métricas de producción
Pasos:
1. Carga datos de sensores
2. ML → Detecta anomalías
3. Identifica productos defectuosos
4. Exporta reporte para supervisores
```

---

## Limitaciones y Consideraciones

- **Datos grandes**: ML optimizado para <10k filas
- **Variables 3D**: Máximo 3D por renderización (plotly limitation)
- **Modelo entrenamiento**: Futuro - actualmente soporta inferencia
- **PDF**: Requiere elementos en el DOM
- **Firestore**: Requiere autenticación Firebase

---

## Roadmap Futuro

- [ ] Redes Neuronales entrenables (TensorFlow.js)
- [ ] Exportación a interactive HTML
- [ ] Compartición en tiempo real (websockets)
- [ ] Versionado de análisis
- [ ] Comentarios colaborativos
- [ ] Integración con Google Sheets
- [ ] AutoML (seleccionar mejor modelo automáticamente)

---

## Soporte y Debugging

**Problem**: Plotly no carga en 3D
**Solución**: Revisa conexión a CDN, actualiza caché

**Problem**: ML tarda mucho
**Solución**: Reduce tamaño dataset a <1000 filas

**Problem**: No puedo guardar análisis
**Solución**: Verifica que estés autenticado en Firebase

Para más ayuda, revisar logs en consola del navegador (F12).
