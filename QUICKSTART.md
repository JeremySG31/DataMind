# 🚀 Inicio Rápido - DataMind

Aquí te mostramos cómo empezar en 5 minutos.

## Paso 1: Configuración (1 min)

### Opción A: Si tienes Node.js instalado
```bash
cd datamind
pnpm install
pnpm dev
```

### Opción B: Si no tienes pnpm
```bash
cd datamind
npm install -g pnpm  # instala pnpm
pnpm install
pnpm dev
```

## Paso 2: Configurar OpenRouter (2 min)

### Crear API Key Gratuita

1. **Abre** https://openrouter.io en tu navegador
2. **Haz clic** en "Sign Up" (arriba a la derecha)
3. **Completa** el formulario (email y contraseña)
4. **Confirma** tu email

### Obtener tu API Key

1. **Ve a** https://openrouter.io/keys
2. **Copia** tu API key (inicia con `sk-or-`)
3. **No necesitas tarjeta de crédito**

### Configurar en DataMind

1. En la carpeta del proyecto, crea un archivo llamado `.env.local`
2. Añade esta línea:
   ```
   OPENROUTER_API_KEY=tu_api_key_aqui
   ```
   (Reemplaza `tu_api_key_aqui` con tu clave real)

3. **Guarda el archivo**

4. Si el servidor estaba corriendo, **reinicialo**:
   - Presiona `Ctrl+C`
   - Ejecuta `pnpm dev` nuevamente

## Paso 3: Prueba la Aplicación (2 min)

1. **Abre** http://localhost:3000 en tu navegador
2. Deberías ver la página de inicio bonita

### Cargar datos de ejemplo

**Opción A: Datos de ejemplo incluidos**
- Descarga este archivo: [example-data.csv](/public/example-data.csv)
- Arrastra hacia la zona de upload en DataMind
- ¡Automáticamente verás análisis, gráficos y más!

**Opción B: Usa tus propios datos**
- Prepara un archivo CSV con tus datos
- Arrastra y suelta en DataMind
- ¡Listo!

## Ejemplos de CSVs para Probar

### CSV de Ventas Mensuales
```csv
Mes,Ventas,Clientes,Ingresos,Costo
Enero,1250,145,62500,25000
Febrero,1380,156,69000,27600
Marzo,1520,172,76000,30400
Abril,1650,185,82500,33000
Mayo,1820,204,91000,36400
```

### CSV de Temperatura
```csv
Fecha,Temp_Max,Temp_Min,Humedad,Lluvia
2024-01-01,25,15,65,0
2024-01-02,26,16,68,2
2024-01-03,24,14,70,5
2024-01-04,27,17,60,0
2024-01-05,28,18,55,0
```

### CSV de Productos
```csv
Producto,Precio,Cantidad_Vendida,Rating
Laptop,999,45,4.8
Mouse,29,150,4.5
Teclado,79,98,4.6
Monitor,299,67,4.7
Cable,9,500,4.3
```

## Funcionalidades Principales

### 📊 Visualizaciones
1. Carga un CSV
2. Ve la pestaña "Visualizaciones"
3. Cambia entre:
   - **Línea**: Para tendencias en el tiempo
   - **Barra**: Para comparación entre categorías
   - **Scatter**: Para relaciones entre dos variables
   - **Pie**: Para porcentajes del total

### 📋 Tabla de Datos
1. Pestaña "Tabla de datos"
2. Busca valores con el cuadro de búsqueda
3. Haz clic en encabezados para ordenar ▲ ▼
4. Navega entre páginas

### 💬 Chat Inteligente
1. Pestaña "Chat con IA"
2. Escribe preguntas como:
   - "Cuál es el promedio?"
   - "Qué mes tuvo más ventas?"
   - "Hay alguna tendencia?"
   - "Compare estas dos columnas"

## Preguntas Frecuentes

### P: ¿Por qué no funciona el chat?
**R:** Verifica:
- [ ] Archivo `.env.local` existe en la raíz del proyecto
- [ ] API key está correcta en `.env.local`
- [ ] Reiniciaste el servidor después de crear el archivo
- [ ] Abre F12 → Console para ver errores

### P: ¿Los gráficos no aparecen?
**R:** Necesitas:
- Columnas **numéricas** (números, no texto)
- Mínimo 2 filas de datos
- Columnas bien separadas por comas

### P: ¿Hay límite de datos?
**R:** Recomendaciones:
- Máximo 50,000 filas
- Máximo 100 columnas
- El análisis IA usa primeras 50 filas

### P: ¿Cuesta algo?
**R:** **¡No!** Completamente gratis:
- OpenRouter ofrece acceso gratuito a modelos IA
- No requiere tarjeta de crédito
- Sin límites abusivos

### P: ¿Dónde se guardan mis datos?
**R:** 
- Solo en tu navegador (no se suben al servidor)
- Se pierden al recargar la página
- Puedes exportar resultados

### P: ¿Puedo cambiar el modelo IA?
**R:** Sí, edita estos archivos:
- `/app/api/analyze/route.ts` (línea ~45)
- `/app/api/chat/route.ts` (línea ~26)

Cambia `'mistral-7b-instruct'` por otro modelo listado en OpenRouter.

## Ejemplo Completo en 3 Pasos

### Paso 1: Crear un CSV
Copia esto en un editor de texto:
```csv
Semana,Ventas,Visitantes,Conversion_Rate
Semana1,5000,2500,2.0
Semana2,5500,2800,1.96
Semana3,6200,3100,2.0
Semana4,7100,3500,2.03
Semana5,8200,3900,2.1
Semana6,9500,4300,2.21
```

Guarda como `ventas.csv`

### Paso 2: Carga en DataMind
1. Abre http://localhost:3000
2. Arrastra el archivo `ventas.csv`
3. Espera a que cargue (2-3 segundos)

### Paso 3: Explora
- **Pestaña "Visualizaciones"**: Ve gráficos de las tendencias
- **Pestaña "Tabla"**: Ordena por columnas
- **Pestaña "Chat"**: Pregunta "¿Cuál fue la semana con más ventas?"

¡Listo! ✨

## Próximos Pasos

- Explora diferentes tipos de gráficos
- Prueba hacer preguntas al chat
- Personaliza el análisis
- Exporta tus datos (próxima feature)

## Soporte

Si algo no funciona:

1. **Verifica** que OpenRouter esté configurado
2. **Abre** la consola (F12) para ver errores
3. **Reinicia** el servidor (`Ctrl+C`, luego `pnpm dev`)
4. **Recarga** la página del navegador

## Links Útiles

- 📖 [OpenRouter Docs](https://openrouter.io/docs)
- 📚 [Documentación Completa](README.md)
- 🏗️ [Arquitectura Técnica](ARCHITECTURE.md)
- ⚙️ [Configuración Avanzada](SETUP.md)

---

**¿Necesitas más ayuda?** Abre un issue en GitHub o revisa el README.md

**¡Disfruta analizando tus datos con IA!** 🎉
