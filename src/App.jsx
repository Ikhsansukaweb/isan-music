import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Search, Flame, Music2, Loader2 } from 'lucide-react';

const API_BASE = 'https://isanim.web.id/api/music';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('Trending Sekarang');

  const playerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    fetchTrending();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initPlayer = () => {
    if (window.YT && !playerRef.current) {
      playerRef.current = new window.YT.Player('yt-hidden-player', {
        height: '0',
        width: '0',
        playerVars: { autoplay: 1, controls: 0, disablekb: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTracker();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopTracker();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              handleNext();
            }
          }
        }
      });
    }
  };

  const startTracker = () => {
    stopTracker();
    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      }
    }, 500);
  };

  const stopTracker = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fetchTrending = async () => {
    setLoading(true);
    setTitle('Trending Sekarang');
    try {
      const res = await fetch(`${API_BASE}/trending`);
      const data = await res.json();
      setSongs(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setTitle(`Hasil: "${searchQuery}"`);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&limit=24`);
      const data = await res.json();
      setSongs(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSong = (song) => {
    setCurrentSong(song);
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(song.videoId);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleNext = () => {
    if (!songs.length || !currentSong) return;
    const idx = songs.findIndex(s => s.videoId === currentSong.videoId);
    const nextIdx = (idx + 1) % songs.length;
    playSong(songs[nextIdx]);
  };

  const handlePrev = () => {
    if (!songs.length || !currentSong) return;
    const idx = songs.findIndex(s => s.videoId === currentSong.videoId);
    const prevIdx = (idx - 1 + songs.length) % songs.length;
    playSong(songs[prevIdx]);
  };

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setProgress(val);
    if (playerRef.current && duration > 0) {
      const pos = (val / 100) * duration;
      playerRef.current.seekTo(pos, true);
    }
  };

  const handleVolume = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(val);
    }
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide">ISAN MUSIC</h1>
            <p className="text-xs text-gray-400">Stream musik santai & cepat</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full max-w-md mx-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lagu, artis, atau judul..."
            className="w-full bg-gray-800/80 border border-gray-700/60 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 text-gray-200 placeholder-gray-500"
          />
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {title.startsWith('Trending') ? <Flame className="w-5 h-5 text-red-500" /> : <Search className="w-5 h-5 text-red-500" />}
            {title}
          </h2>
          {title !== 'Trending Sekarang' && (
            <button
              onClick={() => { setSearchQuery(''); fetchTrending(); }}
              className="text-xs text-red-400 hover:underline"
            >
              Kembali ke Trending
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm">Memuat daftar lagu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {songs.map((song) => (
              <div
                key={song.videoId}
                onClick={() => playSong(song)}
                className="glass p-3 rounded-2xl cursor-pointer group hover:-translate-y-1 transition duration-200"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-800">
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-sm truncate text-gray-100">{song.title}</h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">{song.artist || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Hidden YouTube Player */}
      <div id="yt-hidden-player" className="hidden pointer-events-none" />

      {/* Bottom Player Bar */}
      <div className="fixed bottom-0 inset-x-0 glass-player px-6 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
          {currentSong ? (
            <img src={currentSong.thumbnailUrl} className="w-12 h-12 rounded-lg object-cover bg-gray-800 border border-gray-700" alt="Cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 border border-gray-700">
              <Music2 className="w-6 h-6" />
            </div>
          )}
          <div className="truncate">
            <h4 className="font-semibold text-sm truncate text-gray-100">{currentSong?.title || 'Pilih lagu'}</h4>
            <p className="text-xs text-gray-400 truncate">{currentSong?.artist || 'Isan Music'}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-4">
            <button onClick={handlePrev} className="p-2 text-gray-400 hover:text-white transition">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button onClick={handleNext} className="p-2 text-gray-400 hover:text-white transition">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full flex items-center gap-2 text-[11px] text-gray-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 w-1/4">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolume}
            className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>
    </div>
  );
}
