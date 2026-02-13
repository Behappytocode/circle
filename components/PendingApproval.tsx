
import React from 'react';
import { Profile } from '../types';
import { supabase } from '../supabase';

interface Props {
  profile: Profile;
  onRefresh: () => void;
}

const PendingApproval: React.FC<Props> = ({ profile, onRefresh }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border-t-4 border-amber-400">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-clock text-4xl text-amber-500 animate-pulse"></i>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Hello, {profile.username}!</h1>
        <p className="text-gray-600 mt-4 leading-relaxed">
          Welcome to the circle. Your account is currently <strong>pending approval</strong> from an administrator.
        </p>
        <p className="text-sm text-gray-500 mt-4 italic">
          Please wait for a member to verify your identity.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={onRefresh}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Check Status
          </button>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
