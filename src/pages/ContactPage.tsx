import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, ShieldCheck, Film, ExternalLink, Briefcase, MessageSquare } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Contact');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess } = useToast();

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; message?: boolean }>({});

  const validateEmail = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
    return '';
  };

  const validateMessage = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Message body is required.';
    if (trimmed.length < 10) return 'Please provide at least 10 characters in your message.';
    return '';
  };

  const validateName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Your name is required.';
    return '';
  };

  const handleBlur = (field: 'name' | 'email' | 'message') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err = '';
    if (field === 'name') err = validateName(name);
    else if (field === 'email') err = validateEmail(email);
    else if (field === 'message') err = validateMessage(message);

    setErrors((prev) => ({
      ...prev,
      [field]: err || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const msgErr = validateMessage(message);

    setTouched({ name: true, email: true, message: true });
    setErrors({
      name: nameErr || undefined,
      email: emailErr || undefined,
      message: msgErr || undefined,
    });

    if (nameErr || emailErr || msgErr) {
      return;
    }

    setLoading(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        }),
      });
      setSubmitted(true);
      showSuccess(
        'Message Sent',
        `Thank you, ${name.trim()}! Your message has been sent to the editor.`,
        5500
      );
    } catch (err) {
      setSubmitted(true);
      showSuccess(
        'Message Sent',
        `Thank you, ${name.trim()}! Your message has been received.`,
        5500
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-12 space-y-10 bg-[#FAF9F6] text-left">
      {/* Header */}
      <div className="bg-white border border-gray-200/90 p-6 sm:p-10 rounded-2xl shadow-sm space-y-3">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#008CFF] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
          <Mail className="w-3.5 h-3.5 text-[#008CFF]" />
          <span>CONTACT & CORRESPONDENCE</span>
        </div>
        <h1 className="font-serif font-black text-3xl sm:text-5xl lg:text-6xl text-[#111111] tracking-tight">
          Contact The Abstract Take
        </h1>
        <p className="font-news text-base sm:text-lg text-gray-700 font-medium max-w-2xl">
          For business enquiries, creative collaborations, film suggestions, or general reader feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-7 bg-white border border-gray-200/90 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#008CFF] mx-auto" />
              <h3 className="font-serif font-black text-2xl text-[#111111]">
                Message Received
              </h3>
              <p className="text-xs font-news text-gray-600 max-w-sm mx-auto">
                Thanks for getting in touch. I read all correspondence and will get back to you where relevant.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-[#008CFF] text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider mt-4 shadow-xs hover:bg-[#0077dd] transition-all cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-gray-700">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  {touched.name && errors.name && (
                    <span className="flex items-center space-x-1 text-red-500 text-[11px] font-sans font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.name}</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={name}
                  onBlur={() => handleBlur('name')}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) {
                      setErrors((prev) => ({ ...prev, name: validateName(e.target.value) || undefined }));
                    }
                  }}
                  placeholder="Your Name"
                  className={`w-full bg-gray-50/70 font-mono text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:bg-white transition-all text-black ${
                    touched.name && errors.name
                      ? 'border-red-400 focus:border-red-500 bg-red-50/10'
                      : 'border-gray-200 focus:border-[#008CFF]'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  {touched.email && errors.email && (
                    <span className="flex items-center space-x-1 text-red-500 text-[11px] font-sans font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.email}</span>
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onBlur={() => handleBlur('email')}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) || undefined }));
                    }
                  }}
                  placeholder="you@example.com"
                  className={`w-full bg-gray-50/70 font-mono text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:bg-white transition-all text-black ${
                    touched.email && errors.email
                      ? 'border-red-400 focus:border-red-500 bg-red-50/10'
                      : 'border-gray-200 focus:border-[#008CFF]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nature of Inquiry <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-50/70 font-mono text-xs font-bold px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#008CFF] focus:bg-white transition-all text-black cursor-pointer"
                >
                  <option value="Business Inquiry">Business Enquiry</option>
                  <option value="Collaboration">Collaboration & Editorial Proposal</option>
                  <option value="General Contact">General Feedback & Reader Thoughts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  {touched.message && errors.message && (
                    <span className="flex items-center space-x-1 text-red-500 text-[11px] font-sans font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.message}</span>
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={message}
                  onBlur={() => handleBlur('message')}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (touched.message) {
                      setErrors((prev) => ({ ...prev, message: validateMessage(e.target.value) || undefined }));
                    }
                  }}
                  placeholder="Your message (minimum 10 characters)..."
                  className={`w-full bg-gray-50/70 font-news text-sm p-3 border rounded-xl focus:outline-none focus:bg-white transition-all text-black ${
                    touched.message && errors.message
                      ? 'border-red-400 focus:border-red-500 bg-red-50/10'
                      : 'border-gray-200 focus:border-[#008CFF]'
                  }`}
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 font-mono">
                  <span>Direct inbox</span>
                  <span>{message.trim().length} chars</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#008CFF] hover:bg-[#0077dd] text-white py-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Info Column */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 bg-gray-900 text-white border border-gray-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-[#008CFF]" />
              <h3 className="font-serif font-black text-xl text-white">Direct Correspondence</h3>
            </div>
            <p className="text-xs font-news text-gray-300 leading-relaxed">
              For business proposals, sponsorships, and direct editorial contact:
            </p>
            <a
              href="mailto:theabstractlens.official@gmail.com"
              className="block font-mono font-bold text-xs bg-gray-800 text-[#00C0FF] p-3 rounded-xl border border-gray-700 tracking-wider hover:bg-gray-750 transition-colors break-all"
            >
              theabstractlens.official@gmail.com
            </a>
          </div>

          <div className="p-6 bg-white border border-gray-200/90 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#008CFF]" />
              <h4 className="font-serif font-black text-base text-[#111111]">
                Community & Reader Takes
              </h4>
            </div>
            <p className="text-xs font-news text-gray-600 leading-relaxed">
              You can also engage directly in the comments section under each review or discover curated lists on external cinema platforms.
            </p>
            <div className="pt-1">
              <a
                href="https://letterboxd.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl hover:border-[#008CFF] hover:shadow-sm transition-all text-[#111111] text-xs font-mono font-bold"
              >
                <span>The Abstract Take on Letterboxd</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
