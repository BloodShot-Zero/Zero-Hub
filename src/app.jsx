import React, { useState, useEffect } from 'react';
import './App.css';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import AnimeGrid from './components/AnimeGrid';
import Player from './components/Player';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'home', 'detail'
  const [mode, setMode] = useState('anime');   // 'anime', 'hentai'
  const [selectedId, setSelectedId] = useState(null);

  const enterApp = (m) => {
    setMode(m);
    setView('home');
  };

  return (
    <div className="app-root">
      {view === 'landing' && <Landing onEnter={enterApp} />}
      
      {view !== 'landing' && (
        <div className="app-container">
          <Navbar setView={setView} setMode={setMode} mode={mode} />
          
          {view === 'home' && (
            <AnimeGrid mode={mode} onSelect={(id) => { setSelectedId(id); setView('detail'); }} />
          )}

          {view === 'detail' && (
            <Player id={selectedId} onBack={() => setView('home')} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;