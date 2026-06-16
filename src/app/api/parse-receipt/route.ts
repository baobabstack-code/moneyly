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

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64 in request body.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    let text = response.text();
    
    // Clean up potential markdown formatting from the response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text);
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
