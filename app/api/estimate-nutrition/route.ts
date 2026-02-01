import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description, grams, cookedRaw } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Food description is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const hasGrams = typeof grams === 'number' && grams > 0;
    const gramInstruction = hasGrams
      ? `IMPORTANT: The user specified ${grams}g (${cookedRaw} weight). Use standard nutrition data (per 100g) and calculate calories and protein for exactly ${grams}g of ${cookedRaw} food. Account for typical ${cookedRaw === 'cooked' ? 'cooked' : 'raw'} nutritional density.`
      : 'The user did not specify a gram amount. Estimate based on a typical reasonable serving size for the described food(s).';

    const prompt = `You are a nutrition expert. Estimate the calories and protein content for this food entry.

Food: "${description}"

${gramInstruction}

Provide your response in JSON format:
{
  "calories": <number>,
  "protein": <number in grams>,
  "breakdown": "<brief explanation of your estimation>"
}

Be accurate and use standard nutrition databases (e.g., USDA). If multiple items are mentioned, estimate the total for all items combined.
When grams are given, scale from per-100g values accordingly.

Only respond with valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful nutrition expert. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);

    // Validate and sanitize the response
    const calories = Math.max(0, Math.round(Number(result.calories) || 0));
    const protein = Math.max(0, Math.round(Number(result.protein) * 10) / 10); // Round to 1 decimal

    return NextResponse.json({
      calories,
      protein,
      breakdown: result.breakdown || '',
    });
  } catch (error: any) {
    console.error('Error estimating nutrition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate nutrition' },
      { status: 500 }
    );
  }
}
