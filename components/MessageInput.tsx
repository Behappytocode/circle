
import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';

interface Props {
  onSend: (content: string, mediaUrl?: string, audioUrl?: string) => void;
}

const MessageInput: React.FC<Props> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !uploading) return;
    onSend(text);
    setText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
    } else if (data) {
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);
      onSend('', publicUrl);
    }
    setUploading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        const fileName = `voice-${Date.now()}.webm`;
        const { data, error } = await supabase.storage
          .from('audio')
          .upload(fileName, audioBlob);

        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(data.path);
          onSend('', undefined, publicUrl);
        }
        setUploading(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
          >
            <i className="fas fa-image text-xl"></i>
          </button>
          
          <button 
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <i className="fas fa-microphone text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
             <textarea 
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRecording ? "Recording voice note..." : "Type a message..."}
              className="w-full max-h-32 p-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-300 outline-none transition resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <button 
            type="submit"
            disabled={(!text.trim() && !uploading) || isRecording}
            className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition shadow-lg active:scale-90 disabled:opacity-50 disabled:scale-100"
          >
            {uploading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane text-lg"></i>
            )}
          </button>
        </form>
      </div>
      {isRecording && <p className="text-[10px] text-red-500 font-bold ml-24 uppercase tracking-wider animate-pulse">Release to send audio</p>}
    </div>
  );
};

export default MessageInput;
