# DataMind - Guía de Configuración

## Requisitos Previos

- Node.js 18+ instalado

## Instalación

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## Configuración de OpenRouter (IMPORTANTE)

DataMind usa **OpenRouter** para acceso a IA completamente GRATIS.

### Pasos:

1. **Crear cuenta gratis en OpenRouter**:
   - Visita [https://openrouter.io](https://openrouter.io)
   - Crea una cuenta (es totalmente gratis)

2. **Obtener API Key**:
   - Ve a [https://openrouter.io/keys](https://openrouter.io/keys)
   - Copia tu API key (comienza con `sk-or-`)

3. **Configurar variable de entorno**:
   - Copia el archivo `.env.example` a `.env.local`
   - Pega tu API key en la variable `OPENROUTER_API_KEY`

```bash
cp .env.example .env.local
# Luego edita .env.local y pega tu API key
```

4. **Reinicia el servidor** y ¡listo!

## Características

✅ Carga de archivos CSV  
✅ Análisis automático con IA  
✅ Visualizaciones interactivas (línea, barra, scatter, pie)  
✅ Chat conversacional sobre tus datos  
✅ Tabla de datos con búsqueda y ordenamiento  
✅ Estadísticas y insights automáticos  

## Modelos de IA disponibles en OpenRouter

DataMind por defecto usa **Mistral 7B** (súper rápido y gratis).

Otros modelos disponibles:
- Llama 2 7B
- Neural Chat 7B
- Y muchos más...

## Solución de Problemas

### Error: "OPENROUTER_API_KEY no está configurada"

**Solución**: 
1. Crea el archivo `.env.local` en la raíz del proyecto
2. Añade: `OPENROUTER_API_KEY=tu_clave_aqui`
3. Reinicia el servidor (`pnpm dev`)

### El chat no responde

**Solución**:
1. Verifica que tu API key sea válida en [OpenRouter](https://openrouter.io)
2. Comprueba en el navegador que el archivo se cargó correctamente
3. Abre la consola del navegador (F12) para ver errores

### Los gráficos no aparecen

**Solución**: Asegúrate de que tu CSV tenga columnas numéricas. Las columnas de texto no se visualizan.

## Formato de archivos soportados

- **CSV** (Comma-Separated Values) ✅

### Ejemplo de formato CSV válido:
```csv
Nombre,Edad,Salario,Departamento
Juan,28,45000,Ventas
María,32,55000,Tecnología
Pedro,25,38000,Operaciones
```

## Tips de uso

1. **Primeras 5 filas**: El análisis IA se basa en las primeras 50 filas para ser rápido
2. **Columnas numéricas**: Los gráficos solo funcionan con columnas numéricas
3. **Chat**: Haz preguntas específicas como:
   - "Cuál es el promedio de ventas?"
   - "Qué tendencias ves en los datos?"
   - "Hay algún patrón interesante?"

## Tecnologías usadas

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Gráficos**: Recharts
- **Animaciones**: Framer Motion
- **IA**: AI SDK v6 + OpenRouter
- **Análisis**: simple-statistics, papaparse

## Licencia

MIT - Libre de usar para cualquier propósito
