'use server';
/**
 * @fileOverview A Genkit tool for enhancing case descriptions.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CaseEnhancementInputSchema = z.object({
  title: z.string().describe('The title of the case or project.'),
});

const CaseEnhancementOutputSchema = z.object({
  enhancedDescription: z.string().describe('A detailed, structured description for the case.'),
});

const caseEnhancementPrompt = `You are an expert project manager and business analyst. Your task is to take a simple project title and expand it into a detailed, professional case description suitable for a marketplace. The description should be clear, comprehensive, and provide all the necessary information a service provider would need.

**Project Title:**
{{{title}}}

**Instructions:**
Based on the title, generate a detailed description. Structure your response with the following sections using Markdown:

-   **🎯 Objetivo Principal:** (A clear, concise goal for the project.)
-   **👥 Público Objetivo:** (A brief description of the target audience.)
-   **🔑 Funcionalidades Clave:** (A bulleted list of 3-5 essential features or requirements.)
-   **🎨 Estilo y Tono:** (Desired style, e.g., "Moderno y minimalista", "Corporativo y serio".)
-   **💰 Presupuesto Estimado (Opcional):** (A placeholder for the client to fill in, e.g., "RD$5,000 - RD$15,000").
-   **❓ Preguntas para el Proveedor:** (A couple of relevant questions for potential providers to answer in their proposal.)

**Example for a title "Página web para mi cafetería":**

**🎯 Objetivo Principal:**
Crear una presencia online atractiva y funcional para "Aroma a Café" que informe a los clientes sobre nuestro menú, ubicación, y horario, y que eventualmente permita tomar pedidos en línea.

**👥 Público Objetivo:**
Residentes locales, estudiantes universitarios y turistas en la zona de Santo Domingo que buscan un lugar acogedor para disfrutar de buen café y postres.

**🔑 Funcionalidades Clave:**
*   Sección de menú interactivo con fotos y descripciones.
*   Mapa de Google integrado con nuestra ubicación.
*   Galería de fotos del local y los productos.
*   Formulario de contacto sencillo.
*   Diseño "responsive" (que se vea bien en celulares y computadoras).

**🎨 Estilo y Tono:**
Cálido, rústico y moderno, con un toque artesanal. Queremos que la web refleje la atmósfera de nuestra cafetería.

**💰 Presupuesto Estimado (Opcional):**
[El cliente puede llenar esto]

**❓ Preguntas para el Proveedor:**
*   ¿Qué plataforma recomiendas para este tipo de página web (WordPress, Squarespace, etc.) y por qué?
*   ¿Puedes mostrarme ejemplos de páginas web de restaurantes o cafeterías que hayas creado?

Now, generate a similar description for the provided title.
`;


export const caseEnhancementTool = ai.defineTool(
  {
    name: 'caseEnhancementTool',
    description: 'Generates a detailed, structured project description from a simple title.',
    inputSchema: CaseEnhancementInputSchema,
    outputSchema: CaseEnhancementOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: caseEnhancementPrompt,
      model: 'gemini15Flash',
      context: { title: input.title },
      output: {
        format: 'text',
      },
      config: { temperature: 0.5 },
    });

    return {
      enhancedDescription: llmResponse.text,
    };
  }
);
