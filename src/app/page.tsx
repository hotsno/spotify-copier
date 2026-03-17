"use client";

import { useState } from "react";

interface Track {
  artist: string;
  title: string;
  album: string;
}

function TrackField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-700 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 px-3 py-1.5 text-sm rounded-md bg-green-600 hover:bg-green-500 text-white transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTrack(null);

    try {
      const res = await fetch(`/api/track?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setTrack(data);
      }
    } catch {
      setError("Failed to fetch track");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          <span className="text-green-500">Spotify</span> Copier
        </h1>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a Spotify track URL..."
            className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {loading ? "..." : "Fetch"}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {track && (
          <div className="bg-gray-800 rounded-xl px-5 py-2 border border-gray-700">
            <TrackField label="Title" value={track.title} />
            <TrackField label="Artist" value={track.artist} />
            <TrackField label="Album" value={track.album} />
          </div>
        )}
      </div>
    </main>
  );
}
