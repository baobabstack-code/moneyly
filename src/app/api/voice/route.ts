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

    // gemini-3.5-flash supports audio input and output
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, ...audioParts] }],
      generationConfig: {
        // Explicitly request audio response for speech-to-speech
        // @ts-ignore - The SDK types might not be fully up to date for responseModalities yet
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

    const response = await result.response;
    const text = response.text();
    
    // Extract the audio part returned directly by Gemini for speech-to-speech
    let responseAudioBase64 = null;
    if (response.candidates && response.candidates[0]?.content?.parts) {
       const audioPart = response.candidates[0].content.parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio/'));
       if (audioPart && audioPart.inlineData) {
         responseAudioBase64 = audioPart.inlineData.data;
       }
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
