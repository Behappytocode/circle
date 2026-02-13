
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Profile, ChatThread } from '../types';

interface Props {
  currentProfile: Profile;
  activeThread: ChatThread | null;
  onSelectThread: (t: ChatThread) => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<Props> = ({ currentProfile, activeThread, onSelectThread, onOpenAdmin, onSignOut }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchThreads();
    
    // Listen for new members being approved or groups being created
    const profileSub = supabase.channel('profiles-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchThreads).subscribe();
    const groupSub = supabase.channel('groups-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchThreads).subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(groupSub);
    };
  }, []);

  const fetchThreads = async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .neq('id', currentProfile.id);

    const { data: grps } = await supabase
      .from('group_members')
      .select('groups(*)')
      .eq('profile_id', currentProfile.id);

    if (profs) setProfiles(profs);
    if (grps) setGroups(grps.map(g => g.groups));
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(p => p.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-80 flex flex-col bg-slate-900 text-slate-300 h-full border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
            {currentProfile.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-white truncate max-w-[100px]">{currentProfile.username}</span>
        </div>
        <div className="flex gap-2">
          {currentProfile.is_admin && (
            <button onClick={onOpenAdmin} className="hover:text-white transition p-1" title="Admin Panel">
              <i className="fas fa-shield-halved"></i>
            </button>
          )}
          <button onClick={onSignOut} className="hover:text-white transition p-1" title="Logout">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          <input 
            type="text"
            placeholder="Search circle..."
            className="w-full bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Groups</div>
        {loading ? (
          <div className="px-4 py-2 text-sm">Loading...</div>
        ) : (
          filteredGroups.map(group => (
            <button
              key={group.id}
              onClick={() => onSelectThread({ id: group.id, type: 'group', name: group.name, avatar_url: null })}
              className={`w-full flex items-center gap-3 px-4 py-3 transition hover:bg-slate-800 ${activeThread?.id === group.id ? 'bg-slate-800 border-l-4 border-indigo-500' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <i className="fas fa-users"></i>
              </div>
              <span className="font-medium text-slate-200">{group.name}</span>
            </button>
          ))
        )}

        <div className="px-4 py-2 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Friends</div>
        {filteredProfiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => onSelectThread({ id: profile.id, type: 'direct', name: profile.username, avatar_url: profile.avatar_url })}
            className={`w-full flex items-center gap-3 px-4 py-3 transition hover:bg-slate-800 ${activeThread?.id === profile.id ? 'bg-slate-800 border-l-4 border-indigo-500' : ''}`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <span className="font-medium text-slate-200">{profile.username}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full py-2 flex items-center justify-center gap-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all font-medium text-sm">
          <i className="fas fa-plus"></i> New Group
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
