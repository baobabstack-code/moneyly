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
        { error: 'No AI API keys are configured (neither GEMINI_API_KEY nor GROQ_API_KEY).' },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 in request body.' },
        { status: 400 }
      );
    }

    const prompt = `
      You are an expert personal finance receipt parser.
      Analyze this receipt image and extract the following information strictly as a JSON object:
      {
        "amount": number (the total final amount, e.g. 45.99),
        "merchant": string (the name of the store or merchant),
        "date": string (the date of the transaction in YYYY-MM-DD format, if found, else null),
        "category": string (guess a single-word general category, e.g. "Food", "Groceries", "Transport", "Electronics", etc.)
      }
      Do not include any markdown formatting, backticks, or extra text. Return ONLY the JSON object.
    `;

    let text = '';

    // Prioritize Groq if available
    if (groq) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` } }
              ]
            }
          ],
          model: "llama-3.2-90b-vision-preview",
          temperature: 0,
        });
        text = chatCompletion.choices[0]?.message?.content || '';
      } catch (groqError: any) {
        console.warn('Groq receipt parsing failed, falling back to Gemini if available', groqError);
        if (!genAI) throw groqError;
      }
    }

    // Fallback to Gemini if Groq failed or wasn't available
    if (!text && genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const imageParts = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      text = response.text();
    }

    // Clean up potential markdown formatting from the response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', text);
      return NextResponse.json(
        { error: 'Failed to extract valid data from the receipt.', rawText: text },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error parsing receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
