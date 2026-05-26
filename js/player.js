// CraftDoc v2 — Background Music Player
// Default state: PAUSED + MUTED (respects user bandwidth and autoplay policies).
// Songs are loaded from Pixabay CDN (royalty-free).
// ⚠ Some Pixabay direct URLs may return 403 from certain edges — see README for how to swap them
//   for local files placed in /img or /audio (or any other CDN of your choice).

(function () {
  const PLAYLIST = [
    {
      title: 'Piano Ambient 1',
      src: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'
    },
    {
      title: 'Lo-Fi Chill 1',
      src: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668ca0.mp3'
    },
    {
      title: 'Piano Ambient 2',
      src: 'https://cdn.pixabay.com/audio/2023/02/28/audio_550d815fa8.mp3'
    },
    {
      title: 'Ambient Study',
      src: 'https://cdn.pixabay.com/audio/2024/09/13/audio_b8052a57b3.mp3'
    },
    {
      title: 'Peaceful Piano',
      src: 'https://cdn.pixabay.com/audio/2024/11/15/audio_b5fcd5b1b8.mp3'
    }
  ];

  let current = 0;
  let muted = true;   // default muted
  let playing = false;

  function buildPlayer() {
    // Floating button in bottom-right
    const toggle = document.createElement('button');
    toggle.id = 'player-toggle';
    toggle.className = 'player-toggle';
    toggle.setAttribute('aria-label', 'Toggle music');
    toggle.innerHTML = '🎵';

    const panel = document.createElement('div');
    panel.id = 'player-panel';
    panel.className = 'player-panel';

    // Audio element
    const audio = document.createElement('audio');
    audio.id = 'player-audio';
    audio.loop = false;

    // Controls
    const controls = document.createElement('div');
    controls.className = 'player-controls';

    const btnPrev = document.createElement('button');
    btnPrev.innerHTML = '⏮';
    btnPrev.title = 'Previous';
    btnPrev.addEventListener('click', () => loadSong((current - 1 + PLAYLIST.length) % PLAYLIST.length));

    const btnPlay = document.createElement('button');
    btnPlay.id = 'player-play';
    btnPlay.innerHTML = '▶';
    btnPlay.title = 'Play/Pause';
    btnPlay.addEventListener('click', togglePlayPause);

    const btnNext = document.createElement('button');
    btnNext.innerHTML = '⏭';
    btnNext.title = 'Next';
    btnNext.addEventListener('click', () => loadSong((current + 1) % PLAYLIST.length));

    const btnMute = document.createElement('button');
    btnMute.id = 'player-mute';
    btnMute.innerHTML = '🔇';
    btnMute.title = 'Mute/Unmute';
    btnMute.addEventListener('click', toggleMute);

    controls.append(btnPrev, btnPlay, btnNext, btnMute);

    // Playlist
    const list = document.createElement('div');
    list.className = 'player-list';
    PLAYLIST.forEach((song, i) => {
      const item = document.createElement('button');
      item.className = 'player-list-item' + (i === 0 ? ' active' : '');
      item.textContent = song.title;
      item.addEventListener('click', () => loadSong(i));
      list.appendChild(item);
    });

    // Volume slider
    const volWrap = document.createElement('div');
    volWrap.className = 'player-vol';
    volWrap.innerHTML = '🔇 <input type="range" id="player-vol" min="0" max="1" step="0.05" value="0"> <span id="player-vol-label">0%</span>';
    volWrap.querySelector('input').addEventListener('input', (e) => {
      audio.volume = parseFloat(e.target.value);
      muted = audio.volume === 0;
      updateMuteBtn();
    });

    panel.append(controls, volWrap, list);
    document.body.append(audio, toggle, panel);

    audio.addEventListener('ended', () => {
      loadSong((current + 1) % PLAYLIST.length);
      if (playing) audio.play().catch(() => {});
    });

    toggle.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    loadSong(0);
  }

  function loadSong(index) {
    current = index;
    const audio = document.getElementById('player-audio');
    audio.src = PLAYLIST[index].src;
    audio.volume = muted ? 0 : (audio.volume || 0.5);
    audio.load();
    playing = false;
    updatePlayBtn();
    updateListActive();
  }

  function togglePlayPause() {
    const audio = document.getElementById('player-audio');
    if (playing) {
      audio.pause();
      playing = false;
    } else {
      audio.play().then(() => { playing = true; }).catch(() => {});
    }
    updatePlayBtn();
  }

  function toggleMute() {
    muted = !muted;
    const audio = document.getElementById('player-audio');
    audio.muted = muted;
    updateMuteBtn();
  }

  function updatePlayBtn() {
    const btn = document.getElementById('player-play');
    if (btn) btn.innerHTML = playing ? '⏸' : '▶';
  }

  function updateMuteBtn() {
    const btn = document.getElementById('player-mute');
    if (btn) btn.innerHTML = muted ? '🔇' : '🔊';
  }

  function updateListActive() {
    document.querySelectorAll('.player-list-item').forEach((el, i) => {
      el.classList.toggle('active', i === current);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPlayer);
  } else {
    buildPlayer();
  }
})();
