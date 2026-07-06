/**
 * Backend Auxiliar - Proxy para API de OpenAI
 * 
 * Función: Este servidor Express actúa como un proxy seguro entre el frontend
 * y la API de OpenAI. Oculta las API Keys del lado del cliente y permite
 * inyectar un system prompt personalizado para el tutor de química.
 * 
 * Uso: node server/index.js
 * Puerto: 3000 (configurable)
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// System Prompt hardcodeado para el tutor de química
const SYSTEM_PROMPT = `Eres un tutor experto en Química I, especializado en estructura atómica, enlaces químicos y reacciones básicas. 
Tu objetivo es guiar a estudiantes universitarios de primer año de forma amigable, clara y didáctica.
- Responde siempre en español.
- Usa analogías relacionadas con laboratorios y elementos cotidianos.
- Si el estudiante pregunta sobre visualizaciones 3D, sugiere usar los botones de control para ver los enlaces.
- Mantén las respuestas concisas (máximo 150 palabras por turno).
- Fomenta la exploración activa del modelo 3D.`;

// Endpoint principal del chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Se requiere un array de mensajes' });
    }

    // Preparar mensajes con el system prompt
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Llamada a la API de OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error en la API de OpenAI');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    res.json({ 
      success: true, 
      message: assistantMessage,
      usage: data.usage 
    });

  } catch (error) {
    console.error('Error en /api/chat:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error interno del servidor' 
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🧪 Servidor de Química IA corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoint disponible: POST /api/chat`);
});
