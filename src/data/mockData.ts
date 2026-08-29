import { Review, RecommendationList, Comment, AdPlacement, AnalyticsSummary } from '../types';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'review-1',
    slug: 'dune-part-two-2024',
    title: 'Dune: Part Two',
    originalTitle: 'Dune: Part Two',
    type: 'Movie',
    releaseYear: 2024,
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
    runtime: '2h 46m',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop',
    abstractScore: 96,
    myTake: 'A monumental sci-fi tragedy where spectacle never overshadows the terrifying corruptive weight of charismatic prophecy.',
    streamingPlatforms: [
      { name: 'Max', type: 'Subscription', url: 'https://max.com' },
      { name: 'Apple TV', type: 'Rent/Buy' },
      { name: 'Amazon Prime Video', type: 'Rent/Buy' }
    ],
    pros: [
      'Monumental auditory and visual scale that redefines blockbuster filmmaking',
      'Terrifying and nuanced transformation of Paul Atreides into a galactic warlord',
      'Greig Fraser’s infrared monochrome sequence on Giedi Prime is pure cinematic daring',
      'Hans Zimmer’s percussion-driven soundscape rattles through your chest'
    ],
    cons: [
      'Pacing in the third act moves swiftly to compress a massive climax'
    ],
    verdictText: 'Denis Villeneuve pulls off what seemed impossible: an uncompromising, operatic blockbuster that treats Herbert’s warning against charismatic leaders as a tragic certainty rather than heroic wish-fulfillment.',
    shouldYouWatch: 'Must Watch',
    longFormReview: `Most blockbuster sequels merely amplify volume; *Dune: Part Two* amplifies existential dread. Where the 2021 prelude felt like an austere prologue laying down sand and architecture, Part Two plunges straight into the moral abyss of messianic fervor.

What struck me most on repeated viewings is Villeneuve’s refusal to sanitize Paul Atreides. Timothée Chalamet gives a chilling performance that transitions from a frightened royal orphan surviving amongst the Fremen to an apocalyptic fanatic weaponizing religious dogma.

The visual grammar crafted by cinematographer Greig Fraser is jaw-dropping. The gladiatorial arena sequence on Giedi Prime—captured with modified infrared cameras—strips the Harkonnen homeworld of color, leaving an eerie, inverted solar glare that feels completely alien.

This is cinema made with supreme confidence. It doesn't beg for your attention with quippy dialogue or manufactured cliffhangers; it simply commands the space.`,
    spoilerFreeTake: 'If you appreciated the scale of Part One, Part Two delivers on every promise with deeper emotional fractures, staggering sandstorm battles, and a chilling character arc.',
    spoilerSection: `SPOILER ANALYSIS: The ending duel between Paul and Feyd-Rautha is staged not as a triumphant victory, but as an agonizing political necessity. When Paul turns to the Great Houses and demands marriage to Princess Irulan while commanding the Fremen to "lead them to paradise," Zendaya's Chani walking alone into the desert sand encapsulates the true heartbreak of the story: true love discarded for holy war.`,
    favoriteScene: 'Paul addressing the southern Fremen fundamentalists in the sietch temple, shouting with unhinged vocal resonance that he is the Lisan al-Gaib.',
    favoriteQuote: '"This is not power. This is the beginning of a holy war that will sweep across the universe like an unquenchable fire."',
    publishDate: '2026-08-10',
    author: {
      name: 'The Abstract Take',
      title: 'Creator & Film Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    category: 'Movies',
    tags: ['Sci-Fi', 'Denis Villeneuve', 'IMAX', 'Epic', 'Personal Favorites', 'Top 10'],
    viewsCount: 28400,
    likesCount: 3950,
    commentsCount: 94,
    readingTimeMinutes: 6,
    isFeatured: true,
    isLatestTake: true,
    seo: {
      metaTitle: 'Dune: Part Two Review — The Abstract Take',
      metaDescription: 'My personal take and verdict on Denis Villeneuve’s Dune: Part Two. The Abstract Score: 96 Masterpiece.',
      keywords: ['Dune Part 2 Review', 'The Abstract Take', 'Denis Villeneuve', 'Sci-Fi Masterpiece']
    }
  },
  {
    id: 'review-2',
    slug: 'drive-my-car-2021',
    title: 'Drive My Car',
    originalTitle: 'Doraibu mai kā',
    type: 'Movie',
    releaseYear: 2021,
    director: 'Ryusuke Hamaguchi',
    cast: ['Hidetoshi Nishijima', 'Tōko Miura', 'Reika Kirishima', 'Park Yu-rim'],
    runtime: '2h 59m',
    genres: ['Drama', 'Art House'],
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
    abstractScore: 98,
    myTake: 'The red Saab 900 Turbo is cinema’s most sacred confessional booth. An unhurried, breathtaking exploration of grief and unspoken truth.',
    streamingPlatforms: [
      { name: 'Max', type: 'Subscription', url: 'https://max.com' },
      { name: 'Criterion Channel', type: 'Subscription', url: 'https://criterionchannel.com' },
      { name: 'Apple TV', type: 'Rent/Buy' }
    ],
    pros: [
      'Sublime exploration of grief, language, and human vulnerability',
      'Mesmerizing three-hour pacing that feels deeply therapeutic and restorative',
      'Career-defining performance from Hidetoshi Nishijima and Tōko Miura',
      'Multilingual Chekhov rehearsals that reveal communication beyond literal words'
    ],
    cons: [
      'Deliberate rhythm requires complete patience and quiet immersion'
    ],
    verdictText: 'Drive My Car is not merely a film; it is an emotional cleansing ritual. Hamaguchi weaves Murakami’s prose into a cinematic cathedral where grief converts into quiet understanding.',
    shouldYouWatch: 'Must Watch',
    longFormReview: `There is a profound sanctuary in the red 1989 Saab 900 Turbo driven across the coastal expressways of Hiroshima. In Ryusuke Hamaguchi’s masterpiece *Drive My Car*, distance is measured not merely in kilometers, but in the slow peeling back of human defenses.

Yusuke Kafuku (Hidetoshi Nishijima) is a renowned theater director grieving the sudden death of his wife, Oto—a woman whose creative sexual storytelling masked mysterious emotional chasms. When Kafuku travels to Hiroshima to stage a multilingual production of Anton Chekhov’s *Uncle Vanya*, the festival mandates that he be assigned a personal chauffeur: a quiet, taciturn 20-year-old woman named Misaki Watari (Tōko Miura).

What begins as an awkward corporate arrangement slowly transforms into an astonishing dialogue on shame, forgiveness, and art. The multi-lingual theater rehearsals—where actors speak Japanese, Mandarin, Tagalog, and Korean Sign Language without understanding each other’s literal words—mirror the film's core theme: true connection occurs beneath the surface of spoken language.

Visually, Hamaguchi avoids flashy technique, opting instead for immaculate composition, patient static setups, and naturalistic lighting that allows every subtle twitch of emotion to reverberate across the frame. The score by Eiko Ishibashi provides an ethereal, modern jazz pulse that echoes through long highway drives.`,
    spoilerSection: `SPOILER ANALYSIS: The climax on the snow-covered ruins of Misaki’s childhood home in Hokkaido is where both characters confront their respective guilt. Kafuku admits he knew Oto was cheating on him but chose silence out of fear of losing her; Misaki admits she did not attempt to dig her abusive mother out of the mudslide. When Yoon-a executes her silent monologue in Korean Sign Language during the Uncle Vanya performance ("We shall rest..."), it brings Kafuku to tears because it gives him permission to keep living despite irreparable loss.`,
    favoriteScene: 'The extended highway drive where Misaki and Kafuku share cigarettes raised through the open sunroof in complete nocturnal silence.',
    favoriteQuote: '"Those who survive keep thinking about the dead. In one way or another, that will continue. You and I must keep living like that."',
    publishDate: '2026-07-28',
    author: {
      name: 'The Abstract Take',
      title: 'Creator & Film Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    category: 'Movies',
    tags: ['Japanese Cinema', 'A24', 'Murakami', 'Drama', 'Personal Favorites', 'Hidden Gems'],
    viewsCount: 19250,
    likesCount: 2890,
    commentsCount: 52,
    readingTimeMinutes: 7,
    isFeatured: true,
    isEditorPick: true,
    seo: {
      metaTitle: 'Drive My Car Review — The Abstract Take',
      metaDescription: 'My personal take and verdict on Ryusuke Hamaguchi’s Drive My Car. The Abstract Score: 98 Masterpiece.',
      keywords: ['Drive My Car Review', 'Hamaguchi', 'Japanese Cinema', 'The Abstract Take']
    }
  },
  {
    id: 'review-3',
    slug: 'severance-season-1',
    title: 'Severance (Season 1)',
    type: 'Series',
    releaseYear: 2022,
    director: 'Ben Stiller & Aoife McArdle',
    cast: ['Adam Scott', 'Patricia Arquette', 'John Turturro', 'Christopher Walken', 'Britt Lower'],
    runtime: '9 Episodes (~55m each)',
    genres: ['Sci-Fi', 'Thriller', 'Mystery'],
    posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop',
    abstractScore: 94,
    myTake: 'A chilling architectural triumph that turns sterile fluorescent hallways into a brilliant psychological battleground of human identity.',
    streamingPlatforms: [
      { name: 'Apple TV+', type: 'Subscription', url: 'https://tv.apple.com' }
    ],
    pros: [
      'Unmatched production design featuring eerie 1970s corporate minimalism',
      'Career-best performance from Adam Scott balancing two distinct fractured selves',
      'One of the most heart-stopping, relentlessly paced season finales in modern TV history',
      'Sharp, unsettling satire on corporate alienation and manufactured happiness'
    ],
    cons: [
      'Leaves massive mystery hooks waiting for Season 2'
    ],
    verdictText: 'Severance is a triumph of dystopian design and narrative tension. It turns sterile fluorescent corridors into an existential war for consciousness.',
    shouldYouWatch: 'Must Watch',
    longFormReview: `What if you could surgically sever your work memories from your personal life? Lumon Industries promises the ultimate work-life balance through "Severance"—a medical procedure that creates two distinct personalities inside one brain: the "Innie," who exists solely inside Lumon's labyrinthine subterranean office, and the "Outie," who enjoys freedom without any recollection of their workday.

Created by Dan Erickson and directed with icy precision by Ben Stiller, *Severance* constructs a nightmare that feels both absurdly surreal and terrifyingly plausible.

The Macrodata Refinement department—a vast, blindingly white room containing four tiny desks with vintage CRT computers—is an iconic piece of production design. Here, workers spend eight hours dragging floating numbers on screens into buckets labeled by emotions (woe, dread, frolic, malice).

Adam Scott plays Mark Scout, a grieving widower on the outside and a dutiful corporate drone on the inside. When Mark's colleague Helly (Britt Lower) attempts rebellion, the cracks in Lumon's benevolent facade begin to bleed horror.`,
    favoriteScene: 'The Music and Dance Experience (MDE) with waffle party subtext turned surreal psychological horror.',
    favoriteQuote: '"Please enjoy all facts equally."',
    publishDate: '2026-08-01',
    author: {
      name: 'The Abstract Take',
      title: 'Creator & Film Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    category: 'Series',
    tags: ['Sci-Fi', 'Apple TV+', 'Corporate Dystopia', 'Thriller', 'Personal Favorites'],
    viewsCount: 25100,
    likesCount: 3620,
    commentsCount: 88,
    readingTimeMinutes: 6,
    isFeatured: true,
    isEditorPick: true,
    seo: {
      metaTitle: 'Severance Season 1 Review — The Abstract Take',
      metaDescription: 'Personal review and score breakdown of Apple TV+ Severance Season 1 by The Abstract Take.',
      keywords: ['Severance Review', 'Apple TV Plus', 'Adam Scott', 'Sci-Fi Series']
    }
  },
  {
    id: 'review-4',
    slug: 'the-boy-and-the-heron-2023',
    title: 'The Boy and the Heron',
    originalTitle: 'Kimitachi wa Dō Ikiru ka',
    type: 'Anime',
    releaseYear: 2023,
    director: 'Hayao Miyazaki',
    cast: ['Soma Santoki', 'Masaki Suda', 'Aimyon', 'Yoshino Kimura'],
    runtime: '2h 4m',
    genres: ['Anime', 'Fantasy', 'Adventure'],
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
    abstractScore: 95,
    myTake: 'Miyazaki’s rawest, most surreal autobiographical confession—a grandfather handing over the building blocks of a broken world.',
    streamingPlatforms: [
      { name: 'Max', type: 'Subscription' },
      { name: 'Netflix', type: 'Subscription' },
      { name: 'Apple TV', type: 'Rent/Buy' }
    ],
    pros: [
      'Astonishing hand-drawn animation that moves with visceral organic weight',
      'Deeply personal meditation on legacy, maternal loss, and creative inheritance',
      'Joe Hisaishi’s piano score is sparse, aching, and melancholic',
      'Refuses simplified narrative formulas in favor of pure dream logic'
    ],
    cons: [
      'Abstract dream logic may disorient viewers expecting a traditional hero’s journey'
    ],
    verdictText: 'A twilight masterpiece from Studio Ghibli. Miyazaki looks back at a lifetime of artistic creation and asks us: in a world consumed by fire and malice, how will you choose to live?',
    shouldYouWatch: 'Must Watch',
    longFormReview: `*The Boy and the Heron* is not designed to comfort you. Unlike *My Neighbor Totoro* or *Kiki’s Delivery Service*, Miyazaki’s final bow is soaked in the soot of war, bird excrement, self-inflicted head wounds, and the terrifying realization that our worlds are built on unstable wooden blocks.

Young Mahito moves to the countryside after losing his mother in a Tokyo hospital bombing during World War II. Haunted by grief and alienated by his father's new marriage, he is lured into a collapsing stone tower by a grotesque Gray Heron with human teeth.

What follows is an uncompromising journey through the underworld. Hand-drawn parakeets brandish meat cleavers; pelicans starve in polluted oceans; miniature souls (Warawara) drift skyward to be born.

This is pure cinema free from commercial pandering. A master artist at 82 speaking directly to the future with honesty and fierce compassion.`,
    favoriteScene: 'The Granduncle offering Mahito 13 unblemished stones to build a peaceful world, and Mahito pointing to his self-inflicted scar to admit he is tainted by malice.',
    favoriteQuote: '"I must return to my own world, even if it is full of fire and sorrow."',
    publishDate: '2026-08-05',
    author: {
      name: 'The Abstract Take',
      title: 'Creator & Film Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    category: 'Anime',
    tags: ['Ghibli', 'Miyazaki', 'Anime Masterpiece', 'Personal Favorites', 'Top 10'],
    viewsCount: 21800,
    likesCount: 3100,
    commentsCount: 67,
    readingTimeMinutes: 5,
    isFeatured: true,
    isEditorPick: true,
    seo: {
      metaTitle: 'The Boy and the Heron Review — The Abstract Take',
      metaDescription: 'My personal take and verdict on Hayao Miyazaki’s The Boy and the Heron. The Abstract Score: 95 Masterpiece.',
      keywords: ['The Boy and the Heron Review', 'Miyazaki', 'Studio Ghibli', 'Anime Review']
    }
  },
  {
    id: 'review-5',
    slug: 'past-lives-2023',
    title: 'Past Lives',
    type: 'Movie',
    releaseYear: 2023,
    director: 'Celine Song',
    cast: ['Greta Lee', 'Teo Yoo', 'John Magaro'],
    runtime: '1h 45m',
    genres: ['Romance', 'Drama'],
    posterUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop',
    abstractScore: 92,
    myTake: 'A tender, emotionally mature look at the ghostly alternate lives we leave behind with every choice we make.',
    streamingPlatforms: [
      { name: 'Paramount+ with Showtime', type: 'Subscription' },
      { name: 'VOD', type: 'Rent/Buy' }
    ],
    pros: [
      'Devastating emotional honesty without cheap Hollywood melodrama',
      'Greta Lee delivers a luminous, quietly powerhouse performance',
      'Explores the Korean concept of In-Yun (destiny/fate) with gentle grace',
      'The final long-take walking sequence is an instant modern classic'
    ],
    cons: [
      'Will leave your chest aching for days afterwards'
    ],
    verdictText: 'Celine Song’s debut feature is a delicate, aching miracle. It honors the lives we did not choose while remaining deeply tender to the life we inhabit.',
    shouldYouWatch: 'Must Watch',
    longFormReview: `Nora and Hae Sung were childhood sweethearts in Seoul before Nora’s family emigrated to Toronto. Twelve years later, they reconnect over Skype; another twelve years later, Hae Sung visits Nora in New York City, where she is now married to Arthur, an American writer.

What could easily have become a messy romantic triangle instead becomes something infinitely richer: a meditation on time, identity, migration, and the ghostly versions of ourselves we leave behind in alternate choices.

Celine Song directs with extraordinary restraint. Camera angles capture the physical distance between bodies, the reflections in rain-soaked street pavement, and the subtle shift in glance when two people realize that love is not always a reason to abandon a path.`,
    favoriteScene: 'The three-way bar conversation in New York where Arthur listens while Nora and Hae Sung speak in Korean across two decades of distance.',
    favoriteQuote: '"If you leave something behind, you gain something too."',
    publishDate: '2026-07-20',
    author: {
      name: 'The Abstract Take',
      title: 'Creator & Film Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    category: 'Movies',
    tags: ['A24', 'Romance', 'Drama', 'Celine Song', 'Oscar Nominated'],
    viewsCount: 18400,
    likesCount: 2450,
    commentsCount: 56,
    readingTimeMinutes: 5,
    isEditorPick: true,
    seo: {
      metaTitle: 'Past Lives Review — The Abstract Take',
      metaDescription: 'Detailed critique of Celine Song’s Past Lives. Examining In-Yun, memory, and emotional maturity in modern cinema.',
      keywords: ['Past Lives Review', 'A24', 'Greta Lee', 'Celine Song']
    }
  },
  {
    id: 'review-6',
    slug: 'perfect-days-2023',
    title: 'Perfect Days',
    type: 'Movie',
    releaseYear: 2023,
    director: 'Wim Wenders',
    cast: ['Koji Yakusho', 'Arisa Nakano', 'Tokio Emoto'],
    runtime: '2h 4m',
    genres: ['Drama', 'Slice of Life'],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop',
    abstractScore: 91,
    myTake: 'An antidote to digital hustle culture. Koji Yakusho turns daily routine into pure spiritual architecture.',
    streamingPlatforms: [
      { name: 'Hulu', type: 'Subscription' },
      { name: 'Criterion Channel', type: 'Subscription' }
    ],
    pros: [
      'Koji Yakusho delivers a masterclass in quiet presence and joy',
      'Transforms Tokyo public toilets into architectural poetry',
      'Incredible analogue soundtrack (Lou Reed, Nina Simone, Patti Smith)',
      'A true antidote to modern digital burnout'
    ],
    cons: [
      'Minimal plot structure—functions as a daily rhythm meditation'
    ],
    verdictText: 'Wim Wenders and Koji Yakusho craft a soulful hymn to presence, music, and the beauty of analog living amidst modern noise.',
    shouldYouWatch: 'Must Watch',
    longFormReview: `Hirayama (Koji Yakusho) cleans Tokyo's public toilets with obsessive pride and joyful dignity. His days follow an unhurried, sacred routine: waking to the sound of street sweepers, tending to his bonsai trees, sipping canned coffee, listening to Lou Reed cassette tapes in his van, taking analog black-and-white photos of tree sunlight (komorebi), and bathing at the neighborhood public bathhouse.

*Perfect Days* is an exquisite reminder that contentment is an intentional practice. Yakusho barely speaks 50 words in the entire film, yet his face communicates worlds of gratitude, melancholy, and grace.`,
    favoriteScene: 'The final driving shot where Koji Yakusho listens to Nina Simone’s "Feeling Good" while tears and smiles battle across his face.',
    favoriteQuote: '"Next time is next time. Now is now."',
    publishDate: '2026-07-15',
    author: {
      name: 'The Abstract Take',
      title: 'Creator & Film Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    category: 'Movies',
    tags: ['Japanese Cinema', 'Wim Wenders', 'Hidden Gems', 'Slice of Life'],
    viewsCount: 14200,
    likesCount: 1940,
    commentsCount: 39,
    readingTimeMinutes: 5,
    isHiddenGem: true,
    seo: {
      metaTitle: 'Perfect Days Review — The Abstract Take',
      metaDescription: 'An editorial review of Wim Wenders’ Perfect Days starring Koji Yakusho. Finding extraordinary peace in daily Tokyo life.',
      keywords: ['Perfect Days Review', 'Koji Yakusho', 'Wim Wenders', 'Tokyo Cinema']
    }
  }
];

export const INITIAL_RECOMMENDATION_LISTS: RecommendationList[] = [
  {
    id: 'list-1',
    slug: 'contemplative-masterpieces-to-heal',
    title: 'Contemplative Masterpieces to Heal Your Busy Mind',
    subtitle: 'Cinema as sanctuary: Slow, immersive, visually breathtaking films that slow down time.',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    category: 'Hidden Gems',
    description: 'In an era dominated by hyper-active algorithms and 15-second social media clips, these films stand as quiet acts of resistance. They demand your presence and reward you with peace.',
    curatorName: 'The Abstract Take',
    updatedDate: '2026-08-12',
    readsCount: 14940,
    isFeatured: true,
    items: [
      {
        id: 'rec-1',
        reviewId: 'review-2',
        title: 'Drive My Car (2021)',
        type: 'Movie',
        year: 2021,
        director: 'Ryusuke Hamaguchi',
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
        abstractScore: 98,
        curatorNote: 'The ultimate sanctuary film. Let the three hours sweep over you inside the red Saab.',
        whereToWatch: 'Max / Criterion Channel'
      },
      {
        id: 'rec-2',
        reviewId: 'review-6',
        title: 'Perfect Days (2023)',
        type: 'Movie',
        year: 2023,
        director: 'Wim Wenders',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
        abstractScore: 91,
        curatorNote: 'An antidote to burnout. Teaches you to find joy in morning sunlight filtering through trees.',
        whereToWatch: 'Hulu'
      },
      {
        id: 'rec-3',
        title: 'First Cow (2019)',
        type: 'Movie',
        year: 2019,
        director: 'Kelly Reichardt',
        posterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
        abstractScore: 89,
        curatorNote: 'A gentle, poetic tale of male friendship and baking oily cakes in 19th-century Oregon.',
        whereToWatch: 'Kanopy / VOD'
      }
    ]
  },
  {
    id: 'list-2',
    slug: 'what-to-watch-after-severance',
    title: 'What to Watch Next: If You Loved Severance & Ex Machina',
    subtitle: 'Neo-dystopian workplace paranoia, clean architectural aesthetics, and existential sci-fi.',
    coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    category: 'What To Watch Next',
    description: 'Loved the sterile fluorescent terror of Lumon Industries? Here is my curated sequence of psychological sci-fi films and series that explore identity, corporate horror, and artificial consciousness.',
    curatorName: 'The Abstract Take',
    updatedDate: '2026-08-14',
    readsCount: 18400,
    isFeatured: true,
    items: [
      {
        id: 'rec-4',
        reviewId: 'review-3',
        title: 'Severance (Season 1)',
        type: 'Series',
        year: 2022,
        director: 'Ben Stiller',
        posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
        abstractScore: 94,
        curatorNote: 'Start here. The pinnacle of modern dystopian television design.',
        whereToWatch: 'Apple TV+'
      },
      {
        id: 'rec-5',
        title: 'Gattaca (1997)',
        type: 'Movie',
        year: 1997,
        director: 'Andrew Niccol',
        posterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop',
        abstractScore: 93,
        curatorNote: 'Pristine retro-futuristic architecture meets genetic determinism and unbreakable human will.',
        whereToWatch: 'VOD / Prime'
      },
      {
        id: 'rec-6',
        title: 'Devs (Mini Series)',
        type: 'Mini Series',
        year: 2020,
        director: 'Alex Garland',
        posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
        abstractScore: 90,
        curatorNote: 'Silicon Valley quantum determinism wrapped in monumental golden art installation design.',
        whereToWatch: 'Hulu'
      }
    ]
  },
  {
    id: 'list-3',
    slug: 'essential-autumn-melancholy-cinema',
    title: 'Essential Autumn Cinema: Melancholy & Warmth',
    subtitle: 'Plaid coats, rain-slicked pavement, jazz scores, and introspective conversations.',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    category: 'Weekend Watchlists',
    description: 'Handpicked titles for cool evenings, hot tea, and quiet reflection. Films that wrap around you like a heavy wool sweater.',
    curatorName: 'The Abstract Take',
    updatedDate: '2026-08-08',
    readsCount: 11200,
    isFeatured: false,
    items: [
      {
        id: 'rec-7',
        reviewId: 'review-5',
        title: 'Past Lives (2023)',
        type: 'Movie',
        year: 2023,
        director: 'Celine Song',
        posterUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
        abstractScore: 92,
        curatorNote: 'Walking through rainy NYC streets with your past self.',
        whereToWatch: 'Paramount+ / VOD'
      },
      {
        id: 'rec-8',
        title: 'Dead Poets Society (1989)',
        type: 'Movie',
        year: 1989,
        director: 'Peter Weir',
        posterUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop',
        abstractScore: 91,
        curatorNote: 'The ultimate dark academia autumn classic.',
        whereToWatch: 'Prime Video'
      }
    ]
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    reviewId: 'review-1',
    userName: 'Kaelen Vance',
    content: 'The point about Paul weaponizing religious prophecy instead of being a traditional hero is spot on. That infrared Giedi Prime sequence was mind-bending in IMAX!',
    createdAt: '2026-08-11T14:22:00Z',
    likes: 42,
    status: 'approved'
  },
  {
    id: 'comment-2',
    reviewId: 'review-2',
    userName: 'Elena Rostova',
    content: 'The scene in the car where they share a cigarette through the sunroof broke something open inside me. Exceptional personal critique!',
    createdAt: '2026-07-29T14:22:00Z',
    likes: 28,
    status: 'approved'
  }
];

export const INITIAL_AD_PLACEMENTS: AdPlacement[] = [
  {
    id: 'ad-1',
    title: 'The Abstract Dispatch Newsletter',
    type: 'Newsletter Box',
    slotPosition: 'Header',
    isActive: true
  },
  {
    id: 'ad-2',
    title: 'MUBI 30-Day Free Trial Referral',
    type: 'Affiliate Box',
    slotPosition: 'Mid-Article',
    codeOrUrl: 'https://mubi.com',
    isActive: true
  },
  {
    id: 'ad-3',
    title: 'Support The Abstract Take on Buy Me A Coffee',
    type: 'Buy Me Coffee',
    slotPosition: 'Sidebar',
    codeOrUrl: 'https://buymeacoffee.com',
    isActive: true
  }
];

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalViews: 118320,
  totalReviews: 54,
  totalRecommendations: 24,
  avgAbstractScore: 93,
  newsletterSubscribers: 4890,
  monthlyGrowthPercent: 24.6
};
