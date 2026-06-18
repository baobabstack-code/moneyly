import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// Initialize API clients
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export async function POST(req: Request) {
  try {
    if (!genAI && !groq) {
      return NextResponse.json(
        { error: 'No AI API keys are configured.' },
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

    const prompt = `
      You are Moneyly's AI Voice Assistant. You help the user manage their personal finances.
      You will receive an audio recording of the user speaking. Listen to it and respond conversationally.
      Provide a brief, conversational reply.
    `;

    let responseAudioBase64 = null;
    let text = "";
    let success = false;
    let lastError: any = null;

    // Prioritize Groq if available
    if (groq) {
      try {
        // Groq STT using Whisper
        const file = new File([audioFile], "audio.webm", { type: audioFile.type || 'audio/webm' });
        const transcription = await groq.audio.transcriptions.create({
          file,
          model: "whisper-large-v3-turbo",
        });

        const userText = transcription.text;

        // Groq LLM generation
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userText }
          ],
          model: "llama-3.3-70b-versatile",
        });

        text = chatCompletion.choices[0]?.message?.content || "I didn't quite catch that.";
        success = true;
      } catch (groqError: any) {
        console.warn('Groq voice processing failed, falling back to Gemini if available', groqError);
        lastError = groqError;
      }
    }

    // Fallback to Gemini
    if (!success && genAI) {
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const audioBase64 = buffer.toString('base64');
      const mimeType = audioFile.type || 'audio/webm';

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

      for (const modelConfig of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelConfig.name });
          let result;

          if (modelConfig.supportsAudioOut) {
            result = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: prompt }, ...audioParts] }],
              generationConfig: {
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

          success = true;
          break;
        } catch (error: any) {
          lastError = error;
          if (error?.status === 503 || error?.status === 429 || error?.message?.includes('503')) {
            console.warn(`${modelConfig.name} is unavailable (${error?.status}). Trying next fallback model...`);
            continue;
          } else {
            break;
          }
        }
      }
    }

    if (!success) {
      throw lastError || new Error("All AI models failed.");
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
