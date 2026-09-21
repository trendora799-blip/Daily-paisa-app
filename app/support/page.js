'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('dailypaisa_user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchTickets(userData.id);
  }, [router]);

  const fetchTickets = async (userId) => {
    try {
      const res = await fetch(`/api/support?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      return toast.error('Please fill in all fields');
    }

    setSubmitting(true);
    try {
      let screenshotData = null;

      // Convert file to base64 for MongoDB storage
      if (selectedFile) {
        screenshotData = filePreview; // Already base64 from FileReader
      }

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          subject: subject.trim(),
          message: message.trim(),
          screenshot: screenshotData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Ticket submitted successfully!');
      setSubject('');
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      fetchTickets(user.id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">← Back</button>
        <h1 className="text-2xl font-bold">Support Center</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Submit New Ticket */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Contact Support</h2>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (e.g., Deposit issue)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
            />

            {/* File Upload */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Attach Screenshot (Optional)</label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  {filePreview ? (
                    <div className="relative">
                      <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >

                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <div className="text-4xl mb-2">📎</div>
                      <p className="text-slate-400 text-sm">Click to upload screenshot</p>
                      <p className="text-slate-500 text-xs mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>

        {/* My Tickets */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">My Tickets ({tickets.length})</h2>

          {tickets.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No tickets yet</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      ticket.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                      ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {ticket.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{ticket.message}</p>
                  {ticket.screenshot && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-purple-400">
                       Has screenshot
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded text-xs font-bold ${
                  selectedTicket.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                  selectedTicket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {selectedTicket.status?.toUpperCase()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
              >

              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Message */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase">Your Message</span>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                {selectedTicket.screenshot && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Screenshot:</p>
                    <img src={selectedTicket.screenshot} alt="Screenshot" className="rounded-lg max-h-64 w-auto" />
                  </div>
                )}
              </div>

              {/* Admin Reply */}
              {selectedTicket.adminReply ? (
                <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/30">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Admin Reply</span>
                    {selectedTicket.updatedAt && (
                      <span className="text-xs text-slate-500">
                        {new Date(selectedTicket.updatedAt).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30 text-center">
                  <p className="text-yellow-400">⏳ Waiting for admin response</p>
                  <p className="text-sm text-slate-400 mt-1">We'll reply as soon as possible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
                }
