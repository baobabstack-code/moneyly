import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

// Initialize API clients
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const xaiApiKey = process.env.XAI_API_KEY;
const xai = xaiApiKey ? new OpenAI({ apiKey: xaiApiKey, baseURL: 'https://api.x.ai/v1' }) : null;

export async function POST(req: Request) {
  try {
    if (!genAI && !groq && !xai) {
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

    if (audioFile.size < 1000) {
      // Audio is too short or empty (e.g. < 0.01 seconds)
      return NextResponse.json({
        replyText: "I didn't quite catch that.",
        audioBase64: null,
        action: null
      });
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

    // STT: Try Groq first
    let userText = '';
    if (groq) {
      try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const file = await OpenAI.toFile(buffer, "audio.webm", { type: audioFile.type || 'audio/webm' });
        const transcription = await groq.audio.transcriptions.create({
          file,
          model: "whisper-large-v3-turbo",
        });
        userText = transcription.text;
      } catch (sttError: any) {
        console.warn('Groq STT failed:', sttError);
        lastError = sttError;
      }
    }

    // If we successfully transcribed text, try LLMs (xAI -> Groq)
    if (userText) {
      // Priority 1: xAI LLM
      if (xai) {
        try {
          const chatCompletion = await xai.chat.completions.create({
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: userText }
            ],
            model: "grok-4.3",
          });
          text = chatCompletion.choices[0]?.message?.content || "I didn't quite catch that.";
          success = true;
        } catch (xaiError: any) {
          console.warn('xAI voice LLM failed, falling back to Groq if available', xaiError);
          lastError = xaiError;
        }
      }

      // Priority 2: Groq LLM
      if (!success && groq) {
        try {
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
          console.warn('Groq voice LLM failed', groqError);
          lastError = groqError;
        }
      }
    }

    // Fallback to Gemini if text-based LLMs failed or STT failed
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
        { name: 'gemini-3.1-flash-live-preview', supportsAudioOut: true },
        { name: 'gemini-3.5-flash', supportsAudioOut: false },
        { name: 'gemini-3.1-pro-preview', supportsAudioOut: false },
        { name: 'gemini-flash-latest', supportsAudioOut: false }
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
          console.warn(`${modelConfig.name} failed (${error?.status || error?.message}). Trying next fallback model...`);
          continue;
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
