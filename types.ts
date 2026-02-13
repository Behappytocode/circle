
export type UserStatus = 'pending' | 'approved' | 'banned';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  status: UserStatus;
  is_admin: boolean;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  group_id: string | null;
  content: string | null;
  media_url: string | null;
  audio_url: string | null;
  created_at: string;
  profiles?: Profile; // Joined data
}

export interface ChatThread {
  id: string;
  type: 'direct' | 'group' | 'ai';
  name: string;
  avatar_url: string | null;
}
