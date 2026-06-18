import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided.' },
        { status: 400 }
      );
    }

    // Convert audio Blob to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString('base64');
    
    // We expect webm audio from MediaRecorder by default in most modern browsers
    const mimeType = audioFile.type || 'audio/webm';

    const prompt = `
      You are Moneyly's AI Voice Assistant. You help the user manage their personal finances.
      You will receive an audio recording of the user speaking. Listen to it and respond conversationally.
      Provide a brief, conversational reply.
    `;

    const audioParts = [
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType,
        },
      },
    ];

    const modelsToTry = [
      { name: 'gemini-3.5-flash', supportsAudioOut: true },
      { name: 'gemini-3.5-pro', supportsAudioOut: true },
      { name: 'gemini-1.5-pro', supportsAudioOut: false },
      { name: 'gemini-1.5-flash', supportsAudioOut: false }
    ];

    let responseAudioBase64 = null;
    let text = "";
    let success = false;
    let lastError: any = null;

    for (const modelConfig of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelConfig.name });
        let result;

        if (modelConfig.supportsAudioOut) {
          result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }, ...audioParts] }],
            generationConfig: {
              // Explicitly request audio response for speech-to-speech
              // @ts-ignore
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede",
                  },
                },
              },
            },
          });
        } else {
          // Standard text-only fallback for older/1.5 models
          result = await model.generateContent([prompt, ...audioParts]);
        }

        const response = await result.response;
        text = response.text();
        
        if (response.candidates && response.candidates[0]?.content?.parts) {
           const audioPart = response.candidates[0].content.parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio/'));
           if (audioPart && audioPart.inlineData) {
             responseAudioBase64 = audioPart.inlineData.data;
           }
        }

        // If we reached here, the model request succeeded
        success = true;
        break;
      } catch (error: any) {
        lastError = error;
        // Proceed to next fallback if we hit a temporary server error
        if (error?.status === 503 || error?.status === 429 || error?.message?.includes('503')) {
          console.warn(`${modelConfig.name} is unavailable (${error?.status}). Trying next fallback model...`);
          continue;
        } else {
          // If it's a different error (e.g., auth error or bad request), don't fallback.
          throw error;
        }
      }
    }

    if (!success) {
      throw lastError || new Error("All fallback models failed.");
    }

    return NextResponse.json({
      replyText: text,
      audioBase64: responseAudioBase64,
      action: null
    });

  } catch (error: any) {
    console.error('Error processing voice command:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
