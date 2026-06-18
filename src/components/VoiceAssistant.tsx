'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '@/lib/financeStore';

export default function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const accentColor = useFinanceStore(state => state.accentColor);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedbackText('Listening...');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setFeedbackText('Microphone error');
      setTimeout(() => setFeedbackText(''), 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setFeedbackText('Thinking...');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      const data = await response.json();
      setFeedbackText(data.replyText || 'Done');
      
      if (data.audioBase64) {
        // Play the audio returned directly by Gemini
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.play().catch(e => {
          console.error('Failed to play native audio:', e);
          playTTS(data.replyText); // Fallback to browser TTS
        });
      } else {
        // Fallback to browser Text-to-Speech
        playTTS(data.replyText);
      }
      
      // Clear feedback after a few seconds
      setTimeout(() => setFeedbackText(''), 5000);
    } catch (error) {
      console.error('Error processing audio:', error);
      setFeedbackText('Sorry, something went wrong.');
      setTimeout(() => setFeedbackText(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    // You can customize voice here if needed
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-24 right-6 lg:bottom-28 lg:right-8 z-40 flex flex-col items-end group" data-accent={accentColor}>
      {feedbackText && (
        <div className="mb-2 bg-slate-900/90 border border-outline-variant/65 text-on-primary text-xs font-bold px-3 py-2 rounded-xl shadow-xl backdrop-blur-md animate-fade-in text-center max-w-xs break-words">
          {feedbackText}
        </div>
      )}

      <button
        type="button"
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-glow transition-all duration-300 cursor-pointer relative overflow-hidden ${
          isRecording ? 'bg-red-500 scale-110 animate-pulse' : isProcessing ? 'bg-amber-500 opacity-80 cursor-wait' : 'bg-primary hover:scale-110 active:scale-95'
        }`}
        title="Hold to speak to AI Assistant"
        aria-label="Voice AI Assistant"
        disabled={isProcessing}
      >
        {!isRecording && !isProcessing && (
          <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        )}
        <span className="material-symbols-outlined text-2xl font-black">
          {isRecording ? 'mic' : isProcessing ? 'hourglass_empty' : 'mic_none'}
        </span>
      </button>
    </div>
  );
}
