# 🧪 Prototipo de Aprendizaje Inmersivo para Química I

Un laboratorio virtual que combina visualización 3D interactiva con un tutor inteligente basado en IA para enseñar conceptos fundamentales de Química I.

![Química Lab](https://img.shields.io/badge/Qu%C3%ADmica-Laboratorio%20Virtual-06b6d4)
![Tecnología](https://img.shields.io/badge/Tecnolog%C3%ADa-Spline%20%7C%20IA%20%7C%20Web-green)
![Accesibilidad](https://img.shields.io/badge/Accesibilidad-DUA-purple)

## 📋 Características

### ✨ Funcionalidades Principales

1. **Entorno 3D Interactivo**
   - Visualizador Spline para modelos moleculares
   - Controles para simular enlaces iónicos y covalentes
   - Feedback visual en tiempo real

2. **Tutor Inteligente IA**
   - Chat integrado con contexto químico
   - Respuestas personalizadas sobre estructura atómica
   - Historial de conversación persistente

3. **Accesibilidad (DUA)**
   - Alto contraste para legibilidad
   - Navegación por teclado
   - Atributos ARIA completos
   - Soporte para lectores de pantalla

## 📁 Estructura del Proyecto

```
quimica-inmersiva/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos personalizados
├── js/
│   ├── spline-controller.js   # Lógica 3D
│   └── ai-tutor.js            # Lógica del tutor IA
├── server/
│   ├── index.js           # Backend Node.js/Express
│   ├── package.json       # Dependencias del backend
│   └── .env.example       # Variables de entorno ejemplo
├── assets/                # Recursos estáticos (imágenes, etc.)
└── README.md              # Este archivo
```

## 🚀 Instalación y Uso

### Opción A: Frontend Only (Recomendado para Demo)

El frontend funciona completamente sin backend usando respuestas simuladas.

1. **Abrir directamente en el navegador:**
   ```bash
   # Simplemente abre el archivo index.html
   open index.html
   ```

2. **O usa un servidor local:**
   ```bash
   # Con Python
   python -m http.server 8000
   
   # Con Node.js (necesita 'serve')
   npx serve .
   
   # Luego abre http://localhost:8000
   ```

3. **Desplegar en Vercel/Netlify:**
   - Sube el repositorio a GitHub
   - Conecta Vercel/Netlify al repositorio
   - ¡Listo! Deploy automático

### Opción B: Con Backend IA (OpenAI)

Para usar el tutor IA con respuestas reales de OpenAI:

1. **Instalar dependencias del backend:**
   ```bash
   cd server
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env
   
   # Editar .env y añadir tu API Key de OpenAI
   # OPENAI_API_KEY=tu_clave_aqui
   ```

3. **Iniciar el servidor:**
   ```bash
   npm start
   # El servidor corre en http://localhost:3000
   ```

4. **Configurar el frontend:**
   - Abre `js/ai-tutor.js`
   - Asegúrate que `config.mode = 'openai'`
   - Si el backend está en otro puerto, actualiza `config.apiEndpoint`

5. **Ejecutar el frontend:**
   ```bash
   # En otra terminal
   cd ..
   python -m http.server 8000
   ```

## 🔧 Configuración

### Cambiar entre modos de IA

En `js/ai-tutor.js`, modifica la configuración:

```javascript
this.config = {
    mode: 'openai',      // 'openai' | 'voiceflow'
    apiEndpoint: '/api/chat',
    maxHistoryLength: 20,
    typingDelay: 600
};
```

### Personalizar el Modelo 3D

1. Crea tu escena en [Spline](https://spline.design/)
2. Exporta como `.splinecode` o usa la URL pública
3. Actualiza el atributo `url` en `index.html`:
   ```html
   <spline-viewer url="TU_URL_DE_SPLINE"></spline-viewer>
   ```

### Modificar el System Prompt

En `js/ai-tutor.js` o `server/index.js`, edita:

```javascript
this.systemPrompt = `Eres un tutor experto en Química I...`;
```

## 🎨 Personalización de Estilos

Los estilos principales están en `css/styles.css`. Variables clave:

```css
:root {
    --color-primary: #06b6d4;      /* Color principal (cyan) */
    --color-secondary: #22c55e;    /* Color secundario (verde) */
    --shadow-neon: 0 0 20px rgba(6, 182, 212, 0.3);
}
```

## 🌐 Despliegue

### Vercel

1. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Despliega:
   ```bash
   vercel
   ```

### Netlify

1. Arrastra la carpeta del proyecto a [Netlify Drop](https://app.netlify.com/drop)
2. O usa Netlify CLI:
   ```bash
   npm i -g netlify-cli
   netlify deploy
   ```

### GitHub Pages

1. Crea un branch `gh-pages`
2. Sube los archivos estáticos
3. Activa GitHub Pages en Settings

## 📚 Principios DUA Implementados

### 1. Múltiples Formas de Representación
- Visual: Modelos 3D interactivos
- Textual: Explicaciones en el chat
- Auditivo: (Futuro) Text-to-speech

### 2. Múltiples Formas de Acción y Expresión
- Botones de control físico
- Chat para preguntas libres
- Preguntas rápidas predefinidas

### 3. Múltiples Formas de Implicación
- Gamificación con feedback visual
- Exploración libre del modelo 3D
- Tutor personalizado disponible 24/7

## 🔌 APIs y Servicios

### OpenAI API
- Usada para el tutor inteligente
- Endpoint: `/api/chat`
- Modelo: `gpt-3.5-turbo`

### Spline
- Motor 3D para visualizaciones
- CDN: `unpkg.com/@splinetool/viewer`

### Voiceflow (Opcional)
- Alternativa a OpenAI
- Widget embebido listo para integrar

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología |
|-----------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Framework CSS | Tailwind CSS (CDN) |
| 3D Engine | Spline Viewer |
| Backend | Node.js + Express |
| IA | OpenAI GPT-3.5 |
| Hosting | Vercel / Netlify |

## 🤝 Contribuciones

Este es un prototipo educativo. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - Libre uso para fines educativos.

## 👨‍💻 Autor

Desarrollado como prototipo para aprendizaje inmersivo de química.

## 🆘 Soporte

Para problemas o preguntas:
- Revisa la consola del navegador (F12)
- Verifica que todos los archivos estén en su lugar
- Asegúrate de tener conexión a internet (para cargar Spline y Tailwind)

---

**¡Disfruta explorando la química de forma inmersiva! 🧪⚗️**
