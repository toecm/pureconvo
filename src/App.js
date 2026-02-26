import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client, handle_file } from "@gradio/client";
import { useReactMediaRecorder } from "react-media-recorder";
import './App.css';

// --- 🎨 GAME ASSETS ---
const GAME_ASSETS = {
    LISTENER: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20listener%203.png",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20listener%20vid.mp4",
        color: "#38bdf8",
        instructions: [
            "1. Introduce Yourself: Say your name.",
            "2. Speak Naturally: Answer Echo's questions.",
	    "3a. Confirm: Okay with the generated texts? Confirm, or (3b)",
            "3b. Edit: Correct the transcript of what you said.",
	    "4. Verify: Click on UPDATE MEANING to reload the meaning.",
	    "5. Re-Train: Make corrections to the reloaded meaning.",
            "6. Mint: Save your unique dialect data."
        ]
    },
    ARCHIVIST: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20archivist%203.jpg",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20archivist%20vid.mp4",
        color: "#facc15",
        instructions: [
            "1. Get a Topic: The Archivist gives you a theme.",
            "2. Record: Tell a short story or monologue.",
            "3. Mint: Preserve your story in the archive."
        ]
    },
    SPEED: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/speed%20chat%203.jpg",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/speed%20chat%20vid.mp4",
        color: "#f472b6",
        instructions: [
            "1. Watch the Timer: You have 10 seconds.",
            "2. React Fast: Speak the first thing on your mind.",
            "3. Don't Overthink: Keep the flow going."
        ]
    },
    VISION: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/vision%20quest%203.jpg",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/vision%20quest%20vid.mp4",
        color: "#a78bfa",
        instructions: [
            "1. Observe: Look at the image provided.",
            "2. Describe: Explain what you see in detail.",
            "3. Mint: Teach the AI visual context."
        ]
    }
};

// --- CONFIGURATION ---
const SPACE_URL = "toecm/PureConvo"; 

const FALLBACK_DIALECTS = [
  "African American Vernacular English", "American English", "British English", "Gullah Creole", "Indian English", "Indonesian English", "Jamican Patois Creole", "Korean English", "Malaysian English", "Nigerian English", "Nigerian Pidgin English", "South African English",
  "+ Add New Dialect"
];

const TONES = ["Neutral / Conversational", "Casual / Slang", "Formal / Professional", "Proverb / Idiom"];
const TOPIC_SUGGESTIONS = ["Traffic", "Food", "Weather", "Family", "Work", "Politics", "Football", "Music", "Money", "Dreams"];

const STARTER_QUESTIONS = [
    "What is the best meal you've ever had?",
    "Cats or Dogs? Explain why.",
    "If you could fly, where would you go first?",
    "What is your favorite time of day?",
    "Tell me about a movie you watched recently.",
    "What is your favorite season and why?",
    "If you had a free hour right now, what would you do?"
];

const NEW_GREETINGS = ["Hello!", "Hi there!", "Greetings!", "What's up?", "How far?", "Welcome!"];
const RETURNING_GREETINGS = ["Welcome back!", "Good to see you again!", "Ready for another round?"];
const PRIVACY_STATEMENTS = [
    "By speaking your truth, you help AI hear everyone's unique voice.",
    "Every clip you save helps make your dialect a global standard.",
    "Speak your mind. We are making your voice the new normal."
];

const getDoodleUrl = (k) => `https://loremflickr.com/400/200/${k},sketch/all?random=${Date.now()}`;
const getPhotoUrl = (k) => `https://loremflickr.com/400/200/${k},street,city/all?random=${Date.now()}`;
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ==========================================
// 🟢 FIX 1: ETHICAL AI CONSENT SCREEN (Expanded for PhD IRB Compliance)
// ==========================================
function ConsentScreen({ onConsent }) {
    return (
        <div className="setup-screen" style={{ textAlign: 'center', padding: '5px', overflowY: 'auto' }}>
            <div className="icon-large" style={{ fontSize: '50px', marginTop: '20px' }}>⚖️</div>
            <h2 style={{ color: '#38bdf8', letterSpacing: '1px', fontSize: '20px' }}>ETHICAL AI CONSENT</h2>
            
            <div style={{ 
                textAlign: 'left', fontSize: '12px', lineHeight: '1.5', 
                background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '12px', 
                border: '1px solid #334155', marginBottom: '20px', color: '#cbd5e1' 
            }}>
                <p style={{ marginTop: 0, color: '#f8fafc', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
                    Welcome to the PureConvo Research Registry.
                </p>
                <p style={{ textAlign: 'center', marginBottom: '15px' }}>Before proceeding, please acknowledge:</p>
                
                <ul style={{ paddingLeft: '15px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li>
                        <strong style={{color: '#34d399'}}>Voluntary & Purpose-Driven:</strong> Participation is entirely voluntary. Though designed as a game, your input directly combats WEIRD (Western, Educated, Industrialized, Rich, and Democratic) bias in AI data.
                    </li>
                    <li>
                        <strong style={{color: '#facc15'}}>The Ultimate Goal:</strong> You are actively helping to train future Large Language Models (LLMs) that truly understand, respect, and globalize the English or Creole spoken by your specific community.
                    </li>
                    <li>
                        <strong style={{color: '#a78bfa'}}>Earn Authority:</strong> By contributing, you earn reputation tokens that increase your rank, eventually empowering you as a recognized authority to verify and approve future contributions for your group's English/Creole.
                    </li>
                    <li>
                        <strong style={{color: '#f472b6'}}>Review Process:</strong> All game contributions are subject to lab and peer approval before being officially minted.
                    </li>
                    <li>
                        <strong style={{color: '#38bdf8'}}>Privacy & Provenance:</strong> You remain entirely anonymous. No personally identifiable information (PII) beyond your voice and dialect is stored. Approved data is cryptographically secured on the Purechain ledger to guarantee ethical ownership.
                    </li>
                    <li>
                        <strong style={{color: '#ef4444'}}>Your Data Rights:</strong> You maintain the absolute right to request the deletion of your data at any time via the Lab Admin.
                    </li>
                </ul>
            </div>
            
            <button className="cyber-button" onClick={onConsent} style={{ background: '#22c55e', padding: '15px', flexShrink: 0 }}>
                I UNDERSTAND & CONSENT
            </button>
        </div>
    );
}

// ==========================================
// 📺 TUTORIAL MODAL
// ==========================================
function GameTutorial({ gameKey, onStart, onCancel }) {
    const asset = GAME_ASSETS[gameKey];
    // 🟢 FIX 8: State to manage mute toggle so users can hear the video on click
    const [isMuted, setIsMuted] = useState(true);

    if (!asset) return null;

    return (
        <div className="tutorial-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(15, 23, 42, 0.95)', zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="tutorial-card" style={{
                background: '#1e293b', padding: '20px', borderRadius: '20px',
                border: `1px solid ${asset.color}`, maxWidth: '90%', width: '400px',
                textAlign: 'center', boxShadow: `0 0 30px ${asset.color}40`
            }}>
                <h2 style={{color: asset.color, margin: '0 0 15px 0'}}>HOW TO PLAY</h2>
                
                {/* 🟢 FIX 8: Clickable video with un-mute overlay instruction */}
                <div 
                    style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '10px', border: '1px solid #334155', background: '#000', position: 'relative', cursor: 'pointer' }}
                    onClick={() => setIsMuted(!isMuted)}
                >
                    <video src={asset.video} autoPlay loop muted={isMuted} playsInline style={{width: '100%', height: '200px', objectFit: 'cover'}} />
                    {isMuted && (
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#fff' }}>
                            🔇 Tap to Unmute
                        </div>
                    )}
                </div>

                <div style={{textAlign: 'left', marginBottom: '25px', color: '#cbd5e1', fontSize: '14px', marginTop: '15px'}}>
                    {asset.instructions.map((step, i) => (
                        <p key={i} style={{marginBottom: '8px'}}>✅ {step}</p>
                    ))}
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={onCancel} className="cancel-btn" style={{flex: 1, padding: '15px'}}>BACK</button>
                    <button onClick={onStart} className="cyber-button" style={{flex: 1, background: asset.color, color: '#000', fontWeight: 'bold'}}>START GAME 🚀</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 🚀 MAIN APP COMPONENT
// ==========================================
function App() {
  const [hasConsented, setHasConsented] = useState(() => localStorage.getItem("pureconvo_consented") === "true");
  const [activeGame, setActiveGame] = useState("HOME"); 
  const [cloudStatus, setCloudStatus] = useState("⚪ CHECKING SYNC...");
  const [userKey, setUserKey] = useState(null);
  const [xp, setXP] = useState(0);
  const [address, setAddress] = useState("");
  const [dialects, setDialects] = useState(FALLBACK_DIALECTS);
  const [greeting, setGreeting] = useState(""); 
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    let sessionID = localStorage.getItem("pureconvo_session_id");
    if (!sessionID) {
        sessionID = `user_${uuidv4().split('-')[0]}_${Date.now().toString().slice(-4)}`;
        localStorage.setItem("pureconvo_session_id", sessionID);
    }
    setUserKey(sessionID); 

    let opAddr = localStorage.getItem("pureconvo_operator_addr");
    if (!opAddr) {
        opAddr = "0x" + uuidv4().replace(/-/g, "").slice(0, 40);
        localStorage.setItem("pureconvo_operator_addr", opAddr);
    }
    setAddress(opAddr);

    const checkSync = async () => {
          try {
              const app = await Client.connect(SPACE_URL);
              const res = await app.predict("/check_cloud_sync");
              setCloudStatus(res.data[0]); 
          } catch (e) { setCloudStatus("🔴 SYNC OFFLINE"); }
      };
      
      checkSync();
      const syncInterval = setInterval(checkSync, 300000); 
      return () => clearInterval(syncInterval);

    const greetList = localStorage.getItem("pureconvo_session_id") ? RETURNING_GREETINGS : NEW_GREETINGS;
    setGreeting(`${getRandom(greetList)} ${getRandom(PRIVACY_STATEMENTS)}`);

    const loadDialects = async () => {
        try {
            const app = await Client.connect(SPACE_URL);
            const res = await app.predict("/api_get_dialects", []); 
            const rawData = res.data[0];
            let parsedArray = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
            if (parsedArray && parsedArray.length > 0) setDialects(parsedArray);
        } catch (e) { setDialects(FALLBACK_DIALECTS); }
    };
    loadDialects();
  }, []);

  const handleIDClick = () => {
      navigator.clipboard.writeText(userKey);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
  };

  return (
    <div className="App">
      <div className="cyber-container">
        
        {/* 🟢 FIX 1: Show consent screen before anything else loads */}
        {!hasConsented ? (
            <ConsentScreen onConsent={() => { setHasConsented(true); localStorage.setItem("pureconvo_consented", "true"); }} />
        ) : (
            <>
                <div className="hud-header">
                    <div className="xp-badge">✨ {xp} XP</div>
                    <div className="status-badge" style={{marginLeft: '10px', background: 'rgba(0,0,0,0.5)'}}>☁️ {cloudStatus}</div>
                    <div className="status-badge" style={{marginLeft: 'auto'}}>MODE: {activeGame}</div>
                </div>

                {activeGame === "HOME" && <HomeMenu onSelect={setActiveGame} greeting={greeting} />}
                
                {activeGame === "ARCHIVIST" && (
                    <GameArchivist 
                        userKey={userKey} setXP={setXP} dialects={dialects} setDialects={setDialects} operator={address}
                        onBack={() => setActiveGame("HOME")} greeting={greeting} 
                    />
                )}

                {activeGame === "SPEED" && (
                    <GameSpeedChat 
                        userKey={userKey} setXP={setXP} dialects={dialects} setDialects={setDialects} operator={address}
                        onBack={() => setActiveGame("HOME")} greeting={greeting} 
                    />
                )}

                {activeGame === "VISION" && (
                    <GameVisionQuest 
                        userKey={userKey} setXP={setXP} dialects={dialects} setDialects={setDialects} operator={address}
                        onBack={() => setActiveGame("HOME")} greeting={greeting} 
                    />
                )}

                {activeGame === "LISTENER" && (
                    <GameActiveListener 
                        userKey={userKey} setXP={setXP} dialects={dialects} setDialects={setDialects} operator={address}
                        onBack={() => setActiveGame("HOME")} 
                    />
                )}

                <div 
                    className={`id-footer ${isPulsing ? 'pulse-active' : ''}`} onClick={handleIDClick} title="Tap to Copy Session ID"
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', marginTop: '10px', transition: 'all 0.3s ease' }}
                >
                    <div style={{fontWeight: 'bold', color: '#94a3b8'}}>OPERATOR: {address.slice(0,6)}...{address.slice(-4)}</div>
                    <div style={{fontSize: '10px', opacity: 0.6, letterSpacing: '1px', fontFamily: 'monospace'}}>SESSION ID: {userKey || "GENERATING..."}</div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}

function HomeMenu({ onSelect, greeting }) {
    const [selectedTutorial, setSelectedTutorial] = useState(null);
    const handleGameClick = (gameKey) => setSelectedTutorial(gameKey);
    const confirmStart = () => { onSelect(selectedTutorial); setSelectedTutorial(null); };

    return (
        <div className="home-layout">
            {selectedTutorial && <GameTutorial gameKey={selectedTutorial} onStart={confirmStart} onCancel={() => setSelectedTutorial(null)} />}
            <div className="welcome-banner"><p>{greeting}</p></div>
            <div className="instruction-zone"><p>SELECT MISSION</p><div className="instruction-line"></div></div>
            <div className="menu-grid" style={{paddingBottom: '40px'}}>
                <div className="menu-card" onClick={() => handleGameClick("LISTENER")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.LISTENER.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">👂</div><h3>THE LISTENER</h3><p>Active Conversation Mode</p>
                </div>
                <div className="menu-card" onClick={() => handleGameClick("ARCHIVIST")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.ARCHIVIST.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">📜</div><h3>THE ARCHIVIST</h3><p>Daily Journaling</p>
                </div>
                <div className="menu-card" onClick={() => handleGameClick("SPEED")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.SPEED.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">⚡</div><h3>SPEED CHAT</h3><p>Rapid Fire Questions</p>
                </div>
                <div className="menu-card" onClick={() => handleGameClick("VISION")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.VISION.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">👁️</div><h3>VISION QUEST</h3><p>Describe what you see</p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 📜 GAME 1: THE ARCHIVIST 
// ==========================================
function GameArchivist({ userKey, setXP, dialects, setDialects, onBack, greeting, operator }) {
    const [mission, setMission] = useState({ text: greeting, subtext: "Retrieving Archive Topic...", image: getDoodleUrl("abstract") });
    // 🟢 FIX 7: Extracted clearBlobUrl to pass down for proper retries
    const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ audio: true });
    
    const loadNextTopic = async () => {
        const topics = ["Daily Life", "Food", "Weather", "Childhood", "Hobbies", "Weekend Plans"];
        const randomTopic = getRandom(topics);
        
        setMission(prev => ({ ...prev, text: "I appreciate you!", subtext: "Thinking of what to chat about...", image: getDoodleUrl("success") }));

        try {
            const app = await Client.connect(SPACE_URL);
            const res = await app.predict("/generate_mission", [randomTopic]);
            let data;
            try { data = JSON.parse(res.data[0]); } catch { data = { text: res.data[0] }; }
            setTimeout(() => {
                setMission({ text: data.text, subtext: "Journal Entry • Keep it short (1 sentence)", image: getDoodleUrl(randomTopic) });
            }, 1100);
        } catch { 
            setMission({ text: `Tell me a short sentence about your ${randomTopic.toLowerCase()}.`, subtext: "Offline Mode", image: getDoodleUrl("coffee") }); 
        }
    };

    useEffect(() => { loadNextTopic(); }, []);

    return (
        <SharedGameLayout
            title="ARCHIVE ENTRY" mission={mission} recStatus={status} startRec={startRecording} stopRec={stopRecording}
            mediaBlob={mediaBlobUrl} clearBlobUrl={clearBlobUrl} dialects={dialects} setDialects={setDialects} userKey={userKey} setXP={setXP} 
            // 🟢 FIX 5: Added onReset so they can skip/refresh topics
            onBack={onBack} onReset={() => { if(window.confirm("Skip this topic?")) loadNextTopic(); }}
            onNext={loadNextTopic} sourceTag={`Game: Archivist | Op: ${operator}`} operator={operator}
        />
    );
}

// ==========================================
// ⚡ GAME 2: SPEED CHAT 
// ==========================================
function GameSpeedChat({ userKey, setXP, dialects, setDialects, onBack, greeting, operator }) {
    const [gameStage, setGameStage] = useState(() => localStorage.getItem(`speed_stage_${userKey}`) || "onboarding"); 
    const [nickname, setNickname] = useState(localStorage.getItem("pure_nickname") || "");
    const [loading, setLoading] = useState(false);
    const clientRef = useRef(null);

    const [mission, setMission] = useState(() => {
        const savedMission = localStorage.getItem(`speed_mission_${userKey}`);
        if (savedMission) { try { return JSON.parse(savedMission); } catch (e) {} }
        return { text: greeting, subtext: "I'll be with you shortly...", image: getDoodleUrl("network") };
    });

    const [timeLeft, setTimeLeft] = useState(10);
    // 🟢 FIX 7: Extracted clearBlobUrl
    const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ audio: true });
    const timerRef = useRef(null);

    useEffect(() => { localStorage.setItem(`speed_stage_${userKey}`, gameStage); }, [gameStage, userKey]);
    useEffect(() => { localStorage.setItem(`speed_mission_${userKey}`, JSON.stringify(mission)); }, [mission, userKey]);

    useEffect(() => {
        const initClient = async () => { try { clientRef.current = await Client.connect(SPACE_URL); } catch (e) {} };
        initClient();
    }, []);

    // 🟢 FIX 4: Bulletproof Timer Logic
    useEffect(() => {
        if (status === "recording") {
            setTimeLeft(10);
            timerRef.current = setInterval(() => {
                setTimeLeft(p => {
                    if (p <= 1) { 
                        clearInterval(timerRef.current); 
                        stopRecording(); // Automatically stops when timer hits 0
                        return 0; 
                    }
                    return p - 1;
                });
            }, 1000);
        } else { 
            clearInterval(timerRef.current); 
        }
        return () => clearInterval(timerRef.current);
    }, [status, stopRecording]);

    const fetchMission = async (topic) => {
        setLoading(true);
        setMission(prev => ({ ...prev, subtext: `Establishing Neural Link for: ${topic}...` }));
        try {
            if (!clientRef.current) throw new Error("Client not ready");
            const timeoutPromise = new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 4500));
            const apiPromise = clientRef.current.predict("/generate_mission", [`Topic: ${topic}. Nickname: ${nickname}. Ask a short question.`]);
            const res = await Promise.race([apiPromise, timeoutPromise]);
            let data;
            try { data = JSON.parse(res.data[0]); } catch { data = { text: res.data[0] }; }
            setMission({ text: data.text, subtext: `Target: ${topic} • 10 Seconds`, image: getDoodleUrl(topic) });
            setGameStage("mission");
        } catch (e) { 
            const randomStarter = STARTER_QUESTIONS[Math.floor(Math.random() * STARTER_QUESTIONS.length)];
            setMission({ text: randomStarter, subtext: `Local Backup: ${topic}`, image: getDoodleUrl(topic) }); 
            setGameStage("mission");
        } finally { setLoading(false); }
    };

    const startFirstRound = () => { if(nickname) { localStorage.setItem("pure_nickname", nickname); fetchMission("General"); } };
    const handleNextRound = () => setGameStage("topic_select");
    
    const handleReset = () => {
        if (window.confirm("Reset Speed Chat identity?")) {
            localStorage.removeItem("pure_nickname"); localStorage.removeItem(`speed_stage_${userKey}`);
            setNickname(""); setGameStage("onboarding");
        }
    };

    if (gameStage === "onboarding" && !localStorage.getItem("pure_nickname")) {
        return (
            <div className="game-layout">
                <div className="mission-card" style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', height: 'auto', padding: '20px'}}>
                    <div className="icon-large">🕵️‍♂️</div>
                    <h3>WHAT'S YOUR NICKNAME?</h3>
                    <input className="cyber-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Maverick" style={{margin:'20px 0', textAlign:'center'}}/>
                    <div className="action-row"><button className="cancel-btn" onClick={onBack}>BACK</button><button className="cyber-button" onClick={startFirstRound} disabled={!nickname}>START MISSION</button></div>
                </div>
            </div>
        );
    }

    if (gameStage === "topic_select") {
        return (
            <div className="game-layout">
                <div className="mission-card" style={{ height: 'auto', padding: '20px', display: 'block' }}>
                    <h3>🔄 MISSION COMPLETE</h3>
                    <p style={{ fontSize: '12px' }}>Select the next topic to discuss:</p>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px'}}>
                        {TOPIC_SUGGESTIONS.slice(0, 6).map(t => (<button key={t} className="cyber-button" style={{background: 'rgba(255,255,255,0.1)', fontSize:'12px'}} onClick={() => fetchMission(t)}>{t}</button>))}
                    </div>
                    <button onClick={handleReset} style={{marginTop:'20px', background:'transparent', border:'1px solid #ef4444', color:'#ef4444', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', width:'100%'}}>🚫 RESET IDENTITY</button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="game-layout"><div className="loading">GENERATING MISSION...</div></div>;

    return (
        <SharedGameLayout
            title={`CHAT: ${nickname.toUpperCase()}`} mission={mission} recStatus={status} startRec={startRecording} stopRec={stopRecording}
            mediaBlob={mediaBlobUrl} clearBlobUrl={clearBlobUrl} dialects={dialects} setDialects={setDialects} userKey={userKey} operator={operator} setXP={setXP} 
            onBack={onBack} timer={timeLeft} onNext={handleNextRound} onReset={handleReset} sourceTag={`Game: SpeedChat`}
        />
    );
}

// ==========================================
// 👁️ GAME 3: VISION QUEST 
// ==========================================
function GameVisionQuest({ userKey, setXP, dialects, setDialects, onBack, greeting, operator }) {
    const [mission, setMission] = useState({ text: greeting, subtext: "Calibrating Optical Sensors...", image: getPhotoUrl("cyberpunk") });
    // 🟢 FIX 7: Extracted clearBlobUrl
    const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ audio: true });

    const loadNewImage = () => {
        const keywords = ["market", "street", "festival", "classroom", "kitchen"];
        const k = getRandom(keywords);
        setMission({ text: "In your own way, describe the first thing you see in this image.", subtext: `Target Sector: ${k.toUpperCase()}`, image: getPhotoUrl(k) });
    };

    useEffect(() => { setTimeout(loadNewImage, 2500); }, []);

    return (
        <SharedGameLayout
            title="OBSERVATION DECK" mission={mission} recStatus={status} startRec={startRecording} stopRec={stopRecording}
            mediaBlob={mediaBlobUrl} clearBlobUrl={clearBlobUrl} dialects={dialects} setDialects={setDialects} userKey={userKey} setXP={setXP} onBack={onBack}
            onNext={loadNewImage} mode="vision" sourceTag={`Game: Vision | Op: ${operator}`} operator={operator}
        />
    );
}

// ==========================================
// ⚙️ SHARED GAME LAYOUT 
// ==========================================
function SharedGameLayout({ title, mission, recStatus, startRec, stopRec, mediaBlob, clearBlobUrl, dialects, setDialects, userKey, operator, setXP, onBack, onNext, timer, mode, sourceTag, onReset }) {
    const [step, setStep] = useState("RECORD"); 
    const [transcribed, setTranscribed] = useState("");
    const [clarification, setClarification] = useState("");
    const [tone, setTone] = useState("Neutral / Conversational"); 
    const [context, setContext] = useState("General");
    const [pragmatics, setPragmatics] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false); 
    const [dialect, setDialect] = useState(dialects[0] || "General");
    
    // 🟢 FIX 2 & 3: Custom Dialect and Captcha States
    const [customD, setCustomD] = useState("");
    const [captcha, setCaptcha] = useState("");

    useEffect(() => {
        if (dialects.length > 0 && !dialects.includes(dialect)) { setDialect(dialects[0]); }
    }, [dialects]);

    const [lastProcessedBlob, setLastProcessedBlob] = useState(null);
    useEffect(() => {
        if (mediaBlob && mediaBlob !== lastProcessedBlob && step === "RECORD") {
            setLastProcessedBlob(mediaBlob);
            handleAnalyze();
        }
    }, [mediaBlob, step, lastProcessedBlob]);

    const handleAnalyze = async () => {
        if (!mediaBlob) return;
        setStep("ANALYZING");
        try {
            const blob = await fetch(mediaBlob).then(r => r.blob());
            const app = await Client.connect(SPACE_URL);
            const d = dialect === "+ Add New Dialect" ? customD : dialect;
            const tRes = await app.predict("/transcribe_check", [blob, d]);
            const text = tRes.data[0];
            setTranscribed(text);
            const cRes = await app.predict("/generate_clarifications", [text, d]);
            parseClarification(cRes.data[0]);
            setStep("REVIEW");
        } catch (e) { 
            setStep("REVIEW"); setTranscribed("Error analyzing audio."); 
        }
    };

    const parseClarification = (rawData) => {
        let data;
        try { data = JSON.parse(rawData); } catch { data = { clarification: rawData }; }
        setClarification(data.clarification || data.Meaning || rawData);
        setContext(data.context || "General");
        setPragmatics(data.pragmatics || "");
    };

    const handleRegenerate = async () => {
        if (!transcribed.trim()) return;
        setIsRegenerating(true);
        try {
            const app = await Client.connect(SPACE_URL);
            const d = dialect === "+ Add New Dialect" ? customD : dialect;
            const res = await app.predict("/generate_clarifications", [transcribed, d]);
            parseClarification(res.data[0]);
            setIsRegenerating(false);
        } catch (e) { setClarification("Failed to regenerate."); setIsRegenerating(false); }
    };

    const handleSubmit = async () => {
        // 🟢 FIX 2: Security check before submitting custom dialect
        if (dialect === "+ Add New Dialect") {
            if (!customD.trim()) { alert("Please type a new dialect name."); return; }
            if (captcha !== "7") { alert("Bot Check Failed! 3 + 4 = 7."); return; }
        }

        setStep("MINTING");
        try {
            const app = await Client.connect(SPACE_URL);
            const d = dialect === "+ Add New Dialect" ? customD : dialect;
            let wrappedAudio = null;
            if (mediaBlob) {
                try {
                    const blob = await fetch(mediaBlob).then(r => r.blob());
                    const audioFile = new File([blob], `capture_${Date.now()}.wav`, { type: "audio/wav" });
                    wrappedAudio = handle_file(audioFile);
                } catch (e) {}
            }
            const finalOperatorId = operator || "0xUnknown";
            await app.predict("/check_and_submit_logic", [
                transcribed, d, customD, clarification, tone, context, pragmatics,
                sourceTag || "Unknown Game", "User/AI Hybrid", finalOperatorId, wrappedAudio, false
            ]);
            setXP(p => p + 50);
	    // 🟢 FIX: Instantly add the custom dialect to the local UI state
            if (customD && dialect === "+ Add New Dialect") {
                setDialects(prev => {
                    const clean = prev.filter(d => d !== "+ Add New Dialect");
                    return Array.from(new Set([customD, ...clean, "+ Add New Dialect"]));
                });
                setDialect(customD);
            }
            setStep("💎 Contribution Saved!"); 
            setTranscribed(""); setClarification(""); setCaptcha("");
            
            setTimeout(() => {
                if (onNext) { 
                    if(clearBlobUrl) clearBlobUrl();
                    setLastProcessedBlob(null);
                    setStep("RECORD"); 
                    onNext(); 
                } else { onBack(); }
            }, 1500);

        } catch (e) { setStep("RECORD"); }
    };

    return (
        <div className="game-layout">
            {/* 🟢 FIX 5 & 6: Unified Header with Back & Reset Buttons for all games */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: '10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    {onBack && <button className="back-icon" onClick={onBack} style={{background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'20px', padding:'0'}} title="Back to Menu">🏠←</button>}
                    <div>
                        <h3 style={{margin: 0, color: '#f8fafc'}}>{title}</h3>
                    </div>
                </div>
                {onReset && (<button onClick={onReset} style={{background:'rgba(0,0,0,0.3)', border:'none', borderRadius:'50%', width:'80px', height:'30px', cursor:'pointer', fontSize:'20px', color:'#94a3b8', marginLeft:'10px'}} title="Reset Game">🗑️🎮</button>)}
            </div>

            {mode === "vision" ? (
                <div className="vision-mode-container">
                    <div className="vision-image" style={{backgroundImage: `url(${mission.image})`}} />
                    <div className="vision-text-block">{mission.subtext && <p className="subtext">{mission.subtext}</p>}<p className="main-text">{mission.text}</p></div>
                </div>
            ) : (
                <div className="mission-card">
                    <div className="doodle-bg" style={{backgroundImage: `url(${mission.image})`}} />
                    <div className="mission-content-overlay">
                        <div>{mission.subtext && <p style={{fontSize:'0.8em', opacity:0.7, marginBottom:'5px'}}>{mission.subtext}</p>}<p>{mission.text}</p></div>
                    </div>
                </div>
            )}
            
            <div className="control-panel">
                
                {/* 🟢 FIX 7: Dialect selection placed BEFORE recording so it applies to Vision Quest immediately */}
                {(step === "RECORD" || step === "REVIEW") && (
                    <div className="dialect-selector" style={{marginBottom: '10px'}}>
                        <label>PLEASE CHOOSE OR ADD YOUR TARGET ENGLISH/CREOLE DIALECT.</label>
                        <select value={dialect} onChange={e => setDialect(e.target.value)}>
                            {dialects.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        
                        {/* 🟢 FIX 2 & 3: Textbox and Captcha for New Dialects */}
                        {dialect === "+ Add New Dialect" && (
                            <div style={{marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px dotted #38bdf8'}}>
                                <input className="cyber-input" placeholder="Enter Dialect Name (e.g. Scottish Gaelic)" value={customD} onChange={e => setCustomD(e.target.value)} style={{marginBottom: '10px', width: '90%'}}/>
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                                    <span style={{fontSize: '12px', color: '#94a3b8'}}>Human Check: 3 + 4 =</span>
                                    <input className="cyber-input" style={{width: '60px', padding: '5px', textAlign: 'center'}} value={captcha} onChange={e => setCaptcha(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === "RECORD" && (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        {timer !== undefined && recStatus === "recording" && (
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: timer <= 3 ? '#ef4444' : '#38bdf8', marginBottom: '15px', textShadow: '0 0 10px rgba(56, 189, 248, 0.5)'}}>
                                ⏱️ 00:{timer < 10 ? `0${timer}` : timer}
                            </div>
                        )}
                        <button 
                            className={`cyber-button ${recStatus === 'recording' ? 'recording pulsing' : ''}`}
                            onPointerDown={startRec} onPointerUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
                            style={{ width: '100%', padding: '20px', fontSize: '16px', backgroundColor: recStatus === 'recording' ? '#ef4444' : 'rgba(0,0,0,0.5)' }}
                        >
                            {recStatus === "recording" ? "🔴 RECORDING... RELEASE TO SEND" : "🎙️ HOLD TO SPEAK"}
                        </button>
                    </div>
                )}
                
                {(step === "ANALYZING" || step === "MINTING") && <div className="loading">PROCESSING...</div>}
                
                {step === "REVIEW" && (
                    <div className="review-box">
                        <div className="audio-preview" style={{marginBottom: '10px'}}><label style={{fontSize:'10px', color:'#94a3b8', display:'block', marginBottom:'5px'}}>REVIEW RECORDING:</label><audio src={mediaBlob} controls style={{width: '100%', borderRadius: '8px'}} /></div>
                        <div className="input-group"><div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><label>I HEARD (EDIT IF NEEDED):</label></div><textarea value={transcribed} onChange={e => setTranscribed(e.target.value)} /></div>
                        <div className="input-group"><div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}><label style={{margin:0}}>MEANING:</label><button onClick={handleRegenerate} disabled={isRegenerating} style={{background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer'}}>{isRegenerating ? "UPDATING..." : "🔄 REGENERATE FROM TEXT"}</button></div><textarea value={clarification} onChange={e => setClarification(e.target.value)} /></div>
                        <div className="input-group"><label>TONE:</label><select value={tone} onChange={e => setTone(e.target.value)}>{TONES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div className="action-row">
                            {/* 🟢 FIX 7: Correctly clears blob URL on Retry to reset the caching logic */}
                            <button className="cancel-btn" onClick={() => { if(clearBlobUrl) clearBlobUrl(); setLastProcessedBlob(null); setStep("RECORD"); }}>RETRY</button>
                            <button className="cyber-button" onClick={handleSubmit}>MINT (+50 XP)</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// 👂 GAME 4: THE LISTENER (Omitted unchanging logic for brevity, but includes Captcha fix)
// ==========================================
function GameActiveListener({ userKey, setXP, dialects, setDialects, onBack, operator }) {
    const loadSavedData = () => { const saved = localStorage.getItem("echo_memory_" + userKey); return saved ? JSON.parse(saved) : null; };
    const memory = loadSavedData();
    const [setup, setSetup] = useState(memory ? memory.setup : { voiceIndex: 0, pitch: 1.0, rate: 1.0, userDialect: dialects[0] || "General" });
    const [messages, setMessages] = useState(memory ? memory.messages : []);
    const [nickname, setNickname] = useState(memory ? memory.nickname : "");
    const [pronunciation, setPronunciation] = useState(memory ? memory.pronunciation : "");
    const [phase, setPhase] = useState(memory ? "chat" : "setup"); 
    const [voices, setVoices] = useState([]);
    const [currentAudio, setCurrentAudio] = useState(null);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [currentClarification, setCurrentClarification] = useState(""); 
    const [isEdited, setIsEdited] = useState(false);
    const [showPhonetic, setShowPhonetic] = useState(false); 
    const [isRegenerating, setIsRegenerating] = useState(false);
    const chatEndRef = useRef(null);

    // 🟢 FIX 2 & 3: Listener Captcha States
    const [customD, setCustomD] = useState("");
    const [captcha, setCaptcha] = useState("");
    
    useEffect(() => {
        if (dialects.length > 0 && !dialects.includes(setup.userDialect)) {
            setSetup(prev => ({ ...prev, userDialect: dialects[0] }));
        }
    }, [dialects]);

    useEffect(() => {
        if (phase === "chat" || phase === "verify") {
            const dataToSave = { setup, messages, nickname, pronunciation };
            localStorage.setItem("echo_memory_" + userKey, JSON.stringify(dataToSave));
        }
    }, [messages, setup, nickname, pronunciation, phase, userKey]);

    useEffect(() => {
        const loadVoices = () => {
            const all = window.speechSynthesis.getVoices();
            if (all.length > 0) {
                const englishVoices = all.filter(v => v.lang.startsWith("en"));
                setVoices(englishVoices);
                if (!memory) {
                    const defaultVoice = englishVoices.findIndex(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
                    setSetup(prev => ({ ...prev, voiceIndex: defaultVoice !== -1 ? defaultVoice : 0 }));
                }
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, phase]);

    const handleReset = () => { if (window.confirm("Start a new conversation?")) { localStorage.removeItem("echo_memory_" + userKey); setMessages([]); setNickname(""); setPronunciation(""); setPhase("setup"); } };

    const speak = (text, forcePronunciation = null) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let spokenText = text;
            const targetName = nickname || currentTranscript;
            const targetSound = forcePronunciation || pronunciation;
            if (targetName && targetSound) { const regex = new RegExp(targetName, "gi"); spokenText = text.replace(regex, targetSound); }
            const u = new SpeechSynthesisUtterance(spokenText);
            const selectedVoice = voices[setup.voiceIndex];
            if (selectedVoice) u.voice = selectedVoice;
            u.pitch = setup.pitch; u.rate = setup.rate;
            window.speechSynthesis.speak(u);
        }
    };

    const startSession = () => { 
        // 🟢 FIX 2: Security check for Listener Mode
        if (setup.userDialect === "+ Add New Dialect") {
            if (!customD.trim()) { alert("Please type a new dialect name."); return; }
            if (captcha !== "7") { alert("Bot Check Failed! 3 + 4 = 7."); return; }
            setSetup({...setup, userDialect: customD});
        }
        const intro = "Hello, my name is Echo. What should I call you?"; 
        setMessages([{ sender: 'ai', text: intro }]); setPhase("onboarding"); speak(intro); 
    };

    const handleRetry = () => { setPhase("chat"); setCurrentTranscript(""); setCurrentClarification(""); setIsEdited(false); };
    
    const handleRegenerateMeaning = async () => {
        if (!currentTranscript.trim()) return;
        setIsRegenerating(true);
        try {
            const app = await Client.connect(SPACE_URL);
            const d = setup.userDialect || "General";
            const cRes = await app.predict("/generate_clarifications", [currentTranscript, d]);
            let cText = cRes.data[0];
            try { cText = JSON.parse(cText).clarification || cText; } catch {}
            setCurrentClarification(cText); setIsRegenerating(false);
        } catch (e) { setIsRegenerating(false); }
    };

    const handleSubmitName = () => {
        if (!currentTranscript.trim()) return;
        const name = currentTranscript.trim(); const sound = pronunciation.trim() || name;
        setNickname(name); setPronunciation(sound);
        const response = `Nice to meet you, ${name}. What would you like to talk about?`;
        setMessages(p => [...p, { sender: 'user', text: name }, { sender: 'ai', text: response }]);
        speak(response, sound); setCurrentTranscript(""); setPhase("chat");
    };

    const handleConfirm = async () => {
        setMessages(p => [...p, { sender: 'user', text: currentTranscript, isAudio: !isEdited }]);
        setPhase("responding"); 
        try {
            const app = await Client.connect(SPACE_URL);
            const d = setup.userDialect || "General";
            const clarSource = isEdited ? "User/AI Hybrid" : "AI";
            let wrappedAudio = null;
            if (currentAudio) {
                 const audioFile = new File([currentAudio], `echo_${Date.now()}.wav`, { type: "audio/wav" });
                 wrappedAudio = handle_file(audioFile);
            }
            const finalOperatorId = operator || "0xUnknown";

            await app.predict("/check_and_submit_logic", [
                currentTranscript, d, "", currentClarification, "Conversational", "Chat", "Interactive Chat Session",
                "Game: Listener", clarSource, finalOperatorId, wrappedAudio, false
            ]);
            
            const prompt = `User said: "${currentTranscript}". Meaning: "${currentClarification}". You are Echo. Reply naturally with a short follow-up question.`;
            const res = await app.predict("/generate_mission", [prompt]); 
            let replyText = "";
            const rawData = res.data[0];
            if (typeof rawData === "string") { try { const parsed = JSON.parse(rawData); replyText = parsed.text || rawData; } catch { replyText = rawData; } }
            else if (typeof rawData === "object" && rawData !== null) { replyText = rawData.text || JSON.stringify(rawData); } 
            else { replyText = "I see. Tell me more."; }
            replyText = String(replyText).replace(/^{"text":\s*"/, "").replace(/"}$/, "");
            
            setMessages(p => [...p, { sender: 'ai', text: replyText }]);
            speak(replyText); setXP(x => x + 25);
        } catch (e) {
            const fallback = "I'm listening. Please continue.";
            setMessages(p => [...p, { sender: 'ai', text: fallback }]); speak(fallback);
        } finally { setPhase("chat"); setCurrentTranscript(""); setCurrentClarification(""); setIsEdited(false); }
    };

    const handleAudioStop = async (blobUrl, blob) => {
        if (phase === "onboarding") {
            setPhase("processing"); 
            try {
                const app = await Client.connect(SPACE_URL);
                const d = setup.userDialect || "General";
                const tRes = await app.predict("/transcribe_check", [blob, d]);
                const text = tRes.data[0];
                setCurrentTranscript(text); if(!pronunciation) setPronunciation(text); setPhase("onboarding"); 
            } catch (e) { setPhase("onboarding"); }
            return;
        }
        setPhase("processing"); setCurrentAudio(blob); setIsEdited(false); 
        try {
            const app = await Client.connect(SPACE_URL);
            const d = setup.userDialect || "General";
            const tRes = await app.predict("/transcribe_check", [blob, d]);
            const text = tRes.data[0];
            setCurrentTranscript(text);
            const cRes = await app.predict("/generate_clarifications", [text, d]);
            let cText = cRes.data[0];
            try { cText = JSON.parse(cText).clarification || cText; } catch {}
            setCurrentClarification(cText); setPhase("verify");
        } catch (e) { setMessages(p => [...p, { sender: 'ai', text: "I couldn't hear you. Try again?" }]); setPhase("chat"); }
    };

    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true, onStop: handleAudioStop });

    return (
        <div className="game-layout listener-mode">
            <div className="listener-header">
                <button className="back-icon" onClick={onBack}>🏠←</button>
                <div className={`status-dot ${status === "recording" ? "pulsing-red" : ""}`}></div>
                <h3>ECHO {nickname ? `| ${nickname.toUpperCase()}` : ""}</h3>
                <button style={{marginLeft:'auto', background:'transparent', border:'none', fontSize:'16px', color:'#94a3b8', cursor:'pointer'}} onClick={handleReset}>🗑️🎮</button>
            </div>
            {phase === "setup" ? (
                <div className="setup-screen">
                    <div className="icon-large">🎛️</div><h3>CONFIGURE ECHO</h3>
                    <div className="setup-row"><label>YOUR DIALECT</label><select value={setup.userDialect} onChange={e => setSetup({...setup, userDialect: e.target.value})}>{dialects.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    
                    {/* 🟢 FIX 2 & 3: Custom Text Input & Captcha applied to Listener Mode */}
                    {setup.userDialect === "+ Add New Dialect" && (
                        <div className="setup-row" style={{background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px dotted #38bdf8'}}>
                            <input className="cyber-input" placeholder="New Dialect Name" value={customD} onChange={e => setCustomD(e.target.value)} style={{marginBottom: '10px', width: '90%'}}/>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                                <span style={{fontSize: '11px', color: '#94a3b8'}}>Human Check: 3 + 4 =</span>
                                <input className="cyber-input" style={{width: '50px', textAlign: 'center'}} value={captcha} onChange={e => setCaptcha(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div className="setup-row"><label>AI VOICE</label><select value={setup.voiceIndex} onChange={e => setSetup({...setup, voiceIndex: parseInt(e.target.value)})}>{voices.map((v, i) => <option key={i} value={i}>{v.name} ({v.lang})</option>)}</select></div>
                    <div className="setup-row"><label>PITCH ({setup.pitch}x)</label><input type="range" min="0.5" max="2.0" step="0.1" value={setup.pitch} onChange={e => setSetup({...setup, pitch: parseFloat(e.target.value)})}/></div>
                    <div className="setup-row"><label>SPEED ({setup.rate}x)</label><input type="range" min="0.5" max="2.0" step="0.1" value={setup.rate} onChange={e => setSetup({...setup, rate: parseFloat(e.target.value)})}/></div>
                    <button className="cyber-button" onClick={() => speak("Voice check.")} style={{marginBottom:'10px', background:'transparent', border:'1px solid #38bdf8'}}>🔊 TEST</button>
                    <button className="cyber-button" onClick={startSession}>INITIALIZE SYSTEM</button>
                </div>
            ) : (
                <>
                    <div className="chat-log">
                        {messages.map((m, i) => (<div key={i} className={`chat-bubble ${m.sender}`}>{m.isAudio && <span style={{marginRight:'5px'}}>🎤</span>}{m.text}</div>))}
                        {phase === "processing" && <div className="chat-bubble ai typing">Echo is thinking...</div>}{phase === "responding" && <div className="chat-bubble ai typing">Echo is replying...</div>}<div ref={chatEndRef} />
                    </div>
                    <div className="listener-controls">
                        {phase === "onboarding" && (
                            <div className="onboarding-controls">
                                <label style={{fontSize:'11px', color:'#94a3b8', display:'block', marginBottom:'5px'}}>SAY OR TYPE YOUR NAME:</label>
                                <div className="input-bar" style={{marginBottom:'10px'}}>
                                    <input className="cyber-input" value={currentTranscript} onChange={e => { setCurrentTranscript(e.target.value); if(!showPhonetic) setPronunciation(e.target.value); }} placeholder="Display Name (e.g. Onyi)" onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}/>
                                </div>
                                {showPhonetic && (<div className="input-bar" style={{marginBottom:'10px', animation:'fadeIn 0.3s'}}><label style={{fontSize:'9px', color:'#38bdf8', marginRight:'10px'}}>PHONETIC SPELLING:</label><input className="cyber-input" value={pronunciation} onChange={e => setPronunciation(e.target.value)} placeholder="e.g. Own-yee"/></div>)}
                                <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                                    {currentTranscript && (<button onClick={() => speak(currentTranscript, pronunciation || currentTranscript)} style={{background:'transparent', border:'1px solid #38bdf8', color:'#38bdf8', borderRadius:'8px', padding:'0 10px', fontSize:'12px'}}>🔊 HEAR IT</button>)}
                                    {currentTranscript && !showPhonetic && (<button onClick={() => {setShowPhonetic(true); setPronunciation(currentTranscript)}} style={{background:'transparent', border:'none', color:'#94a3b8', fontSize:'10px', textDecoration:'underline'}}>Wrong Pronunciation?</button>)}
                                </div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button className={`record-btn ${status === "recording" ? "pulsing" : ""}`} onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} style={{flex:1, borderRadius:'8px', fontSize:'12px'}}>{status === "recording" ? "🛑 RELEASE" : "🎤 SAY NAME"}</button>
                                    <button className="cyber-button" onClick={handleSubmitName} style={{flex:1, background: currentTranscript ? '#22c55e' : '#334155'}} disabled={!currentTranscript}>CONFIRM ✅</button>
                                </div>
                            </div>
                        )}
                        {(phase === "chat" || phase === "processing" || phase === "responding") && (
                            <div className="record-bar"><button className={`record-btn ${status === "recording" ? "pulsing" : ""}`} onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} disabled={phase !== "chat"} style={{width: '100%', borderRadius: '12px', padding: '20px'}}>{status === "recording" ? "🛑 RELEASE TO SEND" : phase === "processing" ? "⏳ PROCESSING..." : phase === "responding" ? "🔊 SPEAKING..." : "🎙️ HOLD TO SPEAK"}</button></div>
                        )}
                        {phase === "verify" && (
                            <div className="verify-card">
                                {/* 🟢 FIX: Added the audio player to The Listener verify phase */}
                                <div className="audio-preview" style={{marginBottom: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px', border: '1px solid #334155'}}>
                                    <label style={{fontSize:'10px', color:'#94a3b8', display:'block', marginBottom:'5px', letterSpacing: '1px'}}>REVIEW YOUR AUDIO:</label>
                                    <audio src={mediaBlobUrl} controls style={{width: '100%', height: '35px', borderRadius: '8px', outline: 'none'}} />
                                </div>

                                <div className="verify-row">
                                    <label>I HEARD (TYPE TO EDIT):</label>
                                    <input className="cyber-input" value={currentTranscript} onChange={e => {setCurrentTranscript(e.target.value); setIsEdited(true);}} style={{border: isEdited ? '1px solid #22c55e' : '1px solid #475569'}}/>
                                </div>
                                <div className="verify-row">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                                        <label style={{margin:0}}>MEANING (EDIT IF WRONG):</label>
                                        <button onClick={handleRegenerateMeaning} disabled={isRegenerating} style={{background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                                            {isRegenerating ? "UPDATING..." : "🔄 UPDATE MEANING"}
                                        </button>
                                    </div>
                                    <input className="cyber-input" value={currentClarification} onChange={e => {setCurrentClarification(e.target.value); setIsEdited(true);}} style={{border: '1px solid #38bdf8', color: '#34d399', fontStyle: 'italic'}}/>
                                </div>
                                <div className="verify-actions">
                                    <button className="reject-btn" onClick={handleRetry} style={{background: '#334155', border:'none', color:'#ef4444'}}>🎤 RETRY</button>
                                    <button className="confirm-btn" onClick={handleConfirm}>{isEdited ? "SEND EDIT ✅" : "CONFIRM ✅"}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
