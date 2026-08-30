import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/editorial/assistant';

interface FallbackPick {
  title: string;
  type: string;
  year: string;
  director: string;
  abstractScore: number;
  summary: string;
  whyWatch: string;
}

function getCriteriaAwareFallback(genres: string[], mood: string, mediaType: string): FallbackPick[] {
  const combined = `${genres.join(' ')} ${mood} ${mediaType}`.toLowerCase();

  if (combined.includes('romance') || combined.includes('romantic') || combined.includes('emotional')) {
    return [
      {
        title: 'Past Lives (2023)',
        type: 'Movie',
        year: '2023',
        director: 'Celine Song',
        abstractScore: 10,
        summary: 'An aching, delicate meditation on destiny, lost love, and the Korean concept of In-Yun.',
        whyWatch: 'Matches your emotional romantic preference with breathtaking restraint and resonance.',
      },
      {
        title: 'Drive My Car (2021)',
        type: 'Movie',
        year: '2021',
        director: 'Ryusuke Hamaguchi',
        abstractScore: 10,
        summary: 'A sublime, quiet masterpiece exploring grief, intimacy, and unspoken human truth.',
        whyWatch: 'Rich emotional depth and profound character connection.',
      },
      {
        title: 'Normal People (2020)',
        type: 'Series',
        year: '2020',
        director: 'Lenny Abrahamson',
        abstractScore: 9,
        summary: 'An intensely intimate examination of magnetic love, vulnerability, and class divide across years.',
        whyWatch: 'Devastatingly honest depiction of romantic connection and growing up.',
      },
    ];
  }

  if (combined.includes('anime') || combined.includes('animation') || combined.includes('ghibli')) {
    return [
      {
        title: 'The Boy and the Heron (2023)',
        type: 'Anime',
        year: '2023',
        director: 'Hayao Miyazaki',
        abstractScore: 10,
        summary: 'A twilight masterpiece exploring grief, creative inheritance, and surreal underworld logic.',
        whyWatch: 'Astonishing hand-drawn artistry paired with profound psychological depth.',
      },
      {
        title: 'Perfect Blue (1997)',
        type: 'Anime',
        year: '1997',
        director: 'Satoshi Kon',
        abstractScore: 10,
        summary: 'A terrifying, razor-sharp psychological thriller dissecting celebrity, identity, and fractured reality.',
        whyWatch: 'Mind-bending visual grammar that influenced modern cinema.',
      },
      {
        title: 'Pluto (2023)',
        type: 'Anime',
        year: '2023',
        director: 'Toshio Kawaguchi',
        abstractScore: 9,
        summary: 'A mature, melancholic neo-noir mystery exploring war trauma, hatred, and artificial consciousness.',
        whyWatch: 'Deeply philosophical narrative with gorgeous animation.',
      },
    ];
  }

  if (combined.includes('crime') || combined.includes('dark') || combined.includes('thriller')) {
    return [
      {
        title: 'Memories of Murder (2003)',
        type: 'Movie',
        year: '2003',
        director: 'Bong Joon-ho',
        abstractScore: 10,
        summary: 'A haunting, pitch-black procedural thriller exploring futility and systemic decay in 1980s Korea.',
        whyWatch: 'Gripping tension, dark humor, and an unforgettable final gaze.',
      },
      {
        title: 'Mindhunter (2017)',
        type: 'Series',
        year: '2017',
        director: 'David Fincher',
        abstractScore: 9,
        summary: 'An icy, cerebral descent into the early psychological profiling of serial killers.',
        whyWatch: 'Pristine Fincher precision, clinical dialogue, and chilling atmosphere.',
      },
      {
        title: 'Zodiac (2007)',
        type: 'Movie',
        year: '2007',
        director: 'David Fincher',
        abstractScore: 10,
        summary: 'The definitive investigative thriller about the infectious disease of obsession.',
        whyWatch: 'Meticulous pacing and unmatched period atmosphere.',
      },
    ];
  }

  // Default / Sci-Fi / Mind-Bending
  return [
    {
      title: 'Severance (Season 1)',
      type: 'Series',
      year: '2022',
      director: 'Ben Stiller',
      abstractScore: 9,
      summary: 'A chilling, pristine neo-dystopian workplace thriller with flawless aesthetic design.',
      whyWatch: 'Engaging corporate allegory packed with psychological tension and mystery.',
    },
    {
      title: 'Dune: Part Two (2024)',
      type: 'Movie',
      year: '2024',
      director: 'Denis Villeneuve',
      abstractScore: 10,
      summary: 'A monumental sci-fi tragedy exploring charismatic prophecy and the terrifying weight of power.',
      whyWatch: 'Uncompromising audiovisual scale with deep thematic complexity.',
    },
    {
      title: 'Devs (2020)',
      type: 'Series',
      year: '2020',
      director: 'Alex Garland',
      abstractScore: 9,
      summary: 'A hypnotic tech-thriller dissecting determinism, quantum computing, and personal grief.',
      whyWatch: 'Stunning architectural visuals with high philosophical ambition.',
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { mood, favoriteFilms, mediaType, genre, genres: rawGenres, timeAvailable } = body;
    const genres: string[] = Array.isArray(rawGenres)
      ? rawGenres
      : genre
      ? [genre]
      : [];

    const selectedMood = mood || 'Thoughtful & Atmospheric';
    const selectedGenres = genres.length > 0 ? genres.join(', ') : 'Any / Cross-Genre';
    const selectedType = mediaType || 'Any';
    const fallbackPicks = getCriteriaAwareFallback(genres, selectedMood, selectedType);

    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json({
        success: true,
        curatorNote: `Bespoke ${selectedMood.toLowerCase()} selections tailored for your ${selectedGenres.toLowerCase()} preference.`,
        recommendations: fallbackPicks,
      });
    }

    const prompt = `You are "The Abstract Take" Cinema Editor & Chief Critic providing personalized watch recommendations.
The Abstract Take is a high-profile, independent, editorial cinema and television publication known for thoughtful, opinionated, artistic critique scored strictly on a 1-10 Abstract Scale.

The user is asking for watch recommendations based on these exact criteria:
- Format / Media Type: ${selectedType}
- Selected Genres / Themes: ${selectedGenres}
- Mood / Viewing Vibe: ${selectedMood}
- Favorite reference titles: ${favoriteFilms || 'None specified'}
- Available runtime: ${timeAvailable || 'Flexible'}

CRITICAL REQUIREMENT:
Generate exactly 3 bespoke recommendations that STRONGLY MATCH the requested genre (${selectedGenres}) and mood (${selectedMood}). 
Do NOT recommend generic blockbuster movies unless they genuinely fit the requested criteria.

Each recommendation MUST include:
1. title (e.g. "Past Lives (2023)")
2. type ("Movie", "Series", "Anime", "Documentary", "Mini-Series", or "Special")
3. year (e.g. "2023")
4. director (e.g. "Celine Song")
5. abstractScore (integer from 1 to 10 on our calibrated editorial scale, 10=Masterpiece, 9=Brilliant, 8=Amazing)
6. summary (a concise 2-sentence editorial overview in the voice of The Abstract Take)
7. whyWatch (1 sentence explaining why it specifically satisfies the user's genre and mood choice)

Respond ONLY in valid JSON matching this structure:
{
  "curatorNote": "Short 1-sentence note from The Abstract Take explaining the selection rationale",
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

    let text = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      text = response.text || '';
    } catch (modelErr: any) {
      console.warn('Primary Gemini call failed, returning criteria-aware editorial fallback:', modelErr?.message || modelErr);
      return NextResponse.json({
        success: true,
        curatorNote: `Bespoke ${selectedMood.toLowerCase()} selections tailored for your ${selectedGenres.toLowerCase()} preference.`,
        recommendations: fallbackPicks,
      });
    }

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
        curatorNote: `Bespoke ${selectedMood.toLowerCase()} selections tailored for your taste profile.`,
        recommendations: fallbackPicks,
      };
    }

    return NextResponse.json({ success: true, ...jsonResponse });
  } catch (error: any) {
    console.error('Recommend-AI endpoint error:', error);
    return NextResponse.json({
      success: true,
      curatorNote: 'Curated editorial selections from The Abstract Take.',
      recommendations: [
        {
          title: 'Drive My Car (2021)',
          type: 'Movie',
          year: '2021',
          director: 'Ryusuke Hamaguchi',
          abstractScore: 10,
          summary: 'A sublime, quiet masterpiece exploring grief, communication, and human resonance.',
          whyWatch: 'Exquisite storytelling and profound emotional depth.',
        },
        {
          title: 'Severance (Season 1)',
          type: 'Series',
          year: '2022',
          director: 'Ben Stiller',
          abstractScore: 9,
          summary: 'A chilling, pristine neo-dystopian workplace thriller with flawless aesthetic design.',
          whyWatch: 'Masterful narrative tension and existential intrigue.',
        },
      ],
    });
  }
}
