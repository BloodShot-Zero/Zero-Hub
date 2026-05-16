import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';

const hentaiSpotlightImages = [
  { image: 'https://i.ibb.co/Kcq5FzPX/IMG-20260514-175831.jpg', title: 'Hentai Spotlight 1' },
  { image: 'https://i.ibb.co/KjrK2PBZ/IMG-20260514-175823.jpg', title: 'Hentai Spotlight 2' },
  { image: 'https://i.ibb.co/xvQzR2X/image-13-1.png', title: 'Hentai Spotlight 3' },
  { image: 'https://i.ibb.co/tMfFSyq6/IMG-7988.jpg', title: 'Hentai Spotlight 4' },
  { image: 'https://i.ibb.co/9HTygXXD/IMG-5155.jpg', title: 'Hentai Spotlight 5' },
  { image: 'https://i.ibb.co/JRLj0mPg/images-77.jpg', title: 'Hentai Spotlight 6' },
  { image: 'https://i.ibb.co/qYd9gL4C/137674270-p18-master1200.jpg', title: 'Hentai Spotlight 7' }
];

const animeSpotlightImages = [
  { image: 'https://i.ibb.co/7tGT1kzp/images-114-1.jpg', title: 'Anime Spotlight 1' },
  { image: 'https://i.ibb.co/WNcnjWg4/89230a43504153a99d4bb9e8cc4ace8b.jpg', title: 'Anime Spotlight 2' },
  { image: 'https://i.ibb.co/kghsDVKD/Nier-Automata-Ver1-1a-kv.jpg', title: 'Anime Spotlight 3' },
  { image: 'https://i.ibb.co/kVpDqPz1/20260403-232410-1-1.jpg', title: 'Anime Spotlight 4' },
  { image: 'https://i.ibb.co/67cz9bbd/images-93.jpg', title: 'Anime Spotlight 5' },
  { image: 'https://i.ibb.co/KjWWYnDR/images-101.jpg', title: 'Anime Spotlight 6' },
  { image: 'https://i.ibb.co/LdgZrxxT/00000236.png', title: 'Anime Spotlight 7' }
];

const placeholderImage = 'https://via.placeholder.com/420x280/071828/70d6ff?text=No+Image';
const HENTAI_API = 'https://hentaiapi.com/api/v1';
const hentaiPlayerRoots = [
  'https://hentaistream.com/watch',
  'https://hentaistream.tv/watch',
  'https://hentaistream.org/watch',
  'https://hentaistream.cc/watch',
  'https://hentaistream.moe/watch',
  'https://hentaistream.app/watch',
  'https://hentaistream.one/watch'
];

function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const genreOptions = [
    { id: 'all', label: 'Genre' },
    { id: '1', label: 'Action' },
    { id: '2', label: 'Adventure' },
    { id: '4', label: 'Comedy' },
    { id: '8', label: 'Drama' },
    { id: '10', label: 'Fantasy' },
    { id: '14', label: 'Magic' },
    { id: '22', label: 'Romance' },
    { id: '24', label: 'Sci-Fi' },
    { id: '36', label: 'Slice of Life' },
    { id: '37', label: 'Sports' },
    { id: '40', label: 'Supernatural' }
  ];

  const parseRoute = (pathname) => {
    if (!pathname || pathname === '/') return { view: 'landing', mode: 'anime', malId: null };
    const segments = pathname.split('/').filter(Boolean);
    const currentMode = segments[0] === 'hentai' ? 'hentai' : 'anime';

    if (segments.length === 1) return { mode: currentMode, view: 'home', malId: null };
    if (segments[1] === 'all') return { mode: currentMode, view: 'all', malId: null };
    if (segments[1] === 'lists' || segments[1] === 'watchlist') return { mode: currentMode, view: 'lists', malId: null };
    if (segments[1] === 'account') return { mode: currentMode, view: 'account', malId: null };
    if (segments[1] === 'detail') return { mode: currentMode, view: 'detail', malId: segments[2] || null };
    return { mode: currentMode, view: 'home', malId: null };
  };

  const { mode, view, malId } = parseRoute(location.pathname);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTypeFilter, setSearchTypeFilter] = useState('all');
  const [searchGenreFilter, setSearchGenreFilter] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [fullLibrary, setFullLibrary] = useState([]);
  const [libraryPage, setLibraryPage] = useState(1);
  const [hasMoreLibrary, setHasMoreLibrary] = useState(false);
  const [libraryLoadingMore, setLibraryLoadingMore] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodeList, setEpisodeList] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [user, setUser] = useState({
    name: '',
    email: '',
    avatar: '',
    lists: {
      watchlist: [],
      finished: [],
      dropped: []
    },
    historyAnime: [],
    historyHentai: []
  });
  const [useBackupPlayer, setUseBackupPlayer] = useState(false);
  const [playerPaused, setPlayerPaused] = useState(false);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [showHentaiSpotlight, setShowHentaiSpotlight] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [hentaiPlayerIndex, setHentaiPlayerIndex] = useState(0);

  const [gateLoading, setGateLoading] = useState(false);
  const [gateProgress, setGateProgress] = useState(0);
  const gateIntervalRef = useRef(null);
  const gateTargetRef = useRef(null);
  const gateCallbackRef = useRef(null);

  const [rotatorIndex, setRotatorIndex] = useState(0);

  const [expandedLists, setExpandedLists] = useState({
    watchlist: false,
    finished: false,
    dropped: false
  });

  const spotlightPool = useMemo(() => {
    return mode === 'hentai' ? hentaiSpotlightImages : animeSpotlightImages;
  }, [mode]);

  useEffect(() => {
    if (mode !== 'hentai') {
      setShowHentaiSpotlight(false);
    }
  }, [mode]);

  useEffect(() => {
    setRotatorIndex(0);
  }, [mode, showHentaiSpotlight]);

  useEffect(() => {
    setHentaiPlayerIndex(0);
  }, [selectedAnime, mode]);

  const safeSlugify = (value) => {
    if (!value) return '';
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const buildHentaiPlayerSources = (item) => {
    if (!item) return [];
    const directLinks = [
      item?.source_url,
      item?.stream_url,
      item?.watch_url,
      item?.url,
      item?.permalink,
      item?.link,
      item?.video_url
    ]
      .filter(Boolean)
      .map((url) => url.toString());

    const slug = item?.slug || item?.video_slug || item?.id?.toString() || safeSlugify(item?.title || item?.name || item?.english || item?.title_english);
    const normalizedSlug = safeSlugify(slug);

    const roots = hentaiPlayerRoots.flatMap((root) => [
      `${root}/${normalizedSlug}`,
      `${root}/embed/${normalizedSlug}`
    ]);

    const fullRoots = [
      ...roots,
      `https://hentaistream.com/${normalizedSlug}`,
      `https://hentaistream.tv/${normalizedSlug}`,
      `https://hentaistream.org/${normalizedSlug}`
    ];

    return Array.from(new Set([...directLinks, ...fullRoots].filter(Boolean)));
  };

  const safeGetImage = (item) => {
    return (
      item?.images?.jpg?.large_image_url ||
      item?.images?.jpg?.image_url ||
      item?.image_url ||
      item?.cover_url ||
      item?.poster_url ||
      item?.image ||
      item?.thumbnail ||
      item?.poster ||
      item?.poster_image ||
      item?.cover_image ||
      item?.cover ||
      item?.thumb ||
      item?.banner ||
      placeholderImage
    );
  };

  const safeGetTitle = (item) => {
    return item?.title_english || item?.title || item?.name || item?.english || item?.slug || 'Untitled';
  };

  const safeGetSlug = (item) => {
    if (!item) return '';
    return (
      item?.slug ||
      item?.video_slug ||
      item?.permalink ||
      item?.urlSlug ||
      item?.url ||
      item?.id?.toString() ||
      safeSlugify(item?.title || item?.name || item?.english || item?.title_english)
    );
  };

  const safeScore = (score) => {
    if (typeof score === 'number') return score.toFixed(2);
    if (typeof score === 'string' && !Number.isNaN(Number(score))) return Number(score).toFixed(2);
    return '0.00';
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('zero_hub_user')) || {
      name: '',
      email: '',
      avatar: '',
      lists: { watchlist: [], finished: [], dropped: [] },
      historyAnime: [],
      historyHentai: []
    };
    setUser(savedUser);
  }, []);

  useEffect(() => {
    localStorage.setItem('zero_hub_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const safeFetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Network response was not ok (${res.status})`);
    }
    return res.json();
  };

  const getItemId = (item) => item?.mal_id || item?.malId || item?.id || item?.video_id || item?.pk || null;

  const normalizeHentaiResults = (data) => {
    if (Array.isArray(data?.titles)) return data.titles;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  };

  const fetchData = useCallback(
    async (isFull = false, page = 1) => {
      setLoading(true);
      try {
        if (mode === 'anime') {
          let url = '';
          if (isFull) {
            url = `https://api.jikan.moe/v4/anime?order_by=score&sort=desc&limit=24&page=${page}`;
          } else {
            url = `https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=9`;
          }

          const data = await safeFetchJson(url);
          const results = Array.isArray(data?.data) ? data.data : [];

          if (isFull) {
            setFullLibrary((prev) => (page === 1 ? results : [...prev, ...results]));
            setLibraryPage(page);
            setHasMoreLibrary(Boolean(data?.pagination?.has_next_page));
          } else {
            setFeaturedList(results);
          }
        } else {
          let url = `${HENTAI_API}/titles?page=${page}&limit=${isFull ? 24 : 9}`;
          const data = await safeFetchJson(url);
          const results = normalizeHentaiResults(data);

          if (isFull) {
            setFullLibrary((prev) => (page === 1 ? results : [...prev, ...results]));
            setLibraryPage(page);
            setHasMoreLibrary(Boolean(data?.pagination?.has_next) || Boolean(data?.next));
          } else {
            setFeaturedList(results);
          }
        }
      } catch (err) {
        console.error('fetchData error', err);
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    if (view === 'landing') return undefined;
    const id = setInterval(() => {
      fetchData(view === 'all', libraryPage);
    }, 300000);
    return () => clearInterval(id);
  }, [view, mode, fetchData, libraryPage]);

  useEffect(() => {
    if (view !== 'home' || mode === 'hentai') return undefined;
    fetchSchedule();
    const si = setInterval(() => fetchSchedule(), 60000);
    return () => clearInterval(si);
  }, [view, mode]);

  useEffect(() => {
    if (view === 'detail' && malId) {
      const refresh = setInterval(() => setDetailRefresh((prev) => prev + 1), 60000);
      return () => clearInterval(refresh);
    }
    return undefined;
  }, [view, malId]);

  useEffect(() => {
    if (view !== 'landing') {
      if (view === 'home') {
        fetchData(false, 1);
      } else if (view === 'all') {
        fetchData(true, 1);
      }
    }
  }, [view, mode, fetchData, detailRefresh]);

  useEffect(() => {
    if (view === 'detail' && malId) {
      fetchDetail();
      fetchEpisodes();
    } else if (view !== 'detail') {
      setSelectedAnime(null);
      setEpisodeList([]);
      setUseBackupPlayer(false);
      setPlayerPaused(false);
    }
  }, [view, malId, detailRefresh]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        let url = '';
        if (mode === 'anime') {
          url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=15`;
          if (searchTypeFilter !== 'all') url += `&type=${searchTypeFilter}`;
          if (searchGenreFilter !== 'all') url += `&genres=${searchGenreFilter}`;
        } else {
          url = `${HENTAI_API}/search?query=${encodeURIComponent(searchQuery)}&limit=15`;
        }

        const data = await safeFetchJson(url);
        const results = mode === 'anime'
          ? (Array.isArray(data?.data) ? data.data : [])
          : normalizeHentaiResults(data);
        setSearchResults(results);
      } catch (err) {
        console.error('search fetch error', err);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchTypeFilter, searchGenreFilter, mode]);

  useEffect(() => {
    if (!spotlightPool?.length) return undefined;
    const intervalId = setInterval(() => {
      setRotatorIndex((currentIndex) => (currentIndex + 1) % spotlightPool.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [spotlightPool.length]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const fetchSchedule = async () => {
    if (view !== 'home') return;
    try {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[new Date().getDay()];
      const data = await safeFetchJson(`https://api.jikan.moe/v4/schedules?filter=${today}&limit=12`);
      setSchedule(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('fetchSchedule error', err);
    }
  };

  const fetchDetail = async () => {
    if (!malId) return;
    setLoading(true);
    try {
      let url = '';
      if (mode === 'anime') {
        url = `https://api.jikan.moe/v4/anime/${malId}`;
      } else {
        url = `${HENTAI_API}/titles/${malId}`;
      }

      const data = await safeFetchJson(url);
      const detail = mode === 'anime' ? data?.data : data;
      if (detail) {
        setSelectedAnime(detail);
        setUseBackupPlayer(false);
        setPlayerPaused(false);
      }
    } catch (err) {
      console.error('fetchDetail error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    if (!malId) return;
    if (mode === 'hentai') {
      setEpisodeList([]);
      return;
    }
    try {
      const data = await safeFetchJson(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=1&limit=100`);
      setEpisodeList(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('fetchEpisodes error', err);
      setEpisodeList([]);
    }
  };

  const startGateLoading = (targetOrCallback) => {
    if (gateIntervalRef.current) clearInterval(gateIntervalRef.current);
    setGateLoading(true);
    setGateProgress(0);

    if (typeof targetOrCallback === 'function') {
      gateCallbackRef.current = targetOrCallback;
      gateTargetRef.current = null;
    } else {
      gateTargetRef.current = targetOrCallback || null;
      gateCallbackRef.current = null;
    }

    gateIntervalRef.current = setInterval(() => {
      setGateProgress((prev) => {
        const next = Math.min(100, prev + 12 + Math.random() * 8);
        if (next >= 100) {
          clearInterval(gateIntervalRef.current);
          setTimeout(() => {
            setGateLoading(false);
            setGateProgress(0);
            if (typeof gateCallbackRef.current === 'function') {
              gateCallbackRef.current();
            } else if (gateTargetRef.current) {
              navigate(gateTargetRef.current);
            }
            gateTargetRef.current = null;
            gateCallbackRef.current = null;
          }, 300);
        }
        return next;
      });
    }, 120);
  };

  const enterApp = (targetMode) => {
    startGateLoading(`/${targetMode}/home`);
  };

  const handleExit = () => {
    startGateLoading('/');
  };

  const addToList = (item, section) => {
    const itemId = getItemId(item);
    if (!itemId) return;

    const title = safeGetTitle(item);
    const image = safeGetImage(item);

    setUser((prev) => {
      const currentLists = prev.lists || { watchlist: [], finished: [], dropped: [] };
      const normalized = {
        watchlist: [],
        finished: [],
        dropped: []
      };

      Object.entries(currentLists).forEach(([key, listItems]) => {
        normalized[key] = listItems.filter((x) => getItemId(x) !== itemId);
      });

      const nextItem = { malId: itemId, title, image, data: item };
      normalized[section] = [nextItem, ...normalized[section]];

      return { ...prev, lists: normalized };
    });

    const label = section === 'watchlist' ? 'Watchlist' : section === 'finished' ? 'Finished Watching' : 'Dropped';
    showToast(`Saved to ${label}`);
  };

  const isInList = (item, section) => {
    const list = user.lists?.[section] || [];
    return list.some((x) => getItemId(x) === getItemId(item));
  };

  const currentListKey = useMemo(() => {
    if (!selectedAnime) return null;
    const keys = ['watchlist', 'finished', 'dropped'];
    return keys.find((key) => isInList(selectedAnime, key)) || null;
  }, [selectedAnime, user]);

  const continueHistory = useMemo(() => {
    const historySource = mode === 'hentai' ? user.historyHentai : user.historyAnime;
    if (!Array.isArray(historySource)) return [];
    const uniqueMap = new Map();
    historySource.forEach((item) => {
      const id = item.malId || getItemId(item);
      if (!uniqueMap.has(id)) uniqueMap.set(id, item);
    });
    return Array.from(uniqueMap.values()).slice(0, 6);
  }, [mode, user.historyAnime, user.historyHentai]);

  const playItem = (item, ep = 1) => {
    const itemId = getItemId(item);
    if (!itemId) return;
    setSelectedAnime(item);
    setCurrentEpisode(ep);
    setUseBackupPlayer(false);
    setPlayerPaused(false);
    navigate(`/${mode}/detail/${itemId}`);

    const historyKey = mode === 'anime' ? 'historyAnime' : 'historyHentai';
    setUser((prev) => ({
      ...prev,
      [historyKey]: [
        {
          malId: itemId,
          title: safeGetTitle(item),
          image: safeGetImage(item),
          ep,
          data: item
        },
        ...prev[historyKey].filter((x) => x.malId !== itemId)
      ].slice(0, 20)
    }));
  };

  const hentaiPlayerSources = buildHentaiPlayerSources(selectedAnime);

  const getPlayerUrl = () => {
    if (!selectedAnime) return '';
    const malId = getItemId(selectedAnime);
    if (!malId) return '';
    if (mode === 'hentai') {
      return hentaiPlayerSources[hentaiPlayerIndex] || hentaiPlayerSources[0] || `https://hentaistream.com/watch/${safeGetSlug(selectedAnime)}`;
    }
    if (useBackupPlayer) {
      return `https://anikotoapi.site/?mal_id=${malId}&ep=${currentEpisode}`;
    }
    return `https://megaplay.buzz/stream/mal/${malId}/${currentEpisode}/sub`;
  };

  const getCountdownText = (item) => {
    const timeString = item?.broadcast?.time;
    if (!timeString) return 'Releasing soon';
    const [hours, minutes] = timeString.split(':').map(Number);
    const target = new Date(nowTimestamp);
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= nowTimestamp) {
      target.setDate(target.getDate() + 1);
    }

    const diff = Math.max(0, target.getTime() - nowTimestamp);
    if (diff === 0) return 'Airing now';

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const renderCard = (item) => (
    <div
      key={getItemId(item) || `${safeGetTitle(item)}-${Math.random()}`}
      className="anime-card"
      onClick={() => playItem(item)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-image-wrap">
        <img src={safeGetImage(item)} alt={safeGetTitle(item)} />
        <div className="card-badge">⭐ {safeScore(item.score || item.rating)}/10</div>
      </div>
      <div className="anime-info">
        <div className="anime-name">{safeGetTitle(item)}</div>
      </div>
    </div>
  );

  const renderFeaturedCard = (item) => (
    <div
      key={getItemId(item) || safeGetTitle(item)}
      onClick={() => playItem(item)}
      style={{
        background: '#021424',
        borderRadius: 16,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        overflow: 'hidden'
      }}
    >
      <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#01101a' }}>
        <img
          src={safeGetImage(item)}
          alt={safeGetTitle(item)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{safeGetTitle(item)}</div>
        <div style={{ color: '#9fd', marginTop: 6, fontSize: 12 }}>⭐ {safeScore(item.score || item.rating)}/10</div>
      </div>
    </div>
  );

  const filterBoxStyle = {
    borderRadius: '999px',
    background: 'linear-gradient(135deg, rgba(4,20,39,0.95), rgba(2,66,115,0.95))',
    border: '1px solid rgba(0,255,255,0.35)',
    padding: '8px 12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)'
  };

  const filterSelectStyle = {
    border: '1px solid rgba(0,255,255,0.25)',
    background: '#041223',
    color: '#7fe8ff',
    outline: 'none',
    minWidth: '110px',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none'
  };

  const filterInputStyle = {
    flex: 1,
    minWidth: '220px',
    borderRadius: '999px',
    border: '1px solid rgba(0,255,255,0.18)',
    padding: '12px 16px',
    background: '#041223',
    color: '#fff',
    outline: 'none',
    fontSize: '1rem'
  };

  const optionStyle = { background: '#041223', color: '#7fe8ff' };

  const gateImageStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 35%',
    display: 'block'
  };

  const gateButtonStyle = {
    width: 360,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const listOptions = [
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'finished', label: 'Finished Watching' },
    { key: 'dropped', label: 'Dropped' }
  ];

  const landingPage = (
    <div className="landing">
      <h1 className="hero-title">⚡ ZERO HUB</h1>
      <div
        className="gate-wrapper"
        style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}
      >
        <div className="gate-card" onClick={() => enterApp('anime')} style={gateButtonStyle}>
          <div
            style={{
              width: '100%',
              height: 480,
              borderRadius: 24,
              overflow: 'hidden',
              background: '#02101a',
              position: 'relative'
            }}
          >
            <img src="https://i.ibb.co/nNg1X5Hb/images-96.jpg" alt="Anime Gate" style={gateImageStyle} />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 96,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.65), transparent)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 16,
                textAlign: 'center',
                pointerEvents: 'none'
              }}
            >
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 0 18px rgba(0,0,0,0.7)' }}>
                Anime
              </span>
            </div>
          </div>
        </div>

        <div className="gate-card" onClick={() => enterApp('hentai')} style={gateButtonStyle}>
          <div
            style={{
              width: '100%',
              height: 480,
              borderRadius: 24,
              overflow: 'hidden',
              background: '#02101a',
              position: 'relative'
            }}
          >
            <img src="https://i.ibb.co/Ng8mV3sn/IMG-20260514-175823.jpg" alt="Hentai Gate" style={gateImageStyle} />
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: '#ff3b3b',
                fontSize: 40,
                lineHeight: 1
              }}
            >
              🔞
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 96,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.65), transparent)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 16,
                textAlign: 'center',
                pointerEvents: 'none'
              }}
            >
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 0 18px rgba(0,0,0,0.7)' }}>
                Hentai
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const libraryLoadMore = async () => {
    if (!hasMoreLibrary || libraryLoadingMore) return;
    setLibraryLoadingMore(true);
    await fetchData(true, libraryPage + 1);
    setLibraryLoadingMore(false);
  };

  const totalEpisodes = episodeList.length > 0 ? episodeList.length : selectedAnime?.episodes || 0;
  const episodesToShow = episodeList.length > 0
    ? episodeList.map((ep, idx) => ({
        mal_id: ep?.mal_id ?? idx + 1,
        title: ep?.title || ep?.title_english || ep?.title_romanji || ep?.title_japanese || `Episode ${idx + 1}`
      }))
    : Array.from({ length: totalEpisodes || 12 }, (_, index) => ({
        mal_id: index + 1,
        title: `Episode ${index + 1}`
      }));

  const handleExportProfile = () => {
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zero_hub_profile.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Profile exported');
  };

  const fileInputRef = useRef(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = JSON.parse(txt);
      setUser((prev) => ({ ...prev, ...parsed }));
      showToast('Profile imported');
    } catch (err) {
      showToast('Invalid file');
    }
  };

  const clearWatchlist = () => {
    setUser((prev) => ({ ...prev, lists: { ...prev.lists, watchlist: [] } }));
    showToast('Watchlist cleared');
  };

  const clearHistory = () => {
    setUser((prev) => ({ ...prev, historyAnime: [], historyHentai: [] }));
    showToast('History cleared');
  };

  const accountPage = (
    <div className="page active-page">
      <div className="section-title"><span className="line"></span>👤 Account</div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', background: '#081826' }}>
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ color: '#7fe8ff', padding: 12 }}>No Avatar</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ marginBottom: 8 }}>
              <input
                value={user.name || ''}
                onChange={(e) => setUser((prev) => ({ ...prev, name: e.target.value }))}
                style={{ padding: 10, borderRadius: 8, width: '100%', background: '#041223', color: '#fff', border: '1px solid rgba(0,255,255,0.12)' }}
                placeholder="Display name"
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input
                value={user.email || ''}
                onChange={(e) => setUser((prev) => ({ ...prev, email: e.target.value }))}
                style={{ padding: 10, borderRadius: 8, width: '100%', background: '#041223', color: '#fff', border: '1px solid rgba(0,255,255,0.12)' }}
                placeholder="Email (optional)"
              />
            </div>
            <div>
              <input
                value={user.avatar || ''}
                onChange={(e) => setUser((prev) => ({ ...prev, avatar: e.target.value }))}
                style={{ padding: 8, borderRadius: 8, width: '100%', background: '#02101a', color: '#9fe8ff', border: '1px solid rgba(0,255,255,0.08)' }}
                placeholder="Avatar image URL"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => {
              localStorage.setItem('zero_hub_user', JSON.stringify(user));
              showToast('Profile saved');
            }}
            className="back-btn"
          >
            Save Profile
          </button>
          <button onClick={handleExportProfile} className="back-btn">Export Profile</button>
          <button onClick={handleImportClick} className="back-btn">Import Profile</button>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={clearWatchlist} className="back-btn">Clear Watchlist</button>
          <button onClick={clearHistory} className="back-btn">Clear History</button>
          <button
            onClick={() => {
              localStorage.removeItem('zero_hub_user');
              setUser({
                name: '',
                email: '',
                avatar: '',
                lists: { watchlist: [], finished: [], dropped: [] },
                historyAnime: [],
                historyHentai: []
              });
              showToast('Logged out');
              navigate('/');
            }}
            style={{ marginLeft: 12 }}
            className="back-btn"
          >
            Logout & Clear
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#9fe8ff', fontWeight: 700, marginBottom: 6 }}>Stats</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ padding: 8, background: '#041223', borderRadius: 8 }}>Watchlist: {user.lists?.watchlist?.length || 0}</div>
            <div style={{ padding: 8, background: '#041223', borderRadius: 8 }}>Finished: {user.lists?.finished?.length || 0}</div>
            <div style={{ padding: 8, background: '#041223', borderRadius: 8 }}>Dropped: {user.lists?.dropped?.length || 0}</div>
            <div style={{ padding: 8, background: '#041223', borderRadius: 8 }}>History (anime): {user.historyAnime.length}</div>
            <div style={{ padding: 8, background: '#041223', borderRadius: 8 }}>History (hentai): {user.historyHentai.length}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const spotlightVisible = mode !== 'hentai' || showHentaiSpotlight;
  const spotlightImage = spotlightVisible
    ? spotlightPool[rotatorIndex]
    : { image: placeholderImage, title: 'Adult spotlight hidden' };

  const continueWatchingItems = continueHistory;

  const homeContent = (
    <div className="page active-page">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ background: '#041223', padding: 10, borderRadius: 14 }}>
            <div style={{ fontWeight: 800, color: '#9fe8ff', marginBottom: 10 }}>Spotlight</div>
            <div style={{ width: '100%', height: 300, borderRadius: 18, overflow: 'hidden', background: '#011020' }}>
              <img
                src={spotlightImage.image}
                alt={spotlightImage.title || 'Spotlight'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', background: '#011020' }}
              />
            </div>
            <div style={{ marginTop: 12, color: '#9fe8ff', fontWeight: 700, minHeight: 28 }}>
              {spotlightImage.title}
            </div>
            {mode === 'hentai' && !showHentaiSpotlight && (
              <div style={{ marginTop: 14, color: '#c88', lineHeight: 1.5 }}>
                This section contains adult spotlight images.
                <button
                  className="back-btn"
                  onClick={() => setShowHentaiSpotlight(true)}
                  style={{ marginTop: 12, display: 'block' }}
                >
                  Show Hentai Spotlight
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 420 }}>
          {continueWatchingItems.length > 0 && (
            <div style={{ marginBottom: 18, padding: 14, borderRadius: 18, background: '#041223' }}>
              <div style={{ fontWeight: 800, color: '#9fe8ff', marginBottom: 12 }}>Continue Watching</div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {continueWatchingItems.map((item) => (
                  <div
                    key={item.malId || item.title}
                    onClick={() => playItem(item.data || item, item.ep || 1)}
                    style={{
                      minWidth: 172,
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: '#02101a',
                      cursor: 'pointer',
                      border: '1px solid rgba(159, 248, 255, 0.12)'
                    }}
                  >
                    <div style={{ width: '100%', height: 120, overflow: 'hidden' }}>
                      <img
                        src={item.image || safeGetImage(item.data || item)}
                        alt={item.title || safeGetTitle(item.data || item)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title || safeGetTitle(item.data || item)}</div>
                      <div style={{ color: '#9fd', marginTop: 6, fontSize: 12 }}>EP {item.ep || 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontWeight: 800, color: '#9fe8ff', fontSize: 18 }}>Featured</div>
            <button className="back-btn" onClick={() => navigate(`/${mode}/all`)}>See all</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
            {(featuredList.length > 0 ? featuredList.slice(0, 9) : fullLibrary.slice(0, 9)).map((item) => renderFeaturedCard(item))}
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 320 }}>
          <div className="schedule-box" style={{ background: '#041223', padding: 14, borderRadius: 14 }}>
            <div className="section-title"><span className="line"></span>🗓️ Daily Release</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {schedule.length === 0 && <div style={{ color: '#9fe8ff' }}>No schedule available</div>}
              {schedule.map((item) => (
                <div
                  key={getItemId(item) || safeGetTitle(item)}
                  className="schedule-item"
                  onClick={() => playItem(item)}
                  style={{ cursor: 'pointer', padding: 12, borderRadius: 12, background: '#02101a' }}
                >
                  <div className="schedule-title" style={{ fontWeight: 700 }}>{safeGetTitle(item)}</div>
                  <div className="schedule-time" style={{ color: '#9fd' }}>{getCountdownText(item)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const listsPage = (
    <div className="page active-page">
      <div className="section-title"><span className="line"></span>🗂️ Lists</div>

      {continueWatchingItems.length > 0 && (
        <div style={{ marginTop: 16, borderRadius: 16, background: '#041223', padding: 12 }}>
          <div style={{ fontWeight: 800, color: '#9fe8ff', marginBottom: 10 }}>Continue Watching</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {continueWatchingItems.map((item) => (
              <div
                key={item.malId || item.title}
                onClick={() => playItem(item.data || item, item.ep || 1)}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#02101a',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 180
                }}
              >
                <div style={{ width: '100%', height: 110, overflow: 'hidden' }}>
                  <img
                    src={item.image || safeGetImage(item.data || item)}
                    alt={item.title || safeGetTitle(item.data || item)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title || safeGetTitle(item.data || item)}</div>
                  <div style={{ color: '#9fd', marginTop: 6, fontSize: 12 }}>EP {item.ep || 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {[
          { key: 'watchlist', title: 'Watchlist', items: user.lists?.watchlist || [] },
          { key: 'finished', title: 'Finished Watching', items: user.lists?.finished || [] },
          { key: 'dropped', title: 'Dropped', items: user.lists?.dropped || [] }
        ].map((section) => (
          <div key={section.key} style={{ borderRadius: 12, background: '#041223', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: '#9fe8ff' }}>{section.title} ({section.items.length})</div>
              <div>
                <button
                  className="back-btn"
                  onClick={() => setExpandedLists((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
                  style={{ padding: '6px 10px' }}
                >
                  {expandedLists[section.key] ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {expandedLists[section.key] && (
              <div style={{ marginTop: 12 }}>
                {section.items.length === 0 ? (
                  <div style={{ color: '#9fd' }}>No items added yet.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                    {section.items.map((item) => (
                      <div
                        key={item.malId || item.title}
                        onClick={() => playItem(item.data || item)}
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: '#02101a',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: 160
                        }}
                      >
                        <div style={{ width: '100%', height: 100, overflow: 'hidden' }}>
                          <img
                            src={item.image || safeGetImage(item.data || item)}
                            alt={item.title || safeGetTitle(item.data || item)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ padding: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title || safeGetTitle(item.data || item)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const appContainer = (
    <div className="app-container" style={{ display: 'block' }}>
      <div className="topbar">
        <div className="logo" onClick={() => navigate(`/${mode}/home`)}>⚡ ZERO {mode.toUpperCase()}</div>
        <div className="nav">
          <button className={view === 'home' ? 'active' : ''} onClick={() => navigate(`/${mode}/home`)}>🏠 Home</button>
          <button className={view === 'all' ? 'active' : ''} onClick={() => navigate(`/${mode}/all`)}>📚 All {mode.toUpperCase()}</button>
          <button className={view === 'lists' ? 'active' : ''} onClick={() => navigate(`/${mode}/lists`)}>🗂️ Lists</button>
          <button onClick={async () => {
            try {
              if (mode === 'anime') {
                const data = await safeFetchJson(`https://api.jikan.moe/v4/random/anime`);
                if (data?.data) playItem(data.data);
              } else {
                const randomPage = Math.floor(Math.random() * 50) + 1;
                const data = await safeFetchJson(`${HENTAI_API}/titles?page=${randomPage}&limit=1`);
                const rnd = normalizeHentaiResults(data)?.[0];
                if (rnd) playItem(rnd);
              }
            } catch (err) {
              console.error('surprise me error', err);
            }
          }}>🎲 Surprise Me</button>
          <button className={view === 'account' ? 'active' : ''} onClick={() => navigate(`/${mode}/account`)}>Account</button>
          <button id="exitBtn" onClick={handleExit}>🚪 Exit</button>
        </div>
      </div>

      <div className="search-wrap">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={filterInputStyle}
          />
          {mode === 'anime' && (
            <div style={filterBoxStyle}>
              <select
                style={filterSelectStyle}
                value={searchTypeFilter}
                onChange={(e) => setSearchTypeFilter(e.target.value)}
              >
                <option value="all" style={optionStyle}>Filter</option>
                <option value="tv" style={optionStyle}>Series</option>
                <option value="movie" style={optionStyle}>Movie</option>
                <option value="ova" style={optionStyle}>OVA</option>
                <option value="ona" style={optionStyle}>ONA</option>
              </select>
              <select
                style={filterSelectStyle}
                value={searchGenreFilter}
                onChange={(e) => setSearchGenreFilter(e.target.value)}
              >
                {genreOptions.map((genre) => (
                  <option key={genre.id} value={genre.id} style={optionStyle}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results" style={{ display: 'block' }}>
            {searchResults.map((item) => (
              <div key={getItemId(item) || safeGetTitle(item)} className="search-item" onClick={() => { playItem(item); setSearchQuery(''); }}>
                <img src={safeGetImage(item)} alt={safeGetTitle(item)} />
                <div>
                  <div style={{ fontWeight: 700 }}>{safeGetTitle(item)}</div>
                  <div style={{ fontSize: '0.8rem' }}>⭐ {safeScore(item.score || item.rating)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {view === 'home' && homeContent}
      {view === 'all' && (
        <div className="page active-page">
          <div className="section-title"><span className="line"></span>📚 Full {mode.toUpperCase()} Library</div>
          <div className="anime-grid">{fullLibrary.map(renderCard)}</div>
          {hasMoreLibrary && (
            <button className="back-btn" onClick={libraryLoadMore} disabled={libraryLoadingMore}>
              {libraryLoadingMore ? 'Loading more...' : 'Load more'}
            </button>
          )}
          {!hasMoreLibrary && fullLibrary.length > 0 && (
            <div style={{ marginTop: '16px', color: '#92e0ff' }}>End of list for current query.</div>
          )}
          {fullLibrary.length === 0 && !loading && (
            <div style={{ marginTop: '16px', color: '#9fe8ff' }}>No library items found.</div>
          )}
        </div>
      )}
      {view === 'lists' && listsPage}
      {view === 'account' && accountPage}
      {view === 'detail' && selectedAnime && (
        <div className="page active-page">
          <button className="back-btn" onClick={() => navigate(`/${mode}/home`)}>← Back</button>
          <div className="detail-layout">
            <div className="player-section">
              <div className="player-box">
                <div className="player-container">
                  {playerPaused ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fe8ff', background: '#02101a' }}>
                      Paused
                    </div>
                  ) : (
                    <iframe
                      src={getPlayerUrl()}
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title="ZeroPlayer"
                      scrolling="no"
                      style={{ width: '100%', height: '100%', border: 0 }}
                      onError={() => {
                        if (mode === 'hentai') {
                          setHentaiPlayerIndex((prev) => Math.min(prev + 1, hentaiPlayerSources.length - 1));
                        } else if (!useBackupPlayer) {
                          setUseBackupPlayer(true);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="player-controls" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="control-btn" onClick={() => setListDropdownOpen((prev) => !prev)}>
                    {currentListKey ? 'Saved ▾' : 'List ▾'}
                  </button>
                  <button className="control-btn" onClick={() => setPlayerPaused((prev) => !prev)}>
                    {playerPaused ? 'Resume ▶️' : 'Pause ⏸️'}
                  </button>
                  {mode === 'anime' && (
                    <button className="control-btn" onClick={() => playItem(selectedAnime, currentEpisode + 1)}>Next Episode ⏭️</button>
                  )}
                </div>
                {listDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 48,
                      left: 0,
                      minWidth: 180,
                      background: '#041223',
                      borderRadius: 14,
                      border: '1px solid rgba(159,248,255,0.18)',
                      boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
                      padding: 10,
                      zIndex: 20
                    }}
                  >
                    {listOptions.map((option) => {
                      const already = isInList(selectedAnime, option.key);
                      return (
                        <button
                          key={option.key}
                          onClick={() => {
                            addToList(selectedAnime, option.key);
                            setListDropdownOpen(false);
                          }}
                          className="back-btn"
                          style={{
                            width: '100%',
                            marginBottom: 10,
                            opacity: already ? 0.95 : 1,
                            background: already ? '#0d4' : undefined
                          }}
                        >
                          {option.label} {already ? '✅ Saved' : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {mode === 'anime' && (
                <div className="episode-list">
                  {episodesToShow.map((episode) => (
                    <button
                      key={episode.mal_id}
                      className={`episode-btn ${currentEpisode === episode.mal_id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentEpisode(Number(episode.mal_id));
                        setPlayerPaused(false);
                      }}
                    >
                      EP {episode.mal_id}
                      {episode.title ? ` - ${episode.title}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="sidebar">
              <h2>{safeGetTitle(selectedAnime)}</h2>
              <div className="meta-grid">
                <div className="meta-item">
                  <div className="meta-label">Rating</div>
                  <div>⭐ {safeScore(selectedAnime.score || selectedAnime.rating)}/10</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Type</div>
                  <div>{selectedAnime.type || 'Unknown'}</div>
                </div>
                {mode === 'anime' && (
                  <div className="meta-item">
                    <div className="meta-label">Total</div>
                    <div>{totalEpisodes} episodes</div>
                  </div>
                )}
              </div>
              <p className="synopsis">{selectedAnime.synopsis || selectedAnime.description || 'No synopsis available.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (gateLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 999999, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, color: '#9fe8ff'
      }}>
        <div style={{ color: '#7fe8ff', fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>ZERO HUB</div>
        <div style={{
          width: '72%', maxWidth: 820, height: 20, borderRadius: 12,
          border: '2px solid rgba(0,255,255,0.45)', padding: 4, background: 'rgba(0,0,0,0.4)'
        }}>
          <div style={{
            height: '100%',
            width: `${gateProgress}%`,
            background: 'linear-gradient(90deg,#0aa2ff,#0066ff)',
            borderRadius: 8,
            transition: 'width 120ms linear'
          }} />
        </div>
        <div style={{ color: '#9fe8ff', marginTop: 10, fontSize: 13 }}>Zero Hub - Powered By Th3-C0der</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {toast.show && <div className="toast-notify">{toast.msg}</div>}
      <Routes>
        <Route path="/" element={landingPage} />
        <Route path="/:mode/*" element={appContainer} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;