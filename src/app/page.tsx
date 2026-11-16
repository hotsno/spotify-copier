"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Track {
  artist: string;
  title: string;
  album: string;
  cover: string | null;
  year: string | null;
}

const SPOTIFY_TRACK = /track[/:][a-zA-Z0-9]+/;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback(async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1400);
  }, []);

  return { copied, copy };
}

function Row({
  index,
  label,
  value,
  copied,
  onCopy,
}: {
  index: number;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="group grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-4 border-t border-line last:border-b py-3.5 text-left w-full focus-visible:outline-none"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <span className="truncate text-[15px] transition-opacity group-hover:opacity-60 group-active:opacity-40">{value}</span>
      <span className="font-mono text-[11px] text-muted">
        {copied ? (
          <span className="text-fg">Copied</span>
        ) : (
          <>
            <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Copy
            </span>
            <kbd className="ml-2 hidden font-mono sm:inline">{index}</kbd>
          </>
        )}
      </span>
    </button>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const { copied, copy } = useCopy();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTrack = useCallback(async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/track?url=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setTrack(null);
      } else {
        setTrack(data);
        inputRef.current?.blur();
      }
    } catch {
      setError("Couldn't reach the server");
      setTrack(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fields = track
    ? [
        { key: "title", label: "Title", value: track.title },
        { key: "artist", label: "Artist", value: track.artist },
        { key: "album", label: "Album", value: track.album },
      ]
    : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = Number(e.key) - 1;
      if (fields[i]) {
        e.preventDefault();
        copy(fields[i].key, fields[i].value);
      } else if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pt-[24vh] pb-16">
      <h1 className="mb-6 text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-balance">
        Copy a song&apos;s title, artist, or album
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchTrack(url);
        }}
        className="relative"
      >
        <input
          ref={inputRef}
          type="text"
          value={url}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setUrl(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (SPOTIFY_TRACK.test(pasted)) {
              e.preventDefault();
              setUrl(pasted);
              fetchTrack(pasted);
            }
          }}
          placeholder="open.spotify.com/track/…"
          aria-label="Spotify track URL"
          className={`h-12 w-full rounded-xl border border-line bg-field px-4 text-base shadow-[0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-muted/80 transition-colors focus:border-muted focus:outline-none ${loading ? "pr-11" : ""}`}
        />
        {loading && (
          <span className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 animate-spin rounded-full border-[1.5px] border-line border-t-fg" />
        )}
      </form>

      <div className="mt-2 h-5 text-[13px]">
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {track && (
        <section key={track.title + track.artist} className="rise mt-6">
          <div className="mb-8 flex items-center gap-5">
            {track.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.cover}
                alt=""
                width={72}
                height={72}
                className="size-[72px] shrink-0 rounded-[3px] bg-hover object-cover"
              />
            ) : (
              <div className="size-[72px] shrink-0 rounded-[3px] bg-hover" />
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-medium leading-snug tracking-tight">
                {track.title}
              </p>
              <p className="truncate text-sm text-muted">
                {track.artist}
                {track.year && <span> · {track.year}</span>}
              </p>
            </div>
          </div>

          <div>
            {fields.map((f, i) => (
              <Row
                key={f.key}
                index={i + 1}
                label={f.label}
                value={f.value}
                copied={copied === f.key}
                onCopy={() => copy(f.key, f.value)}
              />
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
