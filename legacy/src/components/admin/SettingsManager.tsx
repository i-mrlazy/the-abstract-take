import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { Save, Check, Globe, Twitter, Mail, Shield, Sparkles, Film } from 'lucide-react';

interface SettingsManagerProps {
  settings: SiteSettings;
  onSaveSettings: (settings: Partial<SiteSettings>) => Promise<void>;
}

export function SettingsManager({ settings, onSaveSettings }: SettingsManagerProps) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(form);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-gray-900 max-w-4xl pb-24">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">Publication & SEO Settings</h2>
          <p className="text-xs text-gray-500 mt-1">
            Configure site metadata, creator identity, external channel links, and comment moderation rules.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-mono flex items-center space-x-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Site settings saved and applied to live publication.</span>
        </div>
      )}

      {/* Publication Branding */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
            <Globe className="w-4 h-4" />
          </div>
          <span>Brand Identity & Global Meta</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">Site Title</label>
            <input
              type="text"
              value={form.siteTitle}
              onChange={(e) => handleChange('siteTitle', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">Tagline</label>
            <input
              type="text"
              value={form.siteTagline}
              onChange={(e) => handleChange('siteTagline', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">Creator Bio</label>
            <textarea
              rows={3}
              value={form.creatorBio}
              onChange={(e) => handleChange('creatorBio', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">Creator Avatar URL</label>
            <input
              type="text"
              value={form.creatorAvatar}
              onChange={(e) => handleChange('creatorAvatar', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">Default OG Image URL</label>
            <input
              type="text"
              value={form.defaultOgImage}
              onChange={(e) => handleChange('defaultOgImage', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* Social & External Profiles */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
            <Film className="w-4 h-4" />
          </div>
          <span>Social Media & External Profiles</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Letterboxd Profile URL
            </label>
            <input
              type="text"
              value={form.letterboxdUrl}
              onChange={(e) => handleChange('letterboxdUrl', e.target.value)}
              placeholder="https://letterboxd.com/TheAbstractTake"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Twitter / X URL
            </label>
            <input
              type="text"
              value={form.twitterUrl}
              onChange={(e) => handleChange('twitterUrl', e.target.value)}
              placeholder="https://twitter.com/TheAbstractTake"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-700 font-semibold mb-1">
              Contact / Inquiries Email
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="editor@theabstracttake.com"
              className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* Moderation Rules */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-black text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-[#008CFF] rounded-lg">
            <Shield className="w-4 h-4" />
          </div>
          <span>Reader Discourse & Moderation Rules</span>
        </h3>

        <div className="space-y-3">
          <label className="flex items-center space-x-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={form.enableComments}
              onChange={(e) => handleChange('enableComments', e.target.checked)}
              className="accent-[#008CFF] w-4 h-4 rounded"
            />
            <div>
              <p className="text-xs font-bold text-gray-900 font-mono">Enable Reader Comments</p>
              <p className="text-[11px] text-gray-500">Allow visitors to submit comments on review pages.</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={form.autoApproveComments}
              onChange={(e) => handleChange('autoApproveComments', e.target.checked)}
              className="accent-[#008CFF] w-4 h-4 rounded"
            />
            <div>
              <p className="text-xs font-bold text-gray-900 font-mono">Auto-Approve Comments</p>
              <p className="text-[11px] text-gray-500">If disabled, all reader comments enter the Moderation Queue before appearing publicly.</p>
            </div>
          </label>
        </div>
      </div>
    </form>
  );
}
