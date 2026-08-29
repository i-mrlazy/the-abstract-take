import React, { useState } from 'react';
import { Review, MediaType, WatchVerdict, ReviewStatus, StreamingPlatform, MediaSearchResult, EditorialDraftResult } from '../../types';
import { api } from '../../utils/api';
import {
  RATING_SCALE,
  normalizeScore,
  getQualityLabel,
  getScoreMeaning,
  getRatingColorClasses,
} from '../../utils/rating';
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
} from 'lucide-react';

interface ReviewEditorProps {
  initialReview?: Review | null;
  onSave: (review: Review) => Promise<void>;
  onCancel: () => void;
  availableTags: string[];
}

export function ReviewEditor({
  initialReview,
  onSave,
  onCancel,
  availableTags,
}: ReviewEditorProps) {
  // Form State
  const [title, setTitle] = useState(initialReview?.title || '');
  const [originalTitle, setOriginalTitle] = useState(initialReview?.originalTitle || '');
  const [type, setType] = useState<MediaType>(initialReview?.type || 'Movie');
  const [status, setStatus] = useState<ReviewStatus>(initialReview?.status || 'draft');
  const [scheduledDate, setScheduledDate] = useState(initialReview?.scheduledDate || '');
  const [releaseYear, setReleaseYear] = useState<number>(initialReview?.releaseYear || new Date().getFullYear());
  const [director, setDirector] = useState(initialReview?.director || '');
  const [castInput, setCastInput] = useState(initialReview?.cast?.join(', ') || '');
  const [runtime, setRuntime] = useState(initialReview?.runtime || '2h 00m');
  const [genresInput, setGenresInput] = useState(initialReview?.genres?.join(', ') || 'Drama, Cinema');
  const [synopsis, setSynopsis] = useState(initialReview?.synopsis || '');
  const [posterUrl, setPosterUrl] = useState(initialReview?.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop');
  const [bannerUrl, setBannerUrl] = useState(initialReview?.bannerUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop');
  const [trailerUrl, setTrailerUrl] = useState(initialReview?.trailerUrl || '');

  // Editorial Opinion State
  const [abstractScore, setAbstractScore] = useState<number>(() =>
    normalizeScore(initialReview?.abstractScore ?? 9)
  );
  const [myTake, setMyTake] = useState(initialReview?.myTake || '');
  const [longFormReview, setLongFormReview] = useState(initialReview?.longFormReview || '');
  const [pros, setPros] = useState<string[]>(initialReview?.pros?.length ? initialReview.pros : ['']);
  const [cons, setCons] = useState<string[]>(initialReview?.cons?.length ? initialReview.cons : ['']);
  const [verdictText, setVerdictText] = useState(initialReview?.verdictText || '');
  const [shouldYouWatch, setShouldYouWatch] = useState<WatchVerdict>(initialReview?.shouldYouWatch || 'Must Watch');
  const [spoilerFreeTake, setSpoilerFreeTake] = useState(initialReview?.spoilerFreeTake || '');
  const [spoilerSection, setSpoilerSection] = useState(initialReview?.spoilerSection || '');
  const [favoriteScene, setFavoriteScene] = useState(initialReview?.favoriteScene || '');
  const [favoriteQuote, setFavoriteQuote] = useState(initialReview?.favoriteQuote || '');

  // Taxonomy & Streaming
  const [category, setCategory] = useState(initialReview?.category || 'Movies');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialReview?.tags || ['Must Watch', 'Personal Favorites']);
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
  const [isFeatured, setIsFeatured] = useState<boolean>(initialReview?.isFeatured || false);
  const [isLatestTake, setIsLatestTake] = useState<boolean>(initialReview?.isLatestTake || false);
  const [isEditorPick, setIsEditorPick] = useState<boolean>(initialReview?.isEditorPick || false);
  const [isHiddenGem, setIsHiddenGem] = useState<boolean>(initialReview?.isHiddenGem || false);

  // SEO
  const [slug, setSlug] = useState(initialReview?.slug || '');
  const [metaTitle, setMetaTitle] = useState(initialReview?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialReview?.seo?.metaDescription || '');
  const [keywordsInput, setKeywordsInput] = useState(initialReview?.seo?.keywords?.join(', ') || '');
  const [ogImage, setOgImage] = useState(initialReview?.seo?.ogImage || '');
  const [noIndex, setNoIndex] = useState(initialReview?.seo?.noIndex || false);

  // UI Flow States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditorialAssistantOpen, setIsEditorialAssistantOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI Editorial Assistant Apply Handler
  const handleApplyEditorialDraft = (draft: EditorialDraftResult) => {
    if (draft.myTakeHook) setMyTake(draft.myTakeHook);
    if (draft.editorialReview) setLongFormReview(draft.editorialReview);
    if (draft.pros && draft.pros.length > 0) setPros(draft.pros);
    if (draft.cons && draft.cons.length > 0) setCons(draft.cons);
    if (draft.verdictText) setVerdictText(draft.verdictText);
    if (draft.shouldYouWatch) setShouldYouWatch(draft.shouldYouWatch as WatchVerdict);
    if (draft.spoilerFreeTake) setSpoilerFreeTake(draft.spoilerFreeTake);
    if (draft.abstractScore) setAbstractScore(normalizeScore(draft.abstractScore));
  };

  // Media Search Handler
  const handleMediaSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingMedia(true);
    try {
      const results = await api.searchMedia(searchQuery, type);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Media search error:', err);
    } finally {
      setIsSearchingMedia(false);
    }
  };

  // 1-Click Import Metadata
  const handleImportMetadata = (item: MediaSearchResult) => {
    setTitle(item.title);
    if (item.originalTitle) setOriginalTitle(item.originalTitle);
    setType(item.type);
    setReleaseYear(item.releaseYear || new Date().getFullYear());
    if (item.director) setDirector(item.director);
    if (item.cast?.length) setCastInput(item.cast.join(', '));
    if (item.runtime) setRuntime(item.runtime);
    if (item.genres?.length) setGenresInput(item.genres.join(', '));
    if (item.synopsis) setSynopsis(item.synopsis);
    if (item.posterUrl) setPosterUrl(item.posterUrl);
    if (item.bannerUrl) setBannerUrl(item.bannerUrl);
    if (item.trailerUrl) setTrailerUrl(item.trailerUrl);

    // Auto-generate slug & SEO if not set
    const generatedSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${item.releaseYear}`;
    setSlug(generatedSlug);
    setMetaTitle(`${item.title} (${item.releaseYear}) Review — The Abstract Take`);
    setMetaDescription(`Personal review and Abstract Score breakdown of ${item.title} directed by ${item.director}.`);
    setKeywordsInput(`${item.title} Review, ${item.director}, The Abstract Take, ${item.type} Review`);

    setSearchResults([]);
  };

  // Auto-generate SEO Defaults
  const handleAutoGenerateSeo = () => {
    const cleanTitle = title || 'Cinema Review';
    const cleanYear = releaseYear || new Date().getFullYear();
    const generatedSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${cleanYear}`;
    const cleanScore = normalizeScore(abstractScore);
    const scoreDescriptor = getQualityLabel(cleanScore);
    setSlug(generatedSlug);
    setMetaTitle(`${cleanTitle} (${cleanYear}) Review — The Abstract Take`);
    setMetaDescription(myTake ? `"${myTake.slice(0, 140)}..." The Abstract Score: ${cleanScore}/10 (${scoreDescriptor}).` : `The Abstract Take's personal review and score of ${cleanTitle}.`);
    setKeywordsInput(`${cleanTitle} review, ${director}, ${type} review, The Abstract Take, Abstract Score ${cleanScore}, ${scoreDescriptor}`);
    setOgImage(bannerUrl || posterUrl);
  };

  // Insert Rich Text Formatting
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('longFormReviewInput') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = longFormReview;
    const selected = currentText.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const updated = currentText.substring(0, start) + replacement + currentText.substring(end);
    setLongFormReview(updated);
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'poster' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        const result = await api.uploadImage(dataUrl, file.name);
        if (target === 'poster') setPosterUrl(result.url);
        if (target === 'banner') setBannerUrl(result.url);
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
  const handleRemovePro = (index: number) => setPros(pros.filter((_, i) => i !== index));

  const handleAddCon = () => setCons([...cons, '']);
  const handleUpdateCon = (index: number, val: string) => {
    const updated = [...cons];
    updated[index] = val;
    setCons(updated);
  };
  const handleRemoveCon = (index: number) => setCons(cons.filter((_, i) => i !== index));

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
    setStreamingPlatforms([...streamingPlatforms, { name: '', type: 'Subscription', url: '' }]);
  };
  const handleUpdatePlatform = (index: number, field: keyof StreamingPlatform, value: any) => {
    const updated = [...streamingPlatforms];
    updated[index] = { ...updated[index], [field]: value };
    setStreamingPlatforms(updated);
  };
  const handleRemovePlatform = (index: number) => {
    setStreamingPlatforms(streamingPlatforms.filter((_, i) => i !== index));
  };

  // Assemble Review Object
  const assembleReview = (): Review => {
    const castArray = castInput.split(',').map((c) => c.trim()).filter(Boolean);
    const genresArray = genresInput.split(',').map((g) => g.trim()).filter(Boolean);
    const keywordsArray = keywordsInput.split(',').map((k) => k.trim()).filter(Boolean);
    const readingTime = Math.max(2, Math.ceil((longFormReview.split(/\s+/).length || 100) / 180));

    return {
      id: initialReview?.id || `review-${Date.now()}`,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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
      publishDate: initialReview?.publishDate || new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      author: initialReview?.author || {
        name: 'The Abstract Take',
        title: 'Creator & Film Critic',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
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
      await onSave(reviewObj);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save review');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPreviewReview = assembleReview();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 text-gray-900">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 border border-gray-200/90 p-4 rounded-2xl shadow-sm sticky top-3 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
            title="Return without saving"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif font-black text-lg text-gray-900">
              {initialReview ? `Edit: ${initialReview.title}` : 'Write New Review'}
            </h2>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-gray-500">
              <span>Status:</span>
              <span className={`px-2 py-0.5 rounded-lg uppercase font-bold text-[10px] border ${
                status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : status === 'scheduled'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsEditorialAssistantOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-[#008CFF] hover:from-blue-700 hover:to-[#0077dd] text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>AI Assistant (~250w)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#008CFF] rounded-xl border border-blue-200 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="px-4 py-2 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Publish Review</span>
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Media Database Metadata Fetcher Card */}
      <section className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-black text-base text-gray-900">
              Step 1: Search & Auto-Import Media Metadata
            </h3>
          </div>
          <span className="text-[11px] font-mono text-gray-500">Cinema Engine & AI Assistant</span>
        </div>

        <p className="text-xs text-gray-600 mb-4">
          Type the title of any movie, TV series, or anime. Our media database automatically pulls high-res posters, release years, directors, cast lists, runtimes, and synopses with one click.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMediaSearch()}
              placeholder="e.g. Dune: Part Two, Severance, Spirited Away, Challengers..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={handleMediaSearch}
            disabled={isSearchingMedia || !searchQuery.trim()}
            className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSearchingMedia ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Metadata</span>
              </>
            )}
          </button>
        </div>

        {/* Search Results Preview Cards */}
        {searchResults.length > 0 && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50/70 border border-gray-200 rounded-xl p-3 flex space-x-3 hover:border-[#008CFF] hover:bg-white transition-all group shadow-2xs"
              >
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-16 h-24 object-cover rounded-lg border border-gray-200 shrink-0 shadow-2xs"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#008CFF] border border-blue-100 text-[10px] font-mono font-bold rounded-lg">
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {item.releaseYear}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-sm text-gray-900 truncate mt-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{item.synopsis}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleImportMetadata(item)}
                    className="mt-2 w-full py-1.5 bg-white hover:bg-[#008CFF] text-gray-700 hover:text-white border border-gray-200 hover:border-[#008CFF] rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Import All Metadata (1-Click)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Media Details & Specifications */}
      <section className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
            <Film className="w-4 h-4" />
          </div>
          <span>Step 2: Media Specifications & Technical Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dune: Part Two"
              required
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Original Title (Optional)
            </label>
            <input
              type="text"
              value={originalTitle}
              onChange={(e) => setOriginalTitle(e.target.value)}
              placeholder="e.g. Doraibu mai kā"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Format / Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MediaType)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            >
              <option value="Movie">Movie</option>
              <option value="Series">Series</option>
              <option value="Anime">Anime</option>
              <option value="Documentary">Documentary</option>
              <option value="Mini Series">Mini Series</option>
              <option value="Special">Special</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Release Year
            </label>
            <input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(parseInt(e.target.value) || 2024)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Runtime / Duration
            </label>
            <input
              type="text"
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              placeholder="e.g. 2h 46m or 8 Episodes"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Director / Showrunner
            </label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="e.g. Denis Villeneuve"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Cast List (Comma separated)
            </label>
            <input
              type="text"
              value={castInput}
              onChange={(e) => setCastInput(e.target.value)}
              placeholder="e.g. Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Genres (Comma separated)
            </label>
            <input
              type="text"
              value={genresInput}
              onChange={(e) => setGenresInput(e.target.value)}
              placeholder="e.g. Sci-Fi, Adventure, Drama"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Plot Synopsis
            </label>
            <textarea
              rows={2}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Brief neutral summary of the plot..."
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>
      </section>

      {/* 3. Manual Editorial Review & The Abstract Take Opinion */}
      <section className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#008CFF] rounded-full"></div>
            <h3 className="font-serif font-black text-base text-gray-900">
              Step 3: The Abstract Take — Editorial Opinion & Score
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#008CFF] font-bold uppercase tracking-wider">
            Unfiltered Creator Thesis
          </span>
        </div>

        {/* Step 3 AI Editorial Assistant Callout Banner */}
        <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-indigo-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#008CFF] text-white rounded-xl shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-serif font-black text-sm text-gray-900">
                  AI Editorial Assistant (~250–300 Words)
                </h4>
                <span className="px-2 py-0.5 bg-blue-100 text-[#008CFF] font-mono text-[10px] font-bold rounded-md">
                  Strict Creator Hierarchy
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Input your raw observations, likes, dislikes, and authoritative rating to generate a polished critique.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditorialAssistantOpen(true)}
            className="px-4 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Open Editorial Assistant</span>
          </button>
        </div>

        {/* Abstract Score (Official 1-10 Scale) Controlled Select with Derived Descriptor */}
        <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="abstractScoreSelect" className="text-xs font-mono uppercase tracking-wider text-gray-800 font-bold block">
                The Abstract Score (1 – 10 Scale) *
              </label>
              <span className="text-[11px] text-gray-500">
                Official editorial score mapping strictly to authoritative quality tiers and derived descriptors.
              </span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${getRatingColorClasses(abstractScore).badgeBg} ${getRatingColorClasses(abstractScore).badgeText} ${getRatingColorClasses(abstractScore).border}`}>
                {getQualityLabel(abstractScore)}
              </span>
              <div className={`px-3.5 py-1 ${getRatingColorClasses(abstractScore).bg} ${getRatingColorClasses(abstractScore).text} rounded-xl font-serif font-black text-xl shadow-xs`}>
                {normalizeScore(abstractScore)} / 10
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label htmlFor="abstractScoreSelect" className="block text-[11px] font-mono uppercase text-gray-600 font-semibold mb-1">
                Select Official Rating & Tier
              </label>
              <select
                id="abstractScoreSelect"
                value={normalizeScore(abstractScore)}
                onChange={(e) => setAbstractScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-mono font-medium focus:border-[#008CFF] focus:outline-none shadow-2xs transition-all cursor-pointer"
              >
                {RATING_SCALE.map((tier) => (
                  <option key={tier.score} value={tier.score}>
                    {tier.score}/10 — {tier.descriptor} ({tier.meaning})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-2xs">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                Derived Quality Meaning
              </span>
              <p className="text-xs font-serif italic text-gray-800 mt-0.5">
                "{getScoreMeaning(abstractScore)}"
              </p>
            </div>
          </div>
        </div>

        {/* "My Take" Executive Hook */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-800 font-bold flex items-center space-x-1.5">
              <span className="text-[#008CFF]">★</span>
              <span>"My Take" — The Core Editorial Thesis *</span>
            </label>
            <span className="text-[10px] font-mono text-gray-500">1–2 Punchy Sentences</span>
          </div>
          <textarea
            rows={3}
            value={myTake}
            onChange={(e) => setMyTake(e.target.value)}
            placeholder="e.g. A monumental sci-fi tragedy where spectacle never overshadows the terrifying corruptive weight of charismatic prophecy."
            required
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 focus:border-[#008CFF] focus:bg-white rounded-xl text-gray-900 font-serif font-bold text-base leading-relaxed focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Rich Long-Form Review Editor */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-800 font-bold">
              Full Long-Form Editorial Critique *
            </label>

            {/* Markdown Toolbar */}
            <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-gray-600 shadow-2xs">
              <button
                type="button"
                onClick={() => insertFormatting('## ')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Heading 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Heading 3"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Blockquote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('1. ')}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-xs transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            id="longFormReviewInput"
            rows={12}
            value={longFormReview}
            onChange={(e) => setLongFormReview(e.target.value)}
            placeholder="Write your comprehensive analysis here... Deep dive into cinematography, character arcs, sound design, pacing, and philosophical themes."
            required
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 font-serif text-sm leading-relaxed focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Pros & Cons Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pros */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono uppercase text-emerald-800 font-bold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>What Worked (Pros)</span>
              </label>
              <button
                type="button"
                onClick={handleAddPro}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Pro</span>
              </button>
            </div>
            <div className="space-y-2">
              {pros.map((pro, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => handleUpdatePro(index, e.target.value)}
                    placeholder="e.g. Masterful sound design by Hans Zimmer"
                    className="flex-1 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs text-gray-900 focus:border-emerald-500 focus:outline-none shadow-2xs"
                  />
                  {pros.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePro(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono uppercase text-rose-800 font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>What Didn't (Cons)</span>
              </label>
              <button
                type="button"
                onClick={handleAddCon}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Con</span>
              </button>
            </div>
            <div className="space-y-2">
              {cons.map((con, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => handleUpdateCon(index, e.target.value)}
                    placeholder="e.g. Slightly rushed pacing in the final 20 minutes"
                    className="flex-1 px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs text-gray-900 focus:border-rose-500 focus:outline-none shadow-2xs"
                  />
                  {cons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCon(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verdict & Should You Watch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Final Verdict Summary
            </label>
            <input
              type="text"
              value={verdictText}
              onChange={(e) => setVerdictText(e.target.value)}
              placeholder="e.g. Denis Villeneuve delivers an uncompromising operatic triumph."
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Should You Watch?
            </label>
            <select
              value={shouldYouWatch}
              onChange={(e) => setShouldYouWatch(e.target.value as WatchVerdict)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            >
              <option value="Must Watch">Must Watch</option>
              <option value="Recommended">Recommended</option>
              <option value="For Fans">For Fans</option>
              <option value="Skip">Skip</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Standout Sequence / Favorite Scene
            </label>
            <input
              type="text"
              value={favoriteScene}
              onChange={(e) => setFavoriteScene(e.target.value)}
              placeholder="e.g. Paul addressing southern Fremen fundamentalists..."
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Key Line of Dialogue / Favorite Quote
            </label>
            <input
              type="text"
              value={favoriteQuote}
              onChange={(e) => setFavoriteQuote(e.target.value)}
              placeholder='e.g. "This is not power. This is the beginning of a holy war..."'
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Spoiler Analysis Section */}
        <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <label className="text-xs font-mono uppercase text-amber-800 font-bold">
              Spoiler Analysis & Climax Breakdown (Reader Reveal Protected)
            </label>
          </div>
          <textarea
            rows={4}
            value={spoilerSection}
            onChange={(e) => setSpoilerSection(e.target.value)}
            placeholder="Deep analysis of ending twists, character fates, and thematic climax. Readers must click reveal to view."
            className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-gray-900 text-xs leading-relaxed focus:border-amber-500 focus:outline-none shadow-2xs"
          />
        </div>
      </section>

      {/* 4. Media Assets & Streaming Links */}
      <section className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
            <Globe className="w-4 h-4" />
          </div>
          <span>Step 4: Artwork & Streaming Availability</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Poster Image URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
              />
              <label className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 text-xs font-mono cursor-pointer flex items-center space-x-1 shadow-2xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'poster')}
                  className="hidden"
                />
              </label>
            </div>
            {posterUrl && (
              <img
                src={posterUrl}
                alt="Poster preview"
                className="mt-2 w-20 h-28 object-cover rounded-xl border border-gray-200 shadow-2xs"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Widescreen Backdrop Banner URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all shadow-2xs"
              />
              <label className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 text-xs font-mono cursor-pointer flex items-center space-x-1 shadow-2xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner')}
                  className="hidden"
                />
              </label>
            </div>
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="mt-2 w-full h-20 object-cover rounded-xl border border-gray-200 shadow-2xs"
              />
            )}
          </div>
        </div>

        {/* Streaming Platforms Builder */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-mono uppercase text-gray-800 font-bold">
              Where To Watch (Streaming Platforms)
            </label>
            <button
              type="button"
              onClick={handleAddPlatform}
              className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-mono flex items-center space-x-1 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Platform</span>
            </button>
          </div>

          <div className="space-y-2">
            {streamingPlatforms.map((platform, idx) => (
              <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  value={platform.name}
                  onChange={(e) => handleUpdatePlatform(idx, 'name', e.target.value)}
                  placeholder="Platform Name (e.g. Max, Apple TV, Criterion)"
                  className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs"
                />
                <select
                  value={platform.type}
                  onChange={(e) => handleUpdatePlatform(idx, 'type', e.target.value)}
                  className="w-32 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
                >
                  <option value="Subscription">Subscription</option>
                  <option value="Rent/Buy">Rent/Buy</option>
                  <option value="Free">Free</option>
                </select>
                <input
                  type="text"
                  value={platform.url || ''}
                  onChange={(e) => handleUpdatePlatform(idx, 'url', e.target.value)}
                  placeholder="Platform URL (Optional)"
                  className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePlatform(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Taxonomy, Tags & Featured Flags */}
      <section className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <span>Step 5: Editorial Tags & Placement Flags</span>
        </h3>

        {/* Editorial Tags Selection */}
        <div>
          <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-2">
            Editorial Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-[#008CFF] font-bold border-blue-200 shadow-2xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>

          <div className="flex space-x-2 max-w-sm">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
              placeholder="Create custom tag..."
              className="flex-1 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs"
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Editorial Flags */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="flex items-center space-x-2 bg-gray-50/70 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-[#008CFF] rounded"
            />
            <span className="text-xs font-mono text-gray-700 font-medium">Featured Hero</span>
          </label>

          <label className="flex items-center space-x-2 bg-gray-50/70 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={isLatestTake}
              onChange={(e) => setIsLatestTake(e.target.checked)}
              className="accent-[#008CFF] rounded"
            />
            <span className="text-xs font-mono text-gray-700 font-medium">Latest Take Banner</span>
          </label>

          <label className="flex items-center space-x-2 bg-gray-50/70 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={isEditorPick}
              onChange={(e) => setIsEditorPick(e.target.checked)}
              className="accent-[#008CFF] rounded"
            />
            <span className="text-xs font-mono text-gray-700 font-medium">Editor's Choice</span>
          </label>

          <label className="flex items-center space-x-2 bg-gray-50/70 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={isHiddenGem}
              onChange={(e) => setIsHiddenGem(e.target.checked)}
              className="accent-[#008CFF] rounded"
            />
            <span className="text-xs font-mono text-gray-700 font-medium">Hidden Gem</span>
          </label>
        </div>
      </section>

      {/* 6. Publishing Schedule & SEO Controls */}
      <section className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif font-black text-base text-gray-900 flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Step 6: Publication Status & SEO Metadata</span>
          </h3>

          <button
            type="button"
            onClick={handleAutoGenerateSeo}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#008CFF] border border-blue-200 rounded-xl text-xs font-mono font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Generate SEO Defaults</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Publication Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReviewStatus)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            >
              <option value="draft">Draft (Private in CMS)</option>
              <option value="published">Published (Live on Website)</option>
              <option value="scheduled">Scheduled (Auto-Publish at Date)</option>
              <option value="archived">Archived (Unlisted)</option>
            </select>
          </div>

          {status === 'scheduled' && (
            <div>
              <label className="block text-xs font-mono uppercase text-purple-700 font-bold mb-1">
                Scheduled Publication Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-purple-300 rounded-xl text-gray-900 text-sm focus:border-purple-500 focus:bg-white focus:outline-none shadow-2xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. dune-part-two-2024"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs font-mono focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              SEO Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Dune: Part Two Review — The Abstract Take"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              SEO Meta Description (Search Snippet)
            </label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Concise 150-character summary for Google and social previews..."
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Target SEO Keywords
            </label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="e.g. Dune 2 Review, Denis Villeneuve, The Abstract Take"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Social Sharing Image (OG Image URL)
            </label>
            <input
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:border-[#008CFF] focus:bg-white focus:outline-none shadow-2xs"
            />
          </div>
        </div>
      </section>

      {/* Bottom Sticky Action Footer */}
      <div className="bg-white border border-gray-200/90 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#008CFF] rounded-xl border border-blue-200 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Review</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer transition-all"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Update Publication</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Preview Modal */}
      <ReviewLivePreviewModal
        review={currentPreviewReview}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* AI Editorial Assistant Modal */}
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
    </div>
  );
}
