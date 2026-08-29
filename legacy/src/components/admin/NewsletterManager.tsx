import React, { useState } from 'react';
import { NewsletterSubscriber } from '../../types';
import { Download, Trash2, UserPlus, Mail, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';

interface NewsletterManagerProps {
  subscribers: NewsletterSubscriber[];
  onAddSubscriber: (email: string) => Promise<void>;
  onDeleteSubscriber: (id: string) => Promise<void>;
}

export function NewsletterManager({
  subscribers,
  onAddSubscriber,
  onDeleteSubscriber,
}: NewsletterManagerProps) {
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) return;
    setIsAdding(true);
    setMsg(null);
    try {
      await onAddSubscriber(newEmail);
      setNewEmail('');
      setMsg('Subscriber added successfully!');
    } catch (err: any) {
      setMsg(err.message || 'Failed to add subscriber');
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/newsletter/export';
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-xl text-gray-900">
            "The Abstract Dispatch" Newsletter
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Active audience subscriptions and mailing list exports ({subscribers.length} total subscribers).
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-mono font-bold text-xs rounded-xl border border-gray-200 flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
        >
          <Download className="w-4 h-4 text-[#008CFF]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Add subscriber form */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm">
        <h3 className="font-mono text-xs uppercase text-gray-700 font-bold mb-3 flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-[#008CFF]" />
          <span>Manually Add Subscriber</span>
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="reader@cinemareview.com"
            required
            className="flex-1 px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-[#008CFF] focus:bg-white shadow-2xs transition-all"
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-5 py-2.5 bg-[#008CFF] hover:bg-[#0077dd] text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add Subscriber'}
          </button>
        </form>
        {msg && <p className="text-xs font-mono text-[#008CFF] mt-2 font-semibold">{msg}</p>}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-gray-600 font-mono uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Subscriber Email</th>
                <th className="py-3.5 px-3 font-semibold">Subscribed Date</th>
                <th className="py-3.5 px-3 font-semibold">Preference</th>
                <th className="py-3.5 px-3 font-semibold">Status</th>
                <th className="py-3.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-[#008CFF]" />
                    <span>{s.email}</span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-gray-500">
                    {new Date(s.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-gray-600 capitalize">
                    {s.preference || 'All Dispatches'}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-mono font-bold uppercase">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onDeleteSubscriber(s.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                      title="Remove Subscriber"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
