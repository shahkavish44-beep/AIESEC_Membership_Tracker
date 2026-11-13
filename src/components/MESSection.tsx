import React, { useState } from 'react';
import { ClipboardList, ExternalLink, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react';

interface MESSectionProps {
  memberEmail?: string;
  memberName?: string;
}

export const MESSection: React.FC<MESSectionProps> = ({ memberEmail, memberName }) => {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Default external survey form link (can be updated to an official Google Form / Typeform link)
  const defaultSurveyUrl = 'https://forms.gle/aiesec-mumbai-mes';

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#037ef3] text-xs font-bold">
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>Membership Feedback</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Membership Experience Survey (MES)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Share your membership experience and help us understand your journey, development and experience at AIESEC in Mumbai.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-2xl bg-[#037ef3] hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center space-x-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Fill MES Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* MES Survey Modal (Supports embedded submission & external redirection) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowModal(false); setSubmitted(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-xl bg-blue-50 text-[#037ef3]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Membership Experience Survey (MES)</h3>
                <p className="text-xs text-slate-500">AIESEC in Mumbai Membership Feedback</p>
              </div>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Thank you for submitting your MES!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your feedback helps the Executive Board and Team Leaders improve your development environment.
                </p>
                <button
                  onClick={() => { setShowModal(false); setSubmitted(false); }}
                  className="mt-4 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                  <p className="font-medium text-slate-800">
                    Welcome, <strong>{memberName || 'AIESEC Member'}</strong>!
                  </p>
                  <p>
                    The official MES form can be filled directly or opened in a new tab via the external survey portal.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rate your overall development experience (1 to 10)
                    </label>
                    <input 
                      type="range" 
                      min={1} 
                      max={10} 
                      defaultValue={8}
                      className="w-full accent-[#037ef3]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                      <span>1 (Needs Support)</span>
                      <span>5 (Neutral)</span>
                      <span>10 (Exceptional)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      What has been the most meaningful part of your term?
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Leading my first outreach drive, team coordination, or learning cross-cultural skills..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Suggestions for your Team Leader and Executive Board
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="Share constructive ideas to enhance team engagement..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <a
                    href={defaultSurveyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#037ef3] hover:underline flex items-center space-x-1"
                  >
                    <span>Open External Form Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmitted(true)}
                      className="px-5 py-2 rounded-xl bg-[#037ef3] hover:bg-blue-600 text-white text-xs font-bold shadow-sm"
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

