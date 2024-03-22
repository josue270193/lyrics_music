import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>    
    <h1>LyricsMusic</h1>
    
    <div class="card">              
        <h1>Playing</h1>
        <section id="player">
            <h2><span id="trackName"></span></h2>
            <h3><span id="artistName"></span></h3>
            <h3><span id="albumName"></span></h3>            
        </section>      
        <section id="lyrics">
            <span id="lyrics_image"></span>
            <span id="lyrics_content"></span>
        </section>
    </div>       
    
    <div class="card">
        <p>Host: ${import.meta.env.VITE_HOST_URL}</p>
        <p>Spotify API Key: ${import.meta.env.VITE_SPOTIFY_API_KEY}</p>
    </div>
    
    <div class="card">              
        <h1>Profile</h1>
        <section id="profile">
            <h2>Logged in as <span id="displayName"></span></h2>
            <span id="avatar"></span>
            <ul>
                <li>User ID: <span id="id"></span></li>
                <li>Email: <span id="email"></span></li>
                <li>Spotify URI: <a id="uri" href="#"></a></li>
                <li>Link: <a id="url" href="#"></a></li>
                <li>Profile Image: <span id="imgUrl"></span></li>
            </ul>
        </section>      
    </div>
  </div>
`

let token = localStorage.getItem("token");

if (!token) {
    const clientId = import.meta.env.VITE_SPOTIFY_API_KEY;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code")

    if (!code) {
        redirectToAuthCodeFlow(clientId);
    } else {
        token = await getAccessToken(clientId, code);
    }
}

if (token) {
    const profile = await fetchProfile(token);
    populateProfile(profile);

    const player = await fetchPlayer(token);
    populatePlayer(player)

    const lyrics = await fetchLyrics(player);
    populatePlayerLyrics(lyrics)
}


async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", import.meta.env.VITE_HOST_URL + "/callback");
    params.append("scope", "user-read-private user-read-email user-read-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}


function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getAccessToken(clientId: string, code: string) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", import.meta.env.VITE_HOST_URL + "/callback");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();

    localStorage.setItem("token", access_token);

    return access_token;
}

async function fetchProfile(token: string): Promise<UserProfile> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchPlayer(token: any): Promise<Player> {
    const result = await fetch("https://api.spotify.com/v1/me/player", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchLyrics(player: Player) : Promise<LyricsObject> {
    const songName = player.item!.name;
    const artistName = player.item!.artists[0]!.name;
    const result = await fetch(`https://lyrist.vercel.app/api/${songName}/${artistName}`, {
        method: "GET"
    });

    return await result.json();
}

function populateProfile(profile: UserProfile) {
    document.getElementById("displayName")!.innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar")!.appendChild(profileImage);
    }
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
}

function populatePlayer(player: Player) {
    document.getElementById("trackName")!.innerText = player.item!.name;
    document.getElementById("artistName")!.innerText = player.item!.artists[0]!.name;
    document.getElementById("albumName")!.innerText = player.item!.album.name;
}

function populatePlayerLyrics(lyrics: LyricsObject) {
    const lyricsImage = new Image(200, 200);
    lyricsImage.src = lyrics.image;
    document.getElementById("lyrics_image")!.appendChild(lyricsImage);
    document.getElementById("lyrics_content")!.innerText = lyrics.lyrics;
}

