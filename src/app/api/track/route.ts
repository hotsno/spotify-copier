export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  const match = url?.match(/track\/([a-zA-Z0-9]+)/);
  if (!match) {
    return Response.json({ error: "Invalid Spotify track URL" }, { status: 400 });
  }
  const trackId = match[1];

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      return Response.json({ error: "Failed to authenticate with Spotify" }, { status: 500 });
    }

    const { access_token } = await tokenRes.json();

    const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!trackRes.ok) {
      return Response.json({ error: "Track not found" }, { status: trackRes.status });
    }

    const data = await trackRes.json();
    const artist = data.artists.map((a: { name: string }) => a.name).join(", ");
    const title = data.name;
    const album = data.album.name;

    return Response.json({ artist, title, album });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
