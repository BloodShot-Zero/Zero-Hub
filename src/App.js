import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [mode, setMode] = useState('anime'); 
  const [view, setView] = useState('landing'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); 
  const [searchResults, setSearchResults] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [fullLibrary, setFullLibrary] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });

  // --- 2. ACCOUNT & HISTORY ---
  const [user, setUser] = useState({
    watchlist: [],
    historyAnime: [],
    historyHentai: []
  });

  // --- 3. INITIALIZATION & STORAGE ---
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("zero_hub_user")) || {
      watchlist: [], historyAnime: [], historyHentai: []
    };
    setUser(savedUser);
  }, []);

  useEffect(() => {
    localStorage.setItem("zero_hub_user", JSON.stringify(user));
  }, [user]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const fetchData = useCallback(async (isFull = false) => {
    setLoading(true);
    try {
      let url = "";
      if (mode === 'anime') {
        url = isFull 
          ? `https://api.jikan.moe/v4/anime?order_by=popularity&sort=asc&limit=24`
          : `https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=8`;
      } else {
        // Hentai Haven Data Logic
        url = isFull
          ? `https://api.jikan.moe/v4/anime?rating=rx&order_by=popularity&sort=asc&limit=24`
          : `https://api.jikan.moe/v4/anime?rating=rx&order_by=popularity&sort=desc&limit=8`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (isFull) setFullLibrary(data.data || []);
      else setFeaturedList(data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    if (view !== 'landing') {
      fetchData(view === 'all');
      if (view === 'home') {
        const fetchSchedule = async () => {
          const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
          const today = days[new Date().getDay()];
          const res = await fetch(`https://api.jikan.moe/v4/schedules?filter=${today}&limit=8`);
          const data = await res.json();
          setSchedule(data.data || []);
        };
        fetchSchedule();
      }
    }
  }, [view, mode, fetchData]);

  // --- 4. SEARCH ---
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      let url = `https://api.jikan.moe/v4/anime?q=${searchQuery}&limit=10`;
      if (mode === 'hentai') url += `&rating=rx`;
      if (searchFilter !== 'all') url += `&type=${searchFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data.data || []);
    }, 600);
    return () => clearTimeout(delay);
  }, [searchQuery, searchFilter, mode]);

  // --- 5. ACTIONS ---
  const enterApp = (m) => { setMode(m); setView('home'); };

  const playItem = (item, ep = 1) => {
    setSelectedAnime(item);
    setCurrentEpisode(ep);
    setView('detail');
    const historyKey = mode === 'anime' ? 'historyAnime' : 'historyHentai';
    setUser(prev => ({
      ...prev,
      [historyKey]: [{ malId: item.mal_id, title: item.title_english || item.title, image: item.images.jpg.image_url, ep, data: item }, 
      ...prev[historyKey].filter(x => x.malId !== item.mal_id)].slice(0, 10)
    }));
  };

  const addToWatchlist = (item) => {
    if (user.watchlist.some(x => x.mal_id === item.mal_id)) {
      showToast("Already in Watchlist!");
      return;
    }
    setUser(prev => ({ ...prev, watchlist: [...prev.watchlist, item] }));
    showToast("Added to Watchlist! ✅");
  };

  const getPlayerUrl = () => {
    if (mode === 'hentai') {
      // Hentai Haven Player Logic
      const slug = (selectedAnime.title_english || selectedAnime.title).toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
      return `https://hentaihaven.com/embed/${slug}/`; 
    }
    return `https://megaplay.buzz/stream/mal/${selectedAnime.mal_id}/${currentEpisode}/sub`;
  };

  // --- 6. RENDER ---
  const renderCard = (item) => (
    <div key={item.mal_id} className="anime-card" onClick={() => playItem(item)}>
      <div className="card-image-wrap">
        <img src={item.images.jpg.large_image_url} alt="" />
        <div className="card-badge">⭐ {item.score ? item.score.toFixed(2) : '0.00'}/10</div>
      </div>
      <div className="anime-info">
        <div className="anime-name">{item.title_english || item.title}</div>
      </div>
    </div>
  );

  return (
    <div className="app-root">
      {toast.show && <div className="toast-notify">{toast.msg}</div>}

      {view === 'landing' && (
        <div className="landing">
          <h1 className="hero-title">⚡ ZERO HUB</h1>
          <div className="gate-wrapper">
            <div className="gate-card" onClick={() => enterApp('anime')}>
              <img src="https://i.ibb.co/nNg1X5Hb/images-96.jpg" alt="" />
              <div className="gate-overlay"><h2>📺 Anime</h2></div>
            </div>
            <div className="gate-card" onClick={() => enterApp('hentai')}>
              <img src="https://i.ibb.co/Ng8mV3sn/IMG-20260514-175823.jpg" alt="" />
              <div className="gate-overlay"><h2>🔞 Hentai</h2></div>
            </div>
          </div>
        </div>
      )}

      {view !== 'landing' && (
        <div className="app-container" style={{ display: 'block' }}>
          <div className="topbar">
            <div className="logo" onClick={() => setView('home')}>⚡ ZERO {mode.toUpperCase()}</div>
            <div className="nav">
              <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>🏠 Home</button>
              <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>📚 All {mode.toUpperCase()}</button>
              <button className={view === 'watchlist' ? 'active' : ''} onClick={() => setView('watchlist')}>🔖 Watchlist</button>
              <button onClick={async () => {
                const res = await fetch(`https://api.jikan.moe/v4/random/anime${mode === 'hentai' ? '?rating=rx' : ''}`);
                const data = await res.json();
                playItem(data.data);
              }}>🎲 Surprise Me</button>
              <button id="exitBtn" onClick={() => setView('landing')}>🚪 Exit</button>
            </div>
          </div>

          <div className="search-wrap">
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <div className="filter-box">
                <select value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="tv">TV</option>
                  <option value="movie">Movies</option>
                  <option value="ova">OVA</option>
                </select>
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results" style={{ display: 'block' }}>
                {searchResults.map(item => (
                  <div key={item.mal_id} className="search-item" onClick={() => { playItem(item); setSearchQuery(''); }}>
                    <img src={item.images?.jpg?.image_url} alt="" />
                    <div><div style={{ fontWeight: 700 }}>{item.title_english || item.title}</div><div style={{ fontSize: '0.8rem' }}>⭐ {item.score || '0.00'}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {view === 'home' && (
            <div className="page active-page">
              <div className="home-layout">
                <div>
                  {(mode === 'anime' ? user.historyAnime : user.historyHentai).length > 0 && (
                    <div className="continue-section">
                      <div className="section-title"><span className="line"></span>▶️ Continue Watching</div>
                      <div className="continue-grid">
                        {(mode === 'anime' ? user.historyAnime : user.historyHentai).map(item => (
                          <div key={item.malId} className="continue-card" onClick={() => playItem(item.data, item.ep)}>
                            <img src={item.image} alt="" />
                            <div className="continue-info"><div>{item.title}</div><div className="continue-meta">EP {item.ep}</div></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="section-title"><span className="line"></span>🔥 Trending {mode.toUpperCase()}</div>
                  <div className="anime-grid">{featuredList.map(renderCard)}</div>
                  <button className="back-btn" style={{marginTop:'20px'}} onClick={() => setView('all')}>See More →</button>
                </div>
                <div className="schedule-box">
                  <div className="section-title"><span className="line"></span>🗓️ Daily Release</div>
                  {schedule.map(item => (
                    <div key={item.mal_id} className="schedule-item" onClick={() => playItem(item)}>
                      <div className="schedule-title">{item.title_english || item.title}</div>
                      <div className="schedule-time">🕒 {item.broadcast.time || "Airing"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'all' && (
            <div className="page active-page">
              <div className="section-title"><span className="line"></span>📚 Full {mode.toUpperCase()} Library</div>
              <div className="anime-grid">{fullLibrary.map(renderCard)}</div>
            </div>
          )}

          {view === 'watchlist' && (
            <div className="page active-page">
              <div className="section-title"><span className="line"></span>🔖 My Watchlist</div>
              <div className="anime-grid">{user.watchlist.map(renderCard)}</div>
            </div>
          )}

          {view === 'detail' && selectedAnime && (
            <div className="page active-page">
              <button className="back-btn" onClick={() => setView('home')}>← Back</button>
              <div className="detail-layout">
                <div className="player-section">
                  <div className="player-box">
                    <div className="player-container">
                       <iframe src={getPlayerUrl()} allowFullScreen title="ZeroPlayer" scrolling="no" />
                    </div>
                  </div>
                  <div className="player-controls">
                    <button className="control-btn" onClick={() => addToWatchlist(selectedAnime)}>
                      {user.watchlist.some(x => x.mal_id === selectedAnime.mal_id) ? "Saved ✅" : "Save Watchlist 🔖"}
                    </button>
                    <button className="control-btn" onClick={() => playItem(selectedAnime, currentEpisode + 1)}>Next Episode ⏭️</button>
                  </div>
                  <div className="episode-list">
                    {[...Array(selectedAnime.episodes || 12)].map((_, i) => (
                      <button key={i} className={`episode-btn ${currentEpisode === i + 1 ? 'active' : ''}`} onClick={() => setCurrentEpisode(i+1)}>EP {i+1}</button>
                    ))}
                  </div>
                </div>
                <div className="sidebar">
                  <h2>{selectedAnime.title_english || selectedAnime.title}</h2>
                  <div className="meta-grid">
                    <div className="meta-item"><div className="meta-label">Rating</div><div>⭐ {selectedAnime.score || '0.00'}/10</div></div>
                    <div className="meta-item"><div className="meta-label">Type</div><div>{selectedAnime.type}</div></div>
                  </div>
                  <p className="synopsis">{selectedAnime.synopsis}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;