
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Profile, ChatThread, Message } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface Props {
  currentProfile: Profile;
  thread: ChatThread;
}

const ChatWindow: React.FC<Props> = ({ currentProfile, thread }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat:${thread.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: thread.type === 'group' ? `group_id=eq.${thread.id}` : `sender_id=in.(${currentProfile.id},${thread.id}),receiver_id=in.(${currentProfile.id},${thread.id})`
      }, (payload) => {
        const newMessage = payload.new as Message;
        // Optimization: Ensure message belongs to current DM context if it's not a group
        if (thread.type === 'direct') {
          if ((newMessage.sender_id === currentProfile.id && newMessage.receiver_id === thread.id) || 
              (newMessage.sender_id === thread.id && newMessage.receiver_id === currentProfile.id)) {
            appendMessage(newMessage);
          }
        } else {
          appendMessage(newMessage);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread, currentProfile.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    let query = supabase.from('messages').select('*, profiles:sender_id(*)');

    if (thread.type === 'group') {
      query = query.eq('group_id', thread.id);
    } else {
      query = query.or(`and(sender_id.eq.${currentProfile.id},receiver_id.eq.${thread.id}),and(sender_id.eq.${thread.id},receiver_id.eq.${currentProfile.id})`);
    }

    const { data } = await query.order('created_at', { ascending: true });
    if (data) setMessages(data as any);
    setLoading(false);
  };

  const appendMessage = (msg: Message) => {
    setMessages(prev => {
      if (prev.find(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, mediaUrl?: string, audioUrl?: string) => {
    const newMessage: Partial<Message> = {
      sender_id: currentProfile.id,
      content,
      media_url: mediaUrl,
      audio_url: audioUrl,
      created_at: new Date().toISOString(),
    };

    if (thread.type === 'group') {
      newMessage.group_id = thread.id;
    } else {
      newMessage.receiver_id = thread.id;
    }

    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) console.error('Error sending message:', error);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
            {thread.avatar_url ? (
               <img src={thread.avatar_url} className="w-full h-full object-cover" />
            ) : thread.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-none">{thread.name}</h3>
            <p className="text-xs text-green-500 font-medium mt-1">Online</p>
          </div>
        </div>
        <div className="flex gap-4 text-gray-400">
          <button className="hover:text-indigo-600 transition"><i className="fas fa-phone"></i></button>
          <button className="hover:text-indigo-600 transition"><i className="fas fa-video"></i></button>
          <button className="hover:text-indigo-600 transition"><i className="fas fa-info-circle"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
              <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
              <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isMine={msg.sender_id === currentProfile.id} />
            ))}
            <div ref={scrollRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
