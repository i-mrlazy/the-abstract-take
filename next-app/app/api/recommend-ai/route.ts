import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/editorial/assistant';
import {
  normalizeMediaType,
  isMediaTypeMatch,
  getDisplayMediaType,
  CanonicalMediaType,
} from '@/lib/utils/mediaType';

interface RecommendationItem {
  title: string;
  type: string;
  year: string;
  director: string;
  abstractScore: number;
  summary: string;
  whyWatch: string;
}

// -----------------------------------------------------------------------------
// MEDIA-TYPE-AWARE CURATED FALLBACK POOLS (Strict Isolation)
// -----------------------------------------------------------------------------
const FALLBACK_SERIES: Record<string, RecommendationItem[]> = {
  crime: [
    {
      title: 'Mindhunter (2017)',
      type: 'Series',
      year: '2017',
      director: 'David Fincher',
      abstractScore: 9,
      summary: 'An icy, cerebral descent into the early psychological profiling of serial killers.',
      whyWatch: 'Pristine Fincher precision, clinical dialogue, and chilling atmospheric tension.',
    },
    {
      title: 'True Detective (Season 1)',
      type: 'Series',
      year: '2014',
      director: 'Cary Joji Fukunaga',
      abstractScore: 10,
      summary: 'A monumental southern-gothic noir exploring cosmic pessimism, corruption, and philosophy.',
      whyWatch: 'Matchless performances and haunting philosophical weight.',
    },
    {
      title: 'Mare of Easttown (2021)',
      type: 'Series',
      year: '2021',
      director: 'Craig Zobel',
      abstractScore: 9,
      summary: 'A gritty, deeply human Pennsylvania crime drama centering on communal grief and endurance.',
      whyWatch: 'Sublime acting from Kate Winslet and grounded, authentic storytelling.',
    },
  ],
  romance: [
    {
      title: 'Normal People (2020)',
      type: 'Series',
      year: '2020',
      director: 'Lenny Abrahamson',
      abstractScore: 9,
      summary: 'An intensely intimate examination of magnetic love, vulnerability, and class divide across years.',
      whyWatch: 'Devastatingly honest depiction of romantic connection and growing up.',
    },
    {
      title: 'Scenes from a Marriage (2021)',
      type: 'Series',
      year: '2021',
      director: 'Hagai Levi',
      abstractScore: 9,
      summary: 'An emotionally devastating modern reimagining of Bergman’s dissection of love and divorce.',
      whyWatch: 'Tremendous chemistry and raw, unsparing dialogue between Oscar Isaac and Jessica Chastain.',
    },
    {
      title: 'One Day (2024)',
      type: 'Series',
      year: '2024',
      director: 'Molly Manners',
      abstractScore: 8,
      summary: 'A decades-spanning romance checking in on two kindred spirits on the same calendar day.',
      whyWatch: 'Deeply moving pacing that earns every emotional beat.',
    },
  ],
  scifi: [
    {
      title: 'Severance (Season 1)',
      type: 'Series',
      year: '2022',
      director: 'Ben Stiller',
      abstractScore: 9,
      summary: 'A chilling, pristine neo-dystopian workplace thriller with flawless aesthetic design.',
      whyWatch: 'Engaging corporate allegory packed with tension and existential mystery.',
    },
    {
      title: 'Dark (2017)',
      type: 'Series',
      year: '2017',
      director: 'Baran bo Odar',
      abstractScore: 10,
      summary: 'A monumental German time-travel tragedy woven with philosophical depth and grief.',
      whyWatch: 'Unmatched puzzle-box plotting and breathtaking tonal consistency.',
    },
    {
      title: 'Andor (2022)',
      type: 'Series',
      year: '2022',
      director: 'Tony Gilroy',
      abstractScore: 10,
      summary: 'A mature, searing political thriller dissecting totalitarianism and the moral cost of rebellion.',
      whyWatch: 'Masterful screenplay and extraordinary tension.',
    },
  ],
  default: [
    {
      title: 'Severance (Season 1)',
      type: 'Series',
      year: '2022',
      director: 'Ben Stiller',
      abstractScore: 9,
      summary: 'A chilling, pristine neo-dystopian workplace thriller with flawless aesthetic design.',
      whyWatch: 'Engaging corporate allegory packed with tension and existential mystery.',
    },
    {
      title: 'Mindhunter (2017)',
      type: 'Series',
      year: '2017',
      director: 'David Fincher',
      abstractScore: 9,
      summary: 'An icy, cerebral descent into the early psychological profiling of serial killers.',
      whyWatch: 'Pristine Fincher precision, clinical dialogue, and chilling atmospheric tension.',
    },
    {
      title: 'Succession (2018)',
      type: 'Series',
      year: '2018',
      director: 'Jesse Armstrong',
      abstractScore: 10,
      summary: 'A Shakespearean tragedy dressed as a razor-sharp corporate dark comedy.',
      whyWatch: 'Uncompromising writing and generational ensemble acting.',
    },
  ],
};

const FALLBACK_MOVIES: Record<string, RecommendationItem[]> = {
  crime: [
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
      title: 'Zodiac (2007)',
      type: 'Movie',
      year: '2007',
      director: 'David Fincher',
      abstractScore: 10,
      summary: 'The definitive investigative thriller about the infectious disease of obsession.',
      whyWatch: 'Meticulous pacing and unmatched period atmosphere.',
    },
    {
      title: 'Cure (1997)',
      type: 'Movie',
      year: '1997',
      director: 'Kiyoshi Kurosawa',
      abstractScore: 10,
      summary: 'A chilling psychological horror-procedural about hypnosis, identity, and the darkness inside society.',
      whyWatch: 'Eerie, hypnotic atmosphere that gets deep under your skin.',
    },
  ],
  romance: [
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
      title: 'Portrait of a Lady on Fire (2019)',
      type: 'Movie',
      year: '2019',
      director: 'Céline Sciamma',
      abstractScore: 10,
      summary: 'A luminous, burning romance on a secluded French island capturing love through art and memory.',
      whyWatch: 'Exquisite visual compositions and devastating emotional payoff.',
    },
  ],
  scifi: [
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
      title: 'Ex Machina (2014)',
      type: 'Movie',
      year: '2014',
      director: 'Alex Garland',
      abstractScore: 9,
      summary: 'A claustrophobic Turing test turning into a deadly chess match between creator, creation, and observer.',
      whyWatch: 'Sleek architectural design and razor-sharp psychological dialogue.',
    },
    {
      title: 'Arrival (2016)',
      type: 'Movie',
      year: '2016',
      director: 'Denis Villeneuve',
      abstractScore: 10,
      summary: 'A profoundly moving sci-fi essay on linguistics, non-linear time, and grief.',
      whyWatch: 'Intellectual elegance paired with immense emotional resonance.',
    },
  ],
  default: [
    {
      title: 'Drive My Car (2021)',
      type: 'Movie',
      year: '2021',
      director: 'Ryusuke Hamaguchi',
      abstractScore: 10,
      summary: 'A sublime, quiet masterpiece exploring grief, communication, and human resonance.',
      whyWatch: 'Matches contemplative mood with exquisite storytelling.',
    },
    {
      title: 'Past Lives (2023)',
      type: 'Movie',
      year: '2023',
      director: 'Celine Song',
      abstractScore: 10,
      summary: 'An aching, delicate meditation on destiny, lost love, and the Korean concept of In-Yun.',
      whyWatch: 'Deeply emotional atmosphere paired with breathtaking restraint.',
    },
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

const FALLBACK_ANIME: Record<string, RecommendationItem[]> = {
  default: [
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
  ],
};

const FALLBACK_DOCUMENTARY: Record<string, RecommendationItem[]> = {
  default: [
    {
      title: 'The Act of Killing (2012)',
      type: 'Documentary',
      year: '2012',
      director: 'Joshua Oppenheimer',
      abstractScore: 10,
      summary: 'A surreal, chilling documentary allowing Indonesian executioners to reenact mass killings in Hollywood styles.',
      whyWatch: 'Unprecedented insight into moral impunity and historical denial.',
    },
    {
      title: 'Flee (2021)',
      type: 'Documentary',
      year: '2021',
      director: 'Jonas Poher Rasmussen',
      abstractScore: 9,
      summary: 'An animated documentary following an Afghan refugee recounting his hidden journey across decades.',
      whyWatch: 'Deeply personal testimony with poignant artistic execution.',
    },
    {
      title: 'Jiro Dreams of Sushi (2011)',
      type: 'Documentary',
      year: '2011',
      director: 'David Gelb',
      abstractScore: 9,
      summary: 'A meditative portrait of lifelong craftsmanship, perfectionism, and legacy in Tokyo.',
      whyWatch: 'Hypnotic rhythm celebrating dedication to culinary art.',
    },
  ],
};

const FALLBACK_MINISERIES: Record<string, RecommendationItem[]> = {
  default: [
    {
      title: 'Chernobyl (2019)',
      type: 'Mini-Series',
      year: '2019',
      director: 'Johan Rencck',
      abstractScore: 10,
      summary: 'A harrowing, suffocating historical drama exploring the cost of lies in the 1986 nuclear disaster.',
      whyWatch: 'Masterpiece of tension, sound design, and political critique.',
    },
    {
      title: 'Devs (2020)',
      type: 'Mini-Series',
      year: '2020',
      director: 'Alex Garland',
      abstractScore: 9,
      summary: 'A hypnotic quantum-computing tech thriller dissecting determinism and personal grief.',
      whyWatch: 'Stunning architectural visuals with high philosophical ambition.',
    },
    {
      title: 'Band of Brothers (2001)',
      type: 'Mini-Series',
      year: '2001',
      director: 'Phil Alden Robinson',
      abstractScore: 10,
      summary: 'The definitive World War II military chronicle of camaraderie, terror, and endurance.',
      whyWatch: 'Unmatched scale and deep emotional brotherhood.',
    },
  ],
};

/**
 * Returns strictly media-type-constrained fallback recommendations.
 */
function getCriteriaAwareFallback(
  canonicalType: CanonicalMediaType,
  genres: string[],
  mood: string
): RecommendationItem[] {
  const genreStr = genres.join(' ').toLowerCase();
  const moodStr = mood.toLowerCase();
  const isCrime = genreStr.includes('crime') || genreStr.includes('thriller') || moodStr.includes('dark') || moodStr.includes('gritty');
  const isRomance = genreStr.includes('romance') || genreStr.includes('drama') || moodStr.includes('emotional') || moodStr.includes('melancholic');
  const isScifi = genreStr.includes('sci-fi') || genreStr.includes('mystery') || moodStr.includes('mind-bending') || moodStr.includes('paranoia');

  if (canonicalType === 'series') {
    if (isCrime) return FALLBACK_SERIES.crime;
    if (isRomance) return FALLBACK_SERIES.romance;
    if (isScifi) return FALLBACK_SERIES.scifi;
    return FALLBACK_SERIES.default;
  }

  if (canonicalType === 'anime') {
    return FALLBACK_ANIME.default;
  }

  if (canonicalType === 'documentary') {
    return FALLBACK_DOCUMENTARY.default;
  }

  if (canonicalType === 'mini-series') {
    return FALLBACK_MINISERIES.default;
  }

  if (canonicalType === 'movie') {
    if (isCrime) return FALLBACK_MOVIES.crime;
    if (isRomance) return FALLBACK_MOVIES.romance;
    if (isScifi) return FALLBACK_MOVIES.scifi;
    return FALLBACK_MOVIES.default;
  }

  // canonicalType === 'any': can blend best matches
  if (isCrime) {
    return [
      FALLBACK_MOVIES.crime[0],
      FALLBACK_SERIES.crime[0],
      FALLBACK_MOVIES.crime[1],
    ];
  }
  if (isRomance) {
    return [
      FALLBACK_MOVIES.romance[0],
      FALLBACK_MOVIES.romance[1],
      FALLBACK_SERIES.romance[0],
    ];
  }
  if (isScifi) {
    return [
      FALLBACK_SERIES.scifi[0],
      FALLBACK_MOVIES.scifi[0],
      FALLBACK_SERIES.scifi[1],
    ];
  }

  return [
    FALLBACK_MOVIES.default[0],
    FALLBACK_SERIES.default[0],
    FALLBACK_ANIME.default[0],
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

    const canonicalType = normalizeMediaType(mediaType);
    const targetTypeDisplay = getDisplayMediaType(canonicalType);
    const selectedMood = mood || 'Thoughtful & Atmospheric';
    const selectedGenres = genres.length > 0 ? genres.join(', ') : 'Any / Cross-Genre';

    // Build the media-type-safe fallback list
    const fallbackPicks = getCriteriaAwareFallback(canonicalType, genres, selectedMood);

    const ai = getGeminiClient();

    if (!ai) {
      return NextResponse.json({
        success: true,
        curatorNote: `Bespoke ${selectedMood.toLowerCase()} selections tailored for your ${selectedGenres.toLowerCase()} preference.`,
        recommendations: fallbackPicks,
      });
    }

    const mediaTypeConstraintInstruction =
      canonicalType === 'any'
        ? 'Media Type: Any (You may recommend movies, television series, anime, or documentaries).'
        : `CRITICAL HARD CONSTRAINT: Every single recommendation MUST strictly belong to Media Type: "${targetTypeDisplay}". If the user requested "Series", you MUST ONLY return television series and NEVER return feature movies or anime. Every item in the "recommendations" array MUST have "type": "${targetTypeDisplay}".`;

    const prompt = `You are "The Abstract Take" Cinema Editor & Chief Critic providing personalized watch recommendations.
The Abstract Take is a high-profile, independent, editorial cinema and television publication known for thoughtful, opinionated, artistic critique scored strictly on a 1-10 Abstract Scale.

The user is asking for watch recommendations based on these exact criteria:
- Requested Media Type: ${targetTypeDisplay}
- Selected Genres / Themes: ${selectedGenres}
- Mood / Viewing Vibe: ${selectedMood}
- Reference titles / Taste Signals: ${favoriteFilms || 'None specified'}
- Available runtime: ${timeAvailable || 'Flexible'}

${mediaTypeConstraintInstruction}

CRITICAL REQUIREMENT:
Generate exactly 3 bespoke recommendations that STRONGLY MATCH the requested genre (${selectedGenres}) and mood (${selectedMood}) within the requested media type (${targetTypeDisplay}).
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
      "type": "${canonicalType === 'any' ? 'Movie' : targetTypeDisplay}",
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

    let jsonResponse: any;
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

    // -------------------------------------------------------------------------
    // POST-AI VALIDATION & ENFORCEMENT OF HARD MEDIA TYPE FILTER
    // -------------------------------------------------------------------------
    const validatedRecommendations: RecommendationItem[] = [];
    const incomingList: any[] = Array.isArray(jsonResponse?.recommendations)
      ? jsonResponse.recommendations
      : [];

    for (let i = 0; i < incomingList.length; i++) {
      const rec = incomingList[i];
      if (!rec || !rec.title) continue;

      const recType = rec.type || (canonicalType !== 'any' ? targetTypeDisplay : 'Movie');

      // If strict media type requested, ensure it matches
      if (canonicalType !== 'any' && !isMediaTypeMatch(recType, canonicalType)) {
        // Replace non-matching recommendation with valid fallback pick
        const replacement = fallbackPicks[i] || fallbackPicks[0];
        validatedRecommendations.push(replacement);
      } else {
        validatedRecommendations.push({
          title: rec.title,
          type: canonicalType !== 'any' ? targetTypeDisplay : recType,
          year: String(rec.year || new Date().getFullYear()),
          director: rec.director || 'Editorial Curator',
          abstractScore: Number(rec.abstractScore) || 9,
          summary: rec.summary || 'Editorial recommendation on The Abstract Take.',
          whyWatch: rec.whyWatch || 'Curated pick matching your viewing criteria.',
        });
      }
    }

    // If validated list is empty, supply full fallback pool
    const finalRecommendations =
      validatedRecommendations.length > 0 ? validatedRecommendations : fallbackPicks;

    return NextResponse.json({
      success: true,
      curatorNote:
        jsonResponse?.curatorNote ||
        `Bespoke ${selectedMood.toLowerCase()} selections tailored for your taste profile.`,
      recommendations: finalRecommendations,
      canonicalType,
    });
  } catch (error: any) {
    console.error('Recommend-AI endpoint error:', error);
    return NextResponse.json({
      success: true,
      curatorNote: 'Curated editorial selections from The Abstract Take.',
      recommendations: FALLBACK_MOVIES.default,
    });
  }
}
