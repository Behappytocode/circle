
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { Profile } from './types';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import PendingApproval from './components/PendingApproval';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if the supabase client is using a placeholder key
    const checkConfig = async () => {
      try {
        const key = localStorage.getItem('supabase_anon_key') || (window as any)._env_?.SUPABASE_ANON_KEY;
        if (!key || key === 'your-anon-key' || key === '') {
          setIsConfigured(false);
          setLoading(false);
          return;
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          fetchProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Configuration check failed:", err);
        setIsConfigured(false);
        setLoading(false);
      }
    };

    checkConfig();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    const key = keyInputRef.current?.value;
    if (!key || !key.trim()) return;
    localStorage.setItem('supabase_anon_key', key.trim());
    window.location.reload();
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-indigo-600">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
              <i className="fas fa-plug text-2xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Connect Supabase</h1>
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest">Project: hnfwuvqwjzsiwjvfjolx</p>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">1</span>
                Initialize Database
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Run the <code className="bg-white px-1 border rounded font-mono text-[10px]">setup.sql</code> script in your project's SQL Editor.
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
                Retrieve API Key
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Copy the <span className="font-bold text-slate-700">anon public</span> key from <strong>Project Settings &rarr; API</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Supabase Anon Key</label>
            <input 
              ref={keyInputRef}
              type="password" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5..." 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveKey();
              }}
            />
            <button 
              onClick={handleSaveKey}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-95"
            >
              Finish Setup
            </button>
          </div>
          
          <p className="mt-6 text-center text-[10px] text-gray-400">
            <i className="fas fa-lock mr-1"></i> Key is stored locally and never shared.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  if (profile?.status === 'pending') {
    return <PendingApproval profile={profile} onRefresh={() => fetchProfile(session.user.id)} />;
  }

  if (profile?.status === 'banned') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-6 text-center">
        <i className="fas fa-user-slash text-6xl text-red-500 mb-4"></i>
        <h1 className="text-2xl font-bold text-red-700">Access Denied</h1>
        <p className="text-gray-600 mt-2 max-w-md">Your account has been restricted by an administrator.</p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <Dashboard profile={profile!} onProfileUpdate={(p) => setProfile(p)} />;
};

export default App;
