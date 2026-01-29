import { NextResponse } from 'next/server';

// --- Types ---
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIReportContext {
  overview: { modality: string; region: string };
  findings: { visualObservations: string[]; highlightedRegions: string[] };
  measurements: { data: string[] };
  patientSupport: { explanation: string; nextSteps: string[] };
}

// --- Configuration ---
const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = 'llama3'; // Default to llama3, fallback to mistral could be added

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, context } = body as { messages: ChatMessage[]; context: AIReportContext };
    
    const lastUserMessage = messages[messages.length - 1].content;

    // 1. Try to connect to Local Open Source LLM (Ollama)
    try {
      // Fast check if Ollama is reachable (2s timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      console.log('Attempting to connect to local Ollama instance...');
      const healthCheck = await fetch('http://127.0.0.1:11434/api/tags', { 
        method: 'GET',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (healthCheck.ok) {
        console.log('✅ Local LLM detected. Using Ollama.');
        
        // Construct System Prompt with Context
        const systemPrompt = `
          You are MediVision AI, an advanced medical imaging assistant.
          Current Scan Context:
          - Modality: ${context.overview.modality} of ${context.overview.region}
          - Findings: ${context.findings.visualObservations.join('. ')}
          - Measurements: ${context.measurements.data.join(', ')}
          - Patient Summary: ${context.patientSupport.explanation}

          Task: Answer the user's question purely based on the findings above. 
          Be professional, concise, and medical. Do not hallucinate findings not listed.
        `;

        const ollamaResponse = await fetch(OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            stream: false
          })
        });

        if (ollamaResponse.ok) {
           const data = await ollamaResponse.json();
           return NextResponse.json({ 
             role: 'assistant', 
             content: data.message.content,
             source: 'local-llm'
           });
        }
      }
    } catch (err) {
      console.log('⚠️ Local LLM not available or error. Falling back to embedded engine.');
    }

    // 2. Fallback: robust Embedded Engine (Context-Aware)
    // This allows the app to be "Fully Functional" even without the 8GB model running.
    console.log('Using Embedded Logic Engine');
    const response = generateFallbackResponse(lastUserMessage, context);
    
    return NextResponse.json({ 
      role: 'assistant', 
      content: response,
      source: 'embedded-logic'
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// --- Fallback Logic Engine ---
function generateFallbackResponse(query: string, context: AIReportContext): string {
  const q = query.toLowerCase();

  // 1. Asking about Findings/Observations
  if (q.includes('finding') || q.includes('wrong') || q.includes('abnormal') || q.includes('see')) {
    return `Based on the ${context.overview.modality} analysis, the primary findings are: ${context.findings.visualObservations.join(' ')}`;
  }

  // 2. Asking about Measurements/Size
  if (q.includes('size') || q.includes('measure') || q.includes('big') || q.includes('large') || q.includes('mm') || q.includes('cm')) {
    return `The quantitative analysis reports the following: ${context.measurements.data.join(', ')}.`;
  }

  // 3. Asking about "What is this?" (Explanation)
  if (q.includes('mean') || q.includes('explain') || q.includes('what is')) {
    return `Here is the explanation: ${context.patientSupport.explanation} The highlighted areas correspond to these findings.`;
  }

  // 4. Asking about Next Steps/Treatment
  if (q.includes('do') || q.includes('next') || q.includes('step') || q.includes('treat')) {
    return `Recommended next steps include: ${context.patientSupport.nextSteps.join(' ')}. Please consult your specialist for a care plan.`;
  }

  // 5. Asking about Urgency
  if (q.includes('dangerous') || q.includes('cancer') || q.includes('bad') || q.includes('emergency')) {
    return "I cannot provide a specific diagnosis of malignancy. However, the report indicates findings that require clinical correlation. Please discuss the 'Risk & Uncertainty' score with your physician.";
  }

  // Default Greeting/Catch-all
  if (q.includes('hi') || q.includes('hello')) {
    return `Hello. I have full context of this ${context.overview.modality} scan. You can ask me about the findings, measurements, or recommendations.`;
  }

  return "I understand your question. Referring to the scan data, I recommend reviewing the detailed findings section on the left. Could you be more specific about which anatomy or finding you'd like me to elaborate on?";
}
