
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';

interface Props {
  currentProfile: Profile;
}

const AdminPanel: React.FC<Props> = ({ currentProfile }) => {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('status', 'approved');
    if (data) setPendingUsers(data);
    setLoading(false);
  };

  const updateStatus = async (userId: string, status: 'approved' | 'banned') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    
    if (error) alert(error.message);
    else fetchPending();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
          <i className="fas fa-shield-halved"></i>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Control</h1>
          <p className="text-gray-500">Manage circle access and member status</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Access Requests</h2>
          <button onClick={fetchPending} className="text-indigo-600 hover:text-indigo-800 transition">
             <i className="fas fa-rotate"></i>
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
             <div className="p-10 text-center text-gray-400">Loading requests...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
               <i className="fas fa-check-circle text-4xl mb-3 block opacity-20"></i>
               No pending requests at the moment.
            </div>
          ) : (
            pendingUsers.map(user => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-gray-500">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{user.username}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${user.status === 'banned' ? 'text-red-500' : 'text-amber-500'}`}>
                      {user.status}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateStatus(user.id, 'approved')}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => updateStatus(user.id, 'banned')}
                    className="px-4 py-1.5 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition"
                  >
                    Ban
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
