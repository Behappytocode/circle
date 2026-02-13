
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Profile, ChatThread, Message } from '../types';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import AdminPanel from './AdminPanel';
import GeminiLiveOverlay from './GeminiLiveOverlay';

interface Props {
  profile: Profile;
  onProfileUpdate: (p: Profile) => void;
}

const Dashboard: React.FC<Props> = ({ profile, onProfileUpdate }) => {
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  // Subscribe to real-time events for messages
  useEffect(() => {
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // Notification logic or UI refresh logic here
        // The individual ChatWindow handles specific thread messages
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar 
        currentProfile={profile} 
        activeThread={activeThread} 
        onSelectThread={(t) => { setActiveThread(t); setShowAdmin(false); }}
        onOpenAdmin={() => setShowAdmin(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
        {showAdmin && profile.is_admin ? (
          <AdminPanel currentProfile={profile} />
        ) : activeThread ? (
          <ChatWindow currentProfile={profile} thread={activeThread} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-slate-50">
            <div className="w-32 h-32 mb-6 bg-white rounded-full shadow-sm flex items-center justify-center border-4 border-indigo-50">
               <i className="fas fa-comments text-5xl text-indigo-200"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-600">Select a conversation</h2>
            <p className="max-w-xs mt-2">Pick a friend or group from the sidebar to start chatting securely.</p>
            <button 
              onClick={() => setIsLiveOpen(true)}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <i className="fas fa-sparkles"></i>
              Talk to Circle AI (Live)
            </button>
          </div>
        )}
      </main>

      {/* Gemini Live UI Overlay */}
      {isLiveOpen && (
        <GeminiLiveOverlay onClose={() => setIsLiveOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard;
