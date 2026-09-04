/**
 * Sample Media and Mock Generators for Ahmed Reaction Studio
 */

export interface SampleMediaItem {
  id: string;
  name: string;
  category: 'video' | 'audio' | 'image';
  duration: number;
  url: string;
  description: string;
  badge: string;
}

// Sample video sources with reliable public test streams / procedural fallbacks
export const SAMPLE_VIDEOS: SampleMediaItem[] = [
  {
    id: 'sample-tech-reveal',
    name: 'Tech Gadget Unboxing',
    category: 'video',
    duration: 32,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'High-energy tech video clip ideal for reaction review',
    badge: '1080p 60fps'
  },
  {
    id: 'sample-nature-epic',
    name: 'Epic Landscape Trailer',
    category: 'video',
    duration: 15,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'Cinematic visual scenery with rich audio',
    badge: 'Cinematic'
  },
  {
    id: 'sample-animation-fun',
    name: 'Animated Comedy Short',
    category: 'video',
    duration: 12,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Animated short for funny moments reaction',
    badge: 'Animation'
  },
  {
    id: 'sample-big-buck',
    name: 'Big Buck Bunny Clip',
    category: 'video',
    duration: 60,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Open source 3D animated master clip with stereo audio',
    badge: 'HD Stereo'
  }
];

/**
 * Creates a procedural animated canvas video stream for testing camera/reaction commentator.
 * Useful when running in headless environments, in iframes without camera permissions,
 * or when testing multiple camera feeds on Android/Termux.
 */
export function createProceduralCommentatorStream(name: string = 'Host Cam', avatarColor: string = '#0ea5e9'): {
  stream: MediaStream;
  stop: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  let animationFrameId: number;
  let t = 0;
  
  // Also create a synthetic audio track with a subtle microphone hum/ambient pulse
  let audioContext: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      audioDestination = audioContext.createMediaStreamDestination();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3 note
      gainNode.gain.setValueAtTime(0.015, audioContext.currentTime); // Very quiet ambient tone
      
      oscillator.connect(gainNode);
      gainNode.connect(audioDestination);
      oscillator.start();
    }
  } catch {
    // Audio context may require user interaction; silent fallback is fine
  }

  const draw = () => {
    if (!ctx) return;
    t += 0.04;
    
    // Studio gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Studio lighting ring
    ctx.beginPath();
    ctx.arc(320, 240, 180 + Math.sin(t * 2) * 6, 0, Math.PI * 2);
    ctx.strokeStyle = avatarColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = avatarColor;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Animated commentator avatar (head & body)
    const bobbing = Math.sin(t * 3) * 8;
    
    // Shoulders
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(320, 390 + bobbing * 0.5, 120, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(320, 220 + bobbing, 65, 0, Math.PI * 2);
    ctx.fill();
    
    // Headset / Studio Headphones
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(320, 215 + bobbing, 70, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();
    
    // Earcups
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(240, 205 + bobbing, 16, 32);
    ctx.fillRect(384, 205 + bobbing, 16, 32);
    
    // Microphone boom
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(250, 225 + bobbing);
    ctx.lineTo(295, 255 + bobbing);
    ctx.stroke();
    ctx.fillStyle = '#ef4444'; // Red recording mic tip
    ctx.beginPath();
    ctx.arc(295, 255 + bobbing, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes with blinking
    const isBlink = Math.sin(t * 0.8) > 0.95;
    ctx.fillStyle = '#0f172a';
    if (!isBlink) {
      ctx.beginPath();
      ctx.arc(302, 215 + bobbing, 6, 0, Math.PI * 2);
      ctx.arc(338, 215 + bobbing, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(296, 215 + bobbing, 12, 2);
      ctx.fillRect(332, 215 + bobbing, 12, 2);
    }
    
    // Animated mouth talking
    const mouthOpen = 4 + Math.abs(Math.sin(t * 6)) * 14;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(320, 250 + bobbing, 14, mouthOpen / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // On-air badge & audio waveform bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 20, 200, 48);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 200, 48);
    
    // Live dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(38, 44, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.toUpperCase(), 52, 49);
    
    // Simulated sound wave in lower corner
    for (let i = 0; i < 16; i++) {
      const barH = 4 + Math.abs(Math.sin(t * 5 + i * 0.4)) * 26;
      ctx.fillStyle = avatarColor;
      ctx.fillRect(canvas.width - 140 + i * 7, canvas.height - 25 - barH, 4, barH);
    }

    animationFrameId = requestAnimationFrame(draw);
  };

  draw();

  const videoStream = canvas.captureStream(30);
  if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
    const audioTrack = audioDestination.stream.getAudioTracks()[0];
    videoStream.addTrack(audioTrack);
  }

  const stop = () => {
    cancelAnimationFrame(animationFrameId);
    videoStream.getTracks().forEach(track => track.stop());
    if (oscillator) {
      try { oscillator.stop(); } catch {}
    }
    if (audioContext) {
      try { audioContext.close(); } catch {}
    }
  };

  return {
    stream: videoStream,
    stop
  };
}
