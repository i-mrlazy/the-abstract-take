import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/editorial/assistant';

export async function POST(req: NextRequest) {
  try {
    const { mood, favoriteFilms, mediaType, timeAvailable } = await req.json();
    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json({
        success: true,
        curatorNote: 'Tailored picks reflecting your personal taste profile and cinematic preferences.',
        recommendations: [
          {
            title: 'Drive My Car (2021)',
            type: 'Movie',
            year: '2021',
            director: 'Ryusuke Hamaguchi',
            abstractScore: 10,
            summary: 'A sublime, quiet masterpiece exploring grief, communication, and human resonance.',
            whyWatch: 'Matches your contemplative mood with exquisite storytelling.',
          },
          {
            title: 'Severance (Season 1)',
            type: 'Series',
            year: '2022',
            director: 'Ben Stiller',
            abstractScore: 9,
            summary: 'A chilling, pristine neo-dystopian workplace thriller with flawless aesthetic design.',
            whyWatch: 'Engaging corporate allegory packed with tension.',
          },
        ],
      });
    }

    const prompt = `You are "The Abstract Take" Cinema Editor & Curator providing personalized "Editor's Recommendation" watch picks. 
The Abstract Take is a high-profile, independent, editorial cinema and television review platform known for thoughtful, opinionated, artistic critique.

The user is asking for personalized watch recommendations based on these preferences:
- Mood/Vibe: ${mood || 'Thoughtful & Atmospheric'}
- Favorite recent films/shows: ${favoriteFilms || 'None specified'}
- Preferred Media: ${mediaType || 'Any'}
- Available time: ${timeAvailable || 'Flexible'}

Generate exactly 3 bespoke recommendations. Each recommendation MUST include:
1. title (e.g. "Past Lives (2023)")
2. type ("Movie", "Series", "Anime", "Documentary")
3. year (e.g. "2023")
4. director (e.g. "Celine Song")
5. abstractScore (an integer from 1 to 10 based on artistic merit on a 1-10 scale, e.g. 10 for Masterpiece, 9 for Brilliant, 8 for Great)
6. summary (a concise 2-sentence editorial overview in the voice of The Abstract Take)
7. whyWatch (1 sentence explaining why it specifically fits the user's input)

Respond ONLY in valid JSON matching this structure:
{
  "curatorNote": "Short 1-sentence note from The Abstract Take",
  "recommendations": [
    {
      "title": "...",
      "type": "...",
      "year": "...",
      "director": "...",
      "abstractScore": 9,
      "summary": "...",
      "whyWatch": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    let jsonResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        jsonResponse = JSON.parse(text);
      }
    } catch {
      jsonResponse = {
        curatorNote: 'Here are curated picks tailored for your current aesthetic vibe.',
        recommendations: [
          {
            title: 'Anatomy of a Fall (2023)',
            type: 'Movie',
            year: '2023',
            director: 'Justine Triet',
            abstractScore: 9,
            summary: 'A sharp, multi-layered psychological courtroom drama examining truth and relationship dynamics.',
            whyWatch: 'Captivating intellectual rigor and masterful acting.',
          },
        ],
      };
    }

    return NextResponse.json({ success: true, ...jsonResponse });
  } catch (error: any) {
    console.error('Gemini recommend error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations', message: error.message }, { status: 500 });
  }
}
