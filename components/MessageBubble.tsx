
import React from 'react';
import { Message } from '../types';

interface Props {
  message: Message;
  isMine: boolean;
}

const MessageBubble: React.FC<Props> = ({ message, isMine }) => {
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {!isMine && message.profiles && (
        <span className="text-[10px] text-gray-400 font-bold uppercase mb-1 px-2">
          {message.profiles.username}
        </span>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
        isMine 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
      }`}>
        {/* Media Content */}
        {message.media_url && (
          <div className="mb-2 rounded-lg overflow-hidden border border-gray-200/20 shadow-sm">
            <img src={message.media_url} alt="Shared media" className="max-w-full max-h-60 object-contain cursor-pointer" />
          </div>
        )}

        {/* Audio Content */}
        {message.audio_url && (
          <div className={`mb-2 p-2 rounded-lg flex items-center gap-3 min-w-[200px] ${isMine ? 'bg-white/10' : 'bg-gray-50'}`}>
            <audio controls src={message.audio_url} className="h-8 w-full outline-none" />
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        
        <div className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
