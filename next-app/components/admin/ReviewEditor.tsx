'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Review,
  MediaType,
  WatchVerdict,
  ReviewStatus,
  StreamingPlatform,
  MediaSearchResult,
  EditorialDraftResult,
} from '@/types';
import {
  RATING_SCALE,
  normalizeScore,
  getQualityLabel,
  getScoreMeaning,
  getRatingColorClasses,
} from '@/lib/utils/rating';
import { ReviewLivePreviewModal } from './ReviewLivePreviewModal';
import { EditorialAssistantModal } from './EditorialAssistantModal';
import {
  Search,
  Sparkles,
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  HelpCircle,
  Check,
  AlertCircle,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  List,
  ListOrdered,
  AlertTriangle,
  Globe,
  Calendar,
  Layers,
  Film,
  Loader2,
  Tv,
  Image as ImageIcon,
  Info,
} from 'lucide-react';

interface ReviewEditorProps {
  initialReview?: Review | null;
  availableTags?: string[];
}

export function ReviewEditor({
  initialReview,
  availableTags = [
    'Masterpiece',
    'Must Watch',
    'Personal Favorites',
    'Cinema',
    'Auteur',
    'Sci-Fi',
    'Indie',
    'Essential',
  ],
}: ReviewEditorProps) {
  const router = useRouter();

  // File input refs for image management
  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Core Media Metadata
  const [title, setTitle] = useState(initialReview?.title || '');
  const [originalTitle, setOriginalTitle] = useState(initialReview?.originalTitle || '');
  const [type, setType] = useState<MediaType>(initialReview?.type || 'Movie');
  const [status, setStatus] = useState<ReviewStatus>(initialReview?.status || 'draft');
  const [scheduledDate, setScheduledDate] = useState(initialReview?.scheduledDate || '');
  const [releaseYear, setReleaseYear] = useState<number>(
    initialReview?.releaseYear || new Date().getFullYear()
  );
  const [director, setDirector] = useState(initialReview?.director || '');
  const [castInput, setCastInput] = useState(initialReview?.cast?.join(', ') || '');
  const [runtime, setRuntime] = useState(initialReview?.runtime || '2h 00m');
  const [genresInput, setGenresInput] = useState(
    initialReview?.genres?.join(', ') || 'Drama, Cinema'
  );
  const [synopsis, setSynopsis] = useState(initialReview?.synopsis || '');
  const [language, setLanguage] = useState(initialReview?.language || '');
  const [country, setCountry] = useState(initialReview?.country || '');
  const [posterUrl, setPosterUrl] = useState(
    initialReview?.posterUrl ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop'
  );
  const [bannerUrl, setBannerUrl] = useState(
    initialReview?.bannerUrl ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop'
  );
  const [trailerUrl, setTrailerUrl] = useState(initialReview?.trailerUrl || '');

  // Editorial Opinion State
  const [abstractScore, setAbstractScore] = useState<number>(() =>
    normalizeScore(initialReview?.abstractScore ?? 9)
  );
  const [myTake, setMyTake] = useState(initialReview?.myTake || '');
  const [longFormReview, setLongFormReview] = useState(initialReview?.longFormReview || '');
  const [pros, setPros] = useState<string[]>(
    initialReview?.pros?.length ? initialReview.pros : ['']
  );
  const [cons, setCons] = useState<string[]>(
    initialReview?.cons?.length ? initialReview.cons : ['']
  );
  const [verdictText, setVerdictText] = useState(initialReview?.verdictText || '');
  const [shouldYouWatch, setShouldYouWatch] = useState<WatchVerdict>(
    initialReview?.shouldYouWatch || 'Must Watch'
  );
  const [spoilerFreeTake, setSpoilerFreeTake] = useState(
    initialReview?.spoilerFreeTake || ''
  );
  const [spoilerSection, setSpoilerSection] = useState(
    initialReview?.spoilerSection || ''
  );
  const [favoriteScene, setFavoriteScene] = useState(
    initialReview?.favoriteScene || ''
  );
  const [favoriteQuote, setFavoriteQuote] = useState(
    initialReview?.favoriteQuote || ''
  );

  // Taxonomy & Streaming
  const [category, setCategory] = useState(initialReview?.category || 'Movies');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialReview?.tags || ['Must Watch', 'Personal Favorites']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [streamingPlatforms, setStreamingPlatforms] = useState<StreamingPlatform[]>(
    initialReview?.streamingPlatforms?.length
      ? initialReview.streamingPlatforms
      : [
          { name: 'Max', type: 'Subscription', url: 'https://max.com' },
          { name: 'Apple TV', type: 'Rent/Buy' },
        ]
  );

  // Flags
  const [isFeatured, setIsFeatured] = useState<boolean>(
    initialReview?.isFeatured || false
  );
  const [isLatestTake, setIsLatestTake] = useState<boolean>(
    initialReview?.isLatestTake || false
  );
  const [isEditorPick, setIsEditorPick] = useState<boolean>(
    initialReview?.isEditorPick || false
  );
  const [isHiddenGem, setIsHiddenGem] = useState<boolean>(
    initialReview?.isHiddenGem || false
  );

  // SEO
  const [slug, setSlug] = useState(initialReview?.slug || '');
  const [metaTitle, setMetaTitle] = useState(initialReview?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(
    initialReview?.seo?.metaDescription || ''
  );
  const [keywordsInput, setKeywordsInput] = useState(
    initialReview?.seo?.keywords?.join(', ') || ''
  );
  const [ogImage, setOgImage] = useState(initialReview?.seo?.ogImage || '');
  const [noIndex, setNoIndex] = useState(initialReview?.seo?.noIndex || false);

  // UI Flow States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([]);
  const [searchProvider, setSearchProvider] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditorialAssistantOpen, setIsEditorialAssistantOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI Editorial Assistant Apply Handler
  const handleApplyEditorialDraft = (draft: EditorialDraftResult) => {
    if (draft.myTakeHook || draft.thesis) setMyTake(draft.myTakeHook || draft.thesis || '');
    if (draft.editorialReview || draft.longFormReview)
      setLongFormReview(draft.editorialReview || draft.longFormReview || '');
    if (draft.pros && draft.pros.length > 0) setPros(draft.pros);
    if (draft.cons && draft.cons.length > 0) setCons(draft.cons);
    if (draft.verdictText) setVerdictText(draft.verdictText);
    if (draft.shouldYouWatch) setShouldYouWatch(draft.shouldYouWatch as WatchVerdict);
    if (draft.spoilerFreeTake) setSpoilerFreeTake(draft.spoilerFreeTake);
    if (draft.abstractScore) setAbstractScore(normalizeScore(draft.abstractScore));
  };

  // Media Search Handler (Queries backend provider hierarchy)
  const handleMediaSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingMedia(true);
    try {
      const res = await fetch(
        `/api/media/search?q=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(type)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        if (data.provider) setSearchProvider(data.provider);
        if (data.status) setSearchStatus(data.status);
      }
    } catch (err: any) {
      console.error('Media search error:', err);
    } finally {
      setIsSearchingMedia(false);
    }
  };

  // Import Metadata from Search / AI (Safe: option to fill missing fields or overwrite)
  const handleImportMetadata = (item: MediaSearchResult, fillMissingOnly = false) => {
    if (!fillMissingOnly || !title) setTitle(item.title);
    if (!fillMissingOnly || !originalTitle) {
      if (item.originalTitle) setOriginalTitle(item.originalTitle);
    }
    if (!fillMissingOnly || !type) setType(item.type);
    if (!fillMissingOnly || !releaseYear)
      setReleaseYear(item.releaseYear || new Date().getFullYear());
    if (!fillMissingOnly || !director) {
      if (item.director) setDirector(item.director);
    }
    if (!fillMissingOnly || !castInput) {
      if (item.cast?.length) setCastInput(item.cast.join(', '));
    }
    if (!fillMissingOnly || !runtime) {
      if (item.runtime) setRuntime(item.runtime);
    }
    if (!fillMissingOnly || !genresInput) {
      if (item.genres?.length) setGenresInput(item.genres.join(', '));
    }
    if (!fillMissingOnly || !synopsis) {
      if (item.synopsis) setSynopsis(item.synopsis);
    }
    if (!fillMissingOnly || !posterUrl) {
      if (item.posterUrl) setPosterUrl(item.posterUrl);
    }
    if (!fillMissingOnly || !bannerUrl) {
      if (item.bannerUrl) setBannerUrl(item.bannerUrl);
    }
    if (!fillMissingOnly || !trailerUrl) {
      if (item.trailerUrl) setTrailerUrl(item.trailerUrl);
    }
    if (!fillMissingOnly || !language) {
      if (item.language) setLanguage(item.language);
    }
    if (!fillMissingOnly || !country) {
      if (item.country) setCountry(item.country);
    }

    // Auto-generate slug & SEO if not set
    if (!slug) {
      const generatedSlug =
        item.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') + `-${item.releaseYear || new Date().getFullYear()}`;
      setSlug(generatedSlug);
    }
    if (!metaTitle) {
      setMetaTitle(
        `${item.title} (${item.releaseYear || new Date().getFullYear()}) Review — The Abstract Take`
      );
    }
    if (!metaDescription) {
      setMetaDescription(
        item.synopsis || `Personal review and Abstract Score breakdown of ${item.title}.`
      );
    }
    if (!keywordsInput) {
      setKeywordsInput(
        `${item.title} Review, ${item.director || 'Cinema'}, The Abstract Take, ${item.type} Review`
      );
    }

    setSearchResults([]);
  };

  // Auto-generate SEO Defaults
  const handleAutoGenerateSeo = () => {
    const cleanTitle = title || 'Cinema Review';
    const cleanYear = releaseYear || new Date().getFullYear();
    const generatedSlug =
      cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${cleanYear}`;
    const cleanScore = normalizeScore(abstractScore);
    const scoreDescriptor = getQualityLabel(cleanScore);
    setSlug(generatedSlug);
    setMetaTitle(`${cleanTitle} (${cleanYear}) Review — The Abstract Take`);
    setMetaDescription(
      myTake
        ? `"${myTake.slice(0, 140)}..." The Abstract Score: ${cleanScore}/10 (${scoreDescriptor}).`
        : `The Abstract Take's personal review and score of ${cleanTitle}.`
    );
    setKeywordsInput(
      `${cleanTitle} review, ${director}, ${type} review, The Abstract Take, Abstract Score ${cleanScore}, ${scoreDescriptor}`
    );
    setOgImage(bannerUrl || posterUrl);
  };

  // Insert Rich Text Formatting
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById(
      'longFormReviewInput'
    ) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = longFormReview;
    const selected = currentText.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const updated =
      currentText.substring(0, start) + replacement + currentText.substring(end);
    setLongFormReview(updated);
  };

  // File Upload to Cloudinary
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'poster' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });
        if (res.ok) {
          const result = await res.json();
          if (target === 'poster') setPosterUrl(result.url);
          if (target === 'banner') setBannerUrl(result.url);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload failed:', err);
      setIsUploading(false);
    }
  };

  // Pros & Cons helpers
  const handleAddPro = () => setPros([...pros, '']);
  const handleUpdatePro = (index: number, val: string) => {
    const updated = [...pros];
    updated[index] = val;
    setPros(updated);
  };
  const handleRemovePro = (index: number) =>
    setPros(pros.filter((_, i) => i !== index));

  const handleAddCon = () => setCons([...cons, '']);
  const handleUpdateCon = (index: number, val: string) => {
    const updated = [...cons];
    updated[index] = val;
    setCons(updated);
  };
  const handleRemoveCon = (index: number) =>
    setCons(cons.filter((_, i) => i !== index));

  // Tag helper
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  // Streaming platform helpers
  const handleAddPlatform = () => {
    setStreamingPlatforms([
      ...streamingPlatforms,
      { name: '', type: 'Subscription', url: '' },
    ]);
  };
  const handleUpdatePlatform = (
    index: number,
    field: keyof StreamingPlatform,
    value: any
  ) => {
    const updated = [...streamingPlatforms];
    updated[index] = { ...updated[index], [field]: value };
    setStreamingPlatforms(updated);
  };
  const handleRemovePlatform = (index: number) => {
    setStreamingPlatforms(streamingPlatforms.filter((_, i) => i !== index));
  };

  // Assemble Review Object for Save / Preview
  const assembleReview = (): Review => {
    const castArray = castInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const genresArray = genresInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    const keywordsArray = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const readingTime = Math.max(
      2,
      Math.ceil((longFormReview.split(/\s+/).length || 100) / 180)
    );

    return {
      id: initialReview?.id || `review-${Date.now()}`,
      slug:
        slug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      title: title.trim(),
      originalTitle: originalTitle.trim() || undefined,
      type,
      status,
      scheduledDate: status === 'scheduled' ? scheduledDate : undefined,
      releaseYear: Number(releaseYear) || new Date().getFullYear(),
      director: director.trim(),
      cast: castArray,
      runtime: runtime.trim() || '2h 00m',
      genres: genresArray.length ? genresArray : ['Cinema'],
      synopsis: synopsis.trim(),
      language: language.trim() || undefined,
      country: country.trim() || undefined,
      posterUrl: posterUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      trailerUrl: trailerUrl.trim() || undefined,
      abstractScore: normalizeScore(abstractScore),
      myTake: myTake.trim(),
      pros: pros.filter(Boolean),
      cons: cons.filter(Boolean),
      verdictText: verdictText.trim(),
      shouldYouWatch,
      longFormReview: longFormReview.trim(),
      spoilerFreeTake: spoilerFreeTake.trim() || undefined,
      spoilerSection: spoilerSection.trim() || undefined,
      favoriteScene: favoriteScene.trim(),
      favoriteQuote: favoriteQuote.trim(),
      publishDate:
        initialReview?.publishDate || new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      author: initialReview?.author || {
        name: 'The Abstract Take',
        title: 'Creator & Film Critic',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      },
      category: category.trim() || 'Movies',
      tags: selectedTags,
      viewsCount: initialReview?.viewsCount || 0,
      likesCount: initialReview?.likesCount || 0,
      commentsCount: initialReview?.commentsCount || 0,
      readingTimeMinutes: readingTime,
      isFeatured,
      isLatestTake,
      isEditorPick,
      isHiddenGem,
      streamingPlatforms: streamingPlatforms.filter((p) => p.name.trim()),
      seo: {
        metaTitle: metaTitle.trim() || `${title} Review — The Abstract Take`,
        metaDescription: metaDescription.trim() || myTake || `${title} review`,
        keywords: keywordsArray,
        slug: slug.trim(),
        ogImage: ogImage.trim() || bannerUrl,
        noIndex,
      },
    };
  };

  const handleSave = async (intendedStatus?: ReviewStatus) => {
    if (!title.trim()) {
      setSaveError('Please provide a title for the review.');
      return;
    }
    if (!longFormReview.trim()) {
      setSaveError('Please write the long-form review analysis.');
      return;
    }
    if (!myTake.trim()) {
      setSaveError('Please provide "My Take" (the creator\'s personal thesis).');
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const reviewObj = assembleReview();
      if (intendedStatus) {
        reviewObj.status = intendedStatus;
      }

      const isUpdate = Boolean(initialReview?.id);
      const url = isUpdate
        ? `/api/reviews/${initialReview!.id}`
        : '/api/reviews';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewObj),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || 'Failed to save review');
      }

      router.push('/admin/reviews');
      router.refresh();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentScoreNorm = normalizeScore(abstractScore);
  const scoreColors = getRatingColorClasses(currentScoreNorm);
  const scoreLabel = getQualityLabel(currentScoreNorm);

  return (
    <div className="space-y-6 pb-20 text-gray-900">
      {/* Top Sticky Header */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-sm sticky top-4 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/reviews"
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif font-black text-lg sm:text-xl text-gray-900">
              {initialReview ? `Editing "${initialReview.title}"` : 'New Editorial Critique'}
            </h1>
            <p className="text-xs font-mono text-gray-500">
              Strict 1–10 Abstract Scale · Creator-First Authority
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Assistant Trigger */}
          <button
            type="button"
            onClick={() => setIsEditorialAssistantOpen(true)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-mono font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Editorial Assistant</span>
          </button>

          {/* Live Preview Trigger */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-mono rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#008CFF]" />
            <span>Live Preview</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-mono font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Save Draft
          </button>

          {/* Publish / Schedule */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(status === 'scheduled' ? 'scheduled' : 'published')}
            className="px-5 py-2 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{status === 'scheduled' ? 'Schedule Take' : 'Publish Critique'}</span>
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-bold">Validation Error</p>
            <p className="mt-0.5 text-red-600">{saveError}</p>
          </div>
        </div>
      )}

      {/* Main Grid: 2-Column Desktop View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Content & Critique */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Media Search & Quick Import (Optional Assistant) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-black text-sm text-gray-900 flex items-center space-x-2">
                <Search className="w-4 h-4 text-[#008CFF]" />
                <span>Search & Suggest Metadata (Optional)</span>
              </h3>
              <span className="text-[10px] font-mono text-gray-400">
                {searchProvider === 'gemini'
                  ? 'Gemini AI Assistant'
                  : searchProvider === 'tmdb'
                  ? 'TMDB Provider'
                  : 'Manual / AI Suggestion'}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              Primary workflow is direct manual entry below. Optionally search titles to auto-suggest
              posters, cast, runtime, and synopses with Gemini AI.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMediaSearch()}
                  placeholder="Search film title (e.g. Dune: Part Two, Oppenheimer, Severance)..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleMediaSearch}
                disabled={isSearchingMedia}
                className="px-4 py-2 bg-gray-900 text-white font-mono text-xs font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSearchingMedia ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                <div className="p-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
                  <span className="font-mono">
                    Found {searchResults.length} suggestion(s) via{' '}
                    <strong>{searchProvider === 'gemini' ? 'Gemini AI' : searchProvider || 'Engine'}</strong>
                  </span>
                  <span className="text-gray-500 text-[10px]">Review before applying</span>
                </div>

                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {item.title} ({item.releaseYear})
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.director || 'Director'} · {item.type}
                          {item.runtime ? ` · ${item.runtime}` : ''}
                        </p>
                        {item.synopsis && (
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                            {item.synopsis}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleImportMetadata(item, true)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                        title="Only fills inputs that are currently empty"
                      >
                        Fill Missing Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImportMetadata(item, false)}
                        className="px-3 py-1 bg-blue-50 hover:bg-[#008CFF] text-[#008CFF] hover:text-white border border-blue-200 hover:border-transparent text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Import All
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Core Media Metadata & Abstract Score (First-Party Authority) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-black text-sm text-gray-900 flex items-center space-x-2">
                <Film className="w-4 h-4 text-[#008CFF]" />
                <span>Project Details & Authoritative Score</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                First-Party Editorial Authority
              </span>
            </div>

            {/* Title & Original Title & Release Year */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Past Lives"
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 font-bold focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Original Title (Foreign)
                </label>
                <input
                  type="text"
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  placeholder="e.g. Doraibu mai kā"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Release Year *
                </label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Media Type & Director & Runtime */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Format / Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MediaType)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none cursor-pointer"
                >
                  <option value="Movie">Movie</option>
                  <option value="Series">TV Series</option>
                  <option value="Mini Series">Mini Series</option>
                  <option value="Anime">Anime</option>
                  <option value="Documentary">Documentary</option>
                  <option value="Special">Special</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Director(s) / Creator
                </label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  placeholder="e.g. Celine Song"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Runtime / Length
                </label>
                <input
                  type="text"
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  placeholder="e.g. 1h 46m or 8 eps (~50m each)"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Cast & Genres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Lead Cast (Comma-separated)
                </label>
                <input
                  type="text"
                  value={castInput}
                  onChange={(e) => setCastInput(e.target.value)}
                  placeholder="e.g. Greta Lee, Teo Yoo, John Magaro"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Genres (Comma-separated)
                </label>
                <input
                  type="text"
                  value={genresInput}
                  onChange={(e) => setGenresInput(e.target.value)}
                  placeholder="e.g. Drama, Romance, Cinema"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Country & Language & Trailer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States, South Korea"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Spoken Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English, Korean"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Trailer Link / Video URL
                </label>
                <input
                  type="text"
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Short Synopsis */}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                Editorial Synopsis (Short Overview)
              </label>
              <textarea
                rows={2}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="A neutral 2-3 sentence overview of the premise..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
              />
            </div>

            {/* Authoritative 1–10 Abstract Score Selector */}
            <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-900 font-black">
                    Authoritative Abstract Score (Strict 1–10 Scale) *
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Never fractional or out of 100. Determines site-wide verdict and ranking.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${scoreColors.badgeBg} ${scoreColors.badgeText} ${scoreColors.border}`}
                  >
                    {scoreLabel.toUpperCase()}
                  </span>
                  <div
                    className={`px-3 py-1 ${scoreColors.bg} ${scoreColors.text} rounded-xl font-serif font-black text-lg shadow-xs`}
                  >
                    {currentScoreNorm}/10
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {RATING_SCALE.map((s) => {
                  const isSelected = currentScoreNorm === s.score;
                  const itemColors = getRatingColorClasses(s.score);
                  return (
                    <button
                      key={s.score}
                      type="button"
                      onClick={() => setAbstractScore(s.score)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? `${itemColors.bg} ${itemColors.text} font-black shadow-sm scale-105 border-transparent`
                          : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200 text-xs font-bold'
                      }`}
                    >
                      <div className="text-xs font-mono">{s.score}</div>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-gray-600 italic bg-white p-2.5 rounded-xl border border-gray-200/70 flex items-center justify-between">
                <span>"{getScoreMeaning(currentScoreNorm)}"</span>
                <span className="text-[10px] font-mono text-gray-400 uppercase">
                  Official Editorial Standard
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: "My Take" (Creator Thesis Hook) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <label className="block text-xs font-mono uppercase text-gray-900 font-black">
                My Take (Creator Thesis Hook) *
              </label>
              <span className="text-[10px] font-mono text-gray-400">1–2 sentences</span>
            </div>
            <textarea
              rows={2}
              value={myTake}
              onChange={(e) => setMyTake(e.target.value)}
              placeholder="e.g. A delicate and achingly resonant portrait of choices, longing, and spiritual reconnection."
              required
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-serif font-bold text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
            />
          </div>

          {/* Section 4: Full Long-Form Review Analysis with Markdown Toolbar */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <label className="block text-xs font-mono uppercase text-gray-900 font-black">
                Full Long-Form Editorial Critique *
              </label>
              <span className="text-[10px] font-mono text-gray-400">
                {longFormReview.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {/* Markdown Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">
              <button
                type="button"
                onClick={() => insertFormatting('## ', '\n')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ', '\n')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '\n')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Blockquote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ', '\n')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('1. ', '\n')}
                className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>

            <textarea
              id="longFormReviewInput"
              rows={12}
              value={longFormReview}
              onChange={(e) => setLongFormReview(e.target.value)}
              placeholder="Write your comprehensive critical analysis here. Discuss themes, craft, acting, cinematography, pacing, and philosophical questions..."
              required
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-serif text-gray-900 leading-relaxed focus:bg-white focus:border-[#008CFF] focus:outline-none"
            />
          </div>

          {/* Section 5: Pros & Cons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pros */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <label className="block text-xs font-mono uppercase text-emerald-800 font-bold">
                  What Worked (Key Highlights)
                </label>
                <button
                  type="button"
                  onClick={handleAddPro}
                  className="text-xs font-mono text-emerald-600 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Point</span>
                </button>
              </div>

              <div className="space-y-2">
                {pros.map((pro, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={pro}
                      onChange={(e) => handleUpdatePro(index, e.target.value)}
                      placeholder="e.g. Masterful sound design"
                      className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                    {pros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePro(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <label className="block text-xs font-mono uppercase text-rose-800 font-bold">
                  What Didn't (Critiques)
                </label>
                <button
                  type="button"
                  onClick={handleAddCon}
                  className="text-xs font-mono text-rose-600 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Point</span>
                </button>
              </div>

              <div className="space-y-2">
                {cons.map((con, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={con}
                      onChange={(e) => handleUpdateCon(index, e.target.value)}
                      placeholder="e.g. Slightly rushed pacing in the finale"
                      className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                    />
                    {cons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCon(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Final Verdict & Editorial Highlights */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-black text-sm text-gray-900 border-b border-gray-100 pb-3">
              Editorial Conclusion & Verdict
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Closing Verdict Statement
                </label>
                <input
                  type="text"
                  value={verdictText}
                  onChange={(e) => setVerdictText(e.target.value)}
                  placeholder="e.g. An essential cinematic triumph that demands repeat viewings."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Should You Watch?
                </label>
                <select
                  value={shouldYouWatch}
                  onChange={(e) => setShouldYouWatch(e.target.value as WatchVerdict)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none cursor-pointer"
                >
                  <option value="Must Watch">Must Watch</option>
                  <option value="Recommended">Recommended</option>
                  <option value="For Fans">For Fans</option>
                  <option value="Skip">Skip</option>
                </select>
              </div>
            </div>

            {/* Favorite Scene & Favorite Quote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Favorite Scene / Sequence
                </label>
                <input
                  type="text"
                  value={favoriteScene}
                  onChange={(e) => setFavoriteScene(e.target.value)}
                  placeholder="e.g. The subway farewell scene..."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                  Favorite Dialogue / Quote
                </label>
                <input
                  type="text"
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="e.g. 'If you had never left Seoul...'"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Streaming Platforms */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-black text-sm text-gray-900 flex items-center space-x-2">
                <Tv className="w-4 h-4 text-[#008CFF]" />
                <span>Where to Stream</span>
              </h3>
              <button
                type="button"
                onClick={handleAddPlatform}
                className="text-xs font-mono text-[#008CFF] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Platform</span>
              </button>
            </div>

            <div className="space-y-3">
              {streamingPlatforms.map((p, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdatePlatform(index, 'name', e.target.value)}
                    placeholder="Platform (e.g. Max, Apple TV, Netflix)"
                    className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none"
                  />
                  <select
                    value={p.type}
                    onChange={(e) => handleUpdatePlatform(index, 'type', e.target.value)}
                    className="px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none"
                  >
                    <option value="Subscription">Subscription</option>
                    <option value="Rent/Buy">Rent / Buy</option>
                    <option value="Free">Free</option>
                  </select>
                  <input
                    type="text"
                    value={p.url || ''}
                    onChange={(e) => handleUpdatePlatform(index, 'url', e.target.value)}
                    placeholder="Direct URL (optional)"
                    className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePlatform(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Publishing, Media Assets, Taxonomy & SEO */}
        <div className="space-y-6">
          {/* Section: Publishing Status & Schedule */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-black text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#008CFF]" />
              <span>Publishing Controls</span>
            </h3>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                Review Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReviewStatus)}
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none cursor-pointer"
              >
                <option value="draft">Draft (Private in CMS)</option>
                <option value="published">Published (Live on site)</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {status === 'scheduled' && (
              <div>
                <label className="block text-xs font-mono uppercase text-purple-700 font-bold mb-1.5">
                  Publish Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-900 focus:outline-none"
                />
              </div>
            )}

            {/* Editorial Flags */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-[#008CFF] focus:ring-[#008CFF]"
                />
                <span>Featured on Homepage Hero</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditorPick}
                  onChange={(e) => setIsEditorPick(e.target.checked)}
                  className="rounded text-[#008CFF] focus:ring-[#008CFF]"
                />
                <span>Editor's Pick Badge</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHiddenGem}
                  onChange={(e) => setIsHiddenGem(e.target.checked)}
                  className="rounded text-[#008CFF] focus:ring-[#008CFF]"
                />
                <span>Hidden Gem Badge</span>
              </label>
            </div>
          </div>

          {/* Section: Artwork & Visual Assets (Independent Cloudinary & First-Party Upload) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-black text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#008CFF]" />
              <span>Artwork & Visual Assets</span>
            </h3>

            {/* Hidden file inputs */}
            <input
              ref={posterFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'poster')}
              className="hidden"
            />
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'banner')}
              className="hidden"
            />

            {/* Poster Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold">
                  Poster Image (Portrait)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => posterFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs font-mono text-[#008CFF] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{posterUrl ? 'Replace' : 'Upload'}</span>
                  </button>
                  {posterUrl && (
                    <button
                      type="button"
                      onClick={() => setPosterUrl('')}
                      className="text-xs font-mono text-red-500 hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="Direct image URL or upload above..."
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
              />
              {posterUrl && (
                <div className="relative mt-2 w-24 h-36 border border-gray-200 rounded-lg overflow-hidden shadow-2xs group">
                  <img
                    src={posterUrl}
                    alt="Poster Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Banner Backdrop */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase text-gray-700 font-bold">
                  Banner Backdrop (Widescreen)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs font-mono text-[#008CFF] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{bannerUrl ? 'Replace' : 'Upload'}</span>
                  </button>
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      className="text-xs font-mono text-red-500 hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Direct backdrop URL or upload above..."
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-[#008CFF] focus:outline-none"
              />
              {bannerUrl && (
                <div className="relative mt-2 w-full h-24 border border-gray-200 rounded-lg overflow-hidden shadow-2xs group">
                  <img
                    src={bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section: Tags & Taxonomy */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-black text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#008CFF]" />
              <span>Tags & Taxonomy</span>
            </h3>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1.5">
                Editorial Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#008CFF] text-white font-bold shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  placeholder="Custom tag..."
                  className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-mono rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section: SEO & URL Slug */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-black text-sm text-gray-900 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#008CFF]" />
                <span>SEO & Indexing</span>
              </h3>
              <button
                type="button"
                onClick={handleAutoGenerateSeo}
                className="text-xs font-mono text-[#008CFF] hover:underline cursor-pointer"
              >
                Auto-Fill
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1">
                URL Slug
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 font-mono">
                <span>/reviews/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="film-title-year"
                  className="flex-1 bg-transparent text-gray-900 font-bold focus:outline-none pl-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Title (Year) Review — The Abstract Take"
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 font-bold mb-1">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Concise SEO search summary..."
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Editorial Assistant Modal */}
      {isEditorialAssistantOpen && (
        <EditorialAssistantModal
          isOpen={isEditorialAssistantOpen}
          onClose={() => setIsEditorialAssistantOpen(false)}
          initialTitle={title}
          initialYear={releaseYear}
          initialType={type}
          initialScore={abstractScore}
          initialRawTake={myTake}
          initialLikes={pros}
          initialDislikes={cons}
          initialVerdict={verdictText}
          onApplyDraft={handleApplyEditorialDraft}
        />
      )}

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <ReviewLivePreviewModal
          review={assembleReview()}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
