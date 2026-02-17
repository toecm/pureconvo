import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect, useRef } from 'react';
import { Client } from "@gradio/client";
import { useReactMediaRecorder } from "react-media-recorder";
import './App.css';

// --- 🎨 GAME ASSETS (IMAGES & VIDEOS) ---
// Replace these URLs with your actual file paths or hosted links (e.g., from your public folder or Cloudinary)
const GAME_ASSETS = {
    LISTENER: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20listener%203.png", // Replace with your Image
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20listener%20video.mp4", // Replace with your Video
        color: "#38bdf8",
        instructions: [
            "1. Introduce Yourself: Say your name.",
            "2. Speak Naturally: Answer Echo's questions.",
            "3. Verify: Correct the text AND the meaning.",
            "4. Mint: Save your unique dialect data."
        ]
    },
    ARCHIVIST: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20archivist%203.jpg",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/the%20archivist%20video.mp4",
        color: "#facc15",
        instructions: [
            "1. Get a Topic: The Archivist gives you a theme.",
            "2. Record: Tell a short story or monologue.",
            "3. Mint: Preserve your story in the archive."
        ]
    },
    SPEED: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/speed%20chat%203.jpg",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/pure%20app%20games%20video.mp4",
        color: "#f472b6",
        instructions: [
            "1. Watch the Timer: You have 10 seconds.",
            "2. React Fast: Speak the first thing on your mind.",
            "3. Don't Overthink: Keep the flow going."
        ]
    },
    VISION: {
        image: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/vision%20quest%203.jpg",
        video: "https://huggingface.co/spaces/toecm/PureConvo/resolve/main/assets/pure%20app%20games%20video.mp4",
        color: "#a78bfa",
        instructions: [
            "1. Observe: Look at the image provided.",
            "2. Describe: Explain what you see in detail.",
            "3. Mint: Teach the AI visual context."
        ]
    }
};

// --- CONFIGURATION ---
const SPACE_URL = "https://toecm-pureconvo.hf.space"; 
const FALLBACK_DIALECTS = [
    "African American Vernacular English", 
    "American English", 
    "Indian English", 
    "Nigerian English", 
    "Nigerian Pidgin English", 
    "+ Add New Dialect"
];
const TONES = ["Neutral / Conversational", "Casual / Slang", "Formal / Professional", "Proverb / Idiom"];

// ==========================================
// 📺 TUTORIAL MODAL (Video + Instructions)
// ==========================================
function GameTutorial({ gameKey, onStart, onCancel }) {
    const asset = GAME_ASSETS[gameKey];
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
                
                {/* VIDEO PLAYER */}
                <div style={{
                    borderRadius: '12px', overflow: 'hidden', marginBottom: '20px',
                    border: '1px solid #334155', background: '#000'
                }}>
                    <video 
                        src={asset.video} 
                        autoPlay loop muted playsInline 
                        style={{width: '100%', height: '200px', objectFit: 'cover'}}
                    />
                </div>

                {/* INSTRUCTIONS */}
                <div style={{textAlign: 'left', marginBottom: '25px', color: '#cbd5e1', fontSize: '14px'}}>
                    {asset.instructions.map((step, i) => (
                        <p key={i} style={{marginBottom: '8px'}}>✅ {step}</p>
                    ))}
                </div>

                {/* ACTIONS */}
                <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                        onClick={onCancel}
                        className="cancel-btn" 
                        style={{flex: 1, padding: '15px'}}
                    >
                        BACK
                    </button>
                    <button 
                        onClick={onStart}
                        className="cyber-button" 
                        style={{flex: 1, background: asset.color, color: '#000', fontWeight: 'bold'}}
                    >
                        START GAME 🚀
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- GREETINGS & PRIVACY ---
const NEW_GREETINGS = ["Hello!", "Hi there!", "Greetings!", "Ready?", "Salutations!", "Welcome!"];
const RETURNING_GREETINGS = ["Welcome back!", "Good to see you again!", "Ready for another round?", "Hello again!", "Back for more?", "Resuming session!"];
const PRIVACY_STATEMENTS = [
    "Rest easy—we collect sounds, not names.", 
    "Your voice is a contribution; your identity is your own.",
    "Encrypted, anonymous, and essential.", 
    "No profiles, no tracking. Just your unique voice.",
    "Powering the future of linguistics, one anonymous clip at a time.", 
    "Speak your mind. We’ll keep the secret."
];

// --- ASSETS & HELPERS ---
const getDoodleUrl = (k) => `https://loremflickr.com/400/200/${k},sketch/all`;
const getPhotoUrl = (k) => `https://loremflickr.com/400/200/${k},street,city/all`; 
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function App() {
  // === GLOBAL STATE ===
  const [activeGame, setActiveGame] = useState("HOME"); // HOME, ARCHIVIST, CHAT, VISION
  const [userKey, setUserKey] = useState(null);
  const [xp, setXP] = useState(0);
  const [address, setAddress] = useState("");
  const [dialects, setDialects] = useState([]);
  const [greeting, setGreeting] = useState(""); 

  // === INITIALIZATION ===
  useEffect(() => {
    // 1. User Identification
    const storedKey = localStorage.getItem("pure_user_key");
    const key = storedKey || uuidv4();
    if (!storedKey) localStorage.setItem("pure_user_key", key);
    setUserKey(key);
    setAddress("0x" + key.replace(/-/g, "").slice(0, 40));

    // 2. Generate Session Greeting
    const greetList = storedKey ? RETURNING_GREETINGS : NEW_GREETINGS;
    setGreeting(`${getRandom(greetList)} ${getRandom(PRIVACY_STATEMENTS)}`);

    // 3. Fetch Dialects (Robust Fix)
    const loadDialects = async () => {
        try {
            const app = await Client.connect(SPACE_URL);
            const res = await app.predict("/get_dialects");
            
            let dList;
            const rawData = res.data[0];

            // 1. Robust Parsing
	    // 🟢 CHECK: Is it already an array? (Don't parse)
            if (Array.isArray(rawData)) {
                dList = rawData;
            } 
            // 🟢 CHECK: Is it a string? (Try to parse)
            else if (typeof rawData === "string") {
                try {
                    dList = JSON.parse(rawData);
                } catch {
                    // Fallback for comma-separated strings
                    dList = rawData.split(',').map(d => d.trim());
                }
            } else {
                dList = FALLBACK_DIALECTS;
            }
            
            // 2. 🟢 STRICT FILTER LOGIC
            if (dList && dList.length > 0) {
                const cleanList = dList.filter(d => {
                    const lower = d.toLowerCase();
                    // Block JSON, Config, Metadata, AND "Persona" files
                    return !lower.includes('.json') && 
                           !lower.includes('config') && 
                           !lower.includes('metadata') &&
                           !lower.endsWith('persona'); // 🟢 BLOCKS "NaijaPidginPersona"
                });

                // Step B: Clean up names (remove .csv if present)
                const displayList = cleanList.map(d => d.replace(/\.csv$/i, '').trim());

                // Step C: Remove duplicates & Sort
                const uniqueList = [...new Set(displayList)].sort();

                // Step D: Add "Add New" option last
                const finalList = uniqueList.filter(d => d !== "+ Add New Dialect");
                finalList.push("+ Add New Dialect");
                
                console.log("Loaded Dialects (Cleaned):", finalList);
                setDialects(finalList);
            } else {
                setDialects(FALLBACK_DIALECTS);
            }
        } catch (e) {
            console.warn("Dialect fetch issue:", e);
            setDialects(FALLBACK_DIALECTS);
        }
    };
    
    // Start loading immediately
    loadDialects();
  }, []);

  return (
    <div className="App">
      <div className="cyber-container">
        {/* HUD HEADER */}
        <div className="hud-header">
            <div className="xp-badge">✨ {xp} XP</div>
            <div className="status-badge">MODE: {activeGame}</div>
        </div>

        {/* VIEW CONTROLLER */}
        {activeGame === "HOME" && (
            <HomeMenu onSelect={setActiveGame} greeting={greeting} />
        )}
        
        {activeGame === "ARCHIVIST" && (
            <GameArchivist 
                userKey={userKey} setXP={setXP} dialects={dialects} 
                onBack={() => setActiveGame("HOME")} 
                greeting={greeting} 
            />
        )}

        {activeGame === "SPEED" && (
            <GameSpeedChat 
                userKey={userKey} setXP={setXP} dialects={dialects} 
                onBack={() => setActiveGame("HOME")} 
                greeting={greeting} 
            />
        )}

        {activeGame === "VISION" && (
            <GameVisionQuest 
                userKey={userKey} setXP={setXP} dialects={dialects} 
                onBack={() => setActiveGame("HOME")} 
                greeting={greeting} 
            />
        )}

	{activeGame === "LISTENER" && (
            <GameActiveListener 
                userKey={userKey} setXP={setXP} dialects={dialects} 
                onBack={() => setActiveGame("HOME")} 
            />
        )}

        {/* FOOTER */}
        <div className="id-footer" onClick={() => {navigator.clipboard.writeText(userKey); alert("Copied ID")}}>
            OPERATOR: {address.slice(0,6)}... (Tap to Copy ID)
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🏠 HOME MENU (Visual Cards)
// ==========================================
function HomeMenu({ onSelect, greeting }) {
    // We store the "pending" game to show its tutorial first
    const [selectedTutorial, setSelectedTutorial] = useState(null);

    const handleGameClick = (gameKey) => {
        setSelectedTutorial(gameKey);
    };

    const confirmStart = () => {
        onSelect(selectedTutorial);
        setSelectedTutorial(null);
    };

    return (
        <div className="home-layout">
            {/* TUTORIAL MODAL POPUP */}
            {selectedTutorial && (
                <GameTutorial 
                    gameKey={selectedTutorial} 
                    onStart={confirmStart} 
                    onCancel={() => setSelectedTutorial(null)} 
                />
            )}

            <div className="welcome-banner">
                <p>{greeting}</p>
            </div>

            <div className="instruction-zone">
                <p>SELECT MISSION</p>
                <div className="instruction-line"></div>
            </div>
            
            <div className="menu-grid" style={{paddingBottom: '40px'}}>
                {/* LISTENER CARD */}
                <div className="menu-card" onClick={() => handleGameClick("LISTENER")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.LISTENER.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">👂</div>
                    <h3>THE LISTENER</h3>
                    <p>Active Conversation Mode</p>
                </div>

                {/* ARCHIVIST CARD */}
                <div className="menu-card" onClick={() => handleGameClick("ARCHIVIST")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.ARCHIVIST.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">📜</div>
                    <h3>THE ARCHIVIST</h3>
                    <p>Daily Journaling</p>
                </div>
                
                {/* SPEED CHAT CARD */}
                <div className="menu-card" onClick={() => handleGameClick("SPEED")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.SPEED.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">⚡</div>
                    <h3>SPEED CHAT</h3>
                    <p>Rapid Fire Questions</p>
                </div>
                
                {/* VISION QUEST CARD */}
                <div className="menu-card" onClick={() => handleGameClick("VISION")} style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(${GAME_ASSETS.VISION.image})`, backgroundSize: 'cover'}}>
                    <div className="icon-large">👁️</div>
                    <h3>VISION QUEST</h3>
                    <p>Describe what you see</p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 📜 GAME 1: THE ARCHIVIST (Updated: Thank You Message)
// ==========================================
function GameArchivist({ userKey, setXP, dialects, onBack, greeting }) {
    const [mission, setMission] = useState({ 
        text: greeting, 
        subtext: "Retrieving Archive Topic...", 
        image: getDoodleUrl("abstract") 
    });
    
    // 🟢 FORCE WAV FORMAT (Fixes Silent Audio)
    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ 
        audio: true,
        blobPropertyBag: { type: "audio/wav" } 
    });
    
    // 🟢 INFINITE LOOP LOGIC
    const loadNextTopic = async () => {
        const topics = ["Daily Life", "Food", "Weather", "Childhood", "Hobbies", "Weekend Plans", "Family"];
        const randomTopic = getRandom(topics);
        
        // 🟢 UPDATE: Show "Thank You" message instead of "Loading..."
        setMission(prev => ({ 
            ...prev, 
            text: "Entry Archived Successfully.",
            subtext: "Thanks for your contribution! Fetching next topic...",
            image: getDoodleUrl("success") 
        }));

        try {
            const app = await Client.connect(SPACE_URL);
            const res = await app.predict("/generate_mission", [randomTopic]);
            const data = JSON.parse(res.data[0]);
            
            // Artificial delay (1.5s) so they can read the "Thank You" message
            setTimeout(() => {
                setMission({ 
                    text: data.text, 
                    subtext: "Journal Entry • Keep it short (1 sentence)", 
                    image: getDoodleUrl(randomTopic) 
                });
            }, 1500);
            
        } catch { 
            setMission({ 
                text: `Tell me a short sentence about your ${randomTopic.toLowerCase()}.`, 
                subtext: "Offline Mode • Keep it short (1 sentence)", 
                image: getDoodleUrl("coffee") 
            }); 
        }
    };

    // Load first topic on mount
    useEffect(() => { loadNextTopic(); }, []);

    return (
        <SharedGameLayout
            title="ARCHIVE ENTRY"
            mission={mission}
            recStatus={status}
            startRec={startRecording}
            stopRec={stopRecording}
            mediaBlob={mediaBlobUrl}
            dialects={dialects}
            userKey={userKey}
            setXP={setXP}
            onBack={onBack}
            onNext={loadNextTopic} 
  	    sourceTag="Game: Archivist"
        />
    );
}

// ==========================================
// ⚡ GAME 2: SPEED CHAT (Infinite Loop + Timer)
// ==========================================
function GameSpeedChat({ userKey, setXP, dialects, onBack, greeting }) {
    const [stage, setStage] = useState("onboarding"); 
    const [nickname, setNickname] = useState(localStorage.getItem("pure_nickname") || "");
    
    const [mission, setMission] = useState({ 
        text: greeting, 
        subtext: "Establishing Secure Link...",
        image: getDoodleUrl("network") 
    });

    const [timeLeft, setTimeLeft] = useState(10);
    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ 
    	audio: true,
    	blobPropertyBag: { type: "audio/wav" } // 🟢 FORCE WAV FORMAT
    });
    
    const timerRef = useRef(null);

    // Timer Logic
    useEffect(() => {
        if (status === "recording") {
            setTimeLeft(10);
            timerRef.current = setInterval(() => {
                setTimeLeft(p => {
                    if (p <= 1) { stopRecording(); return 0; }
                    return p - 1;
                });
            }, 1000);
        } else { clearInterval(timerRef.current); }
        return () => clearInterval(timerRef.current);
    }, [status, stopRecording]);

    const fetchMission = async (topic) => {
        setMission(prev => ({ 
            ...prev, 
            text: greeting, 
            subtext: `Loading Topic: ${topic}...` 
        }));
        
        try {
            const app = await Client.connect(SPACE_URL);
            const res = await app.predict("/generate_mission", [`Ask ${nickname} about ${topic}`]);
            const data = JSON.parse(res.data[0]);
            setMission({ text: data.text, subtext: `Target: ${topic}`, image: getDoodleUrl(topic) });
        } catch { 
            setMission({ text: `Hey ${nickname}, tell me about ${topic}!`, subtext: "Offline Mode", image: getDoodleUrl(topic) }); 
        }
    };

    if (stage === "onboarding") {
        return (
            <div className="onboarding-screen">
                <h3>IDENTIFY YOURSELF</h3>
                <input className="cyber-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Enter Codename" />
                <div style={{marginTop:'20px'}}>
                    <button className="cyber-button" onClick={() => {
                        if(!nickname) return;
                        localStorage.setItem("pure_nickname", nickname);
                        setStage("challenge");
                        fetchMission("Hobbies");
                    }}>START MISSION</button>
                    <br/><br/>
                    <button className="cancel-btn" onClick={onBack}>RETURN TO BASE</button>
                </div>
            </div>
        );
    }

    return (
        <SharedGameLayout
            title={`CHAT: ${nickname.toUpperCase()}`}
            mission={mission}
            recStatus={status}
            startRec={startRecording}
            stopRec={stopRecording}
            mediaBlob={mediaBlobUrl}
            dialects={dialects}
            userKey={userKey}
            setXP={setXP}
            onBack={onBack}
            timer={timeLeft} 
            onNext={() => fetchMission(getRandom(["Food", "Traffic", "Music", "Money", "Work", "School", "Family", "Dreams"]))} 
  	    sourceTag="Game: SpeedChat"

        />
    );
}

// ==========================================
// 👁️ GAME 3: VISION QUEST (Clean View + Infinite)
// ==========================================
function GameVisionQuest({ userKey, setXP, dialects, onBack, greeting }) {
    const [mission, setMission] = useState({ 
        text: greeting, 
        subtext: "Calibrating Optical Sensors...",
        image: getPhotoUrl("cyberpunk") 
    });

    // Inside GameVisionQuest
    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ 
    	audio: true,
    	blobPropertyBag: { type: "audio/wav" } // 🟢 FORCE WAV FORMAT
    });

    const loadNewImage = () => {
        const keywords = ["market", "street", "festival", "classroom", "kitchen", "traffic", "cyberpunk", "park", "office"];
        const k = getRandom(keywords);
        setMission({
            text: "In your own way, describe the first thing you see in this image.",
            subtext: `Target Sector: ${k.toUpperCase()}`,
            image: getPhotoUrl(k) 
        });
    };

    // Load initial image (user sees greeting briefly then this loads)
    useEffect(() => { 
        setTimeout(loadNewImage, 2500); 
    }, []);

    return (
        <SharedGameLayout
            title="OBSERVATION DECK"
            mission={mission}
            recStatus={status}
            startRec={startRecording}
            stopRec={stopRecording}
            mediaBlob={mediaBlobUrl}
            dialects={dialects}
            userKey={userKey}
            setXP={setXP}
            onBack={onBack}
            onNext={loadNewImage} 
            mode="vision"
  	    sourceTag="Game: Vision"
 
        />
    );
}


// ==========================================
// 👂 GAME 4: THE LISTENER (With Regenerate Button)
// ==========================================
function GameActiveListener({ userKey, setXP, dialects, onBack }) {
    // 1. STATE & STORAGE
    const loadSavedData = () => {
        const saved = localStorage.getItem("echo_memory_" + userKey);
        return saved ? JSON.parse(saved) : null;
    };
    const memory = loadSavedData();

    // 2. CORE STATE
    const [setup, setSetup] = useState(memory ? memory.setup : { 
        voiceIndex: 0, 
        pitch: 1.0, 
        rate: 1.0,
        userDialect: dialects[0] || "General" 
    });

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
    const [isRegenerating, setIsRegenerating] = useState(false); // 🟢 NEW STATE

    const IS_ADMIN = true; 
    const chatEndRef = useRef(null);
    
    // Save Logic
    useEffect(() => {
        if (phase === "chat" || phase === "verify") {
            const dataToSave = { setup, messages, nickname, pronunciation };
            localStorage.setItem("echo_memory_" + userKey, JSON.stringify(dataToSave));
        }
    }, [messages, setup, nickname, pronunciation, phase, userKey]);

    // Voice Load Logic
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

    // --- ACTIONS ---

    const handleReset = () => {
        if (window.confirm("Start a new conversation?")) {
            localStorage.removeItem("echo_memory_" + userKey);
            setMessages([]);
            setNickname("");
            setPronunciation("");
            setPhase("setup");
        }
    };

    const speak = (text, forcePronunciation = null) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            let spokenText = text;
            const targetName = nickname || currentTranscript;
            const targetSound = forcePronunciation || pronunciation;

            if (targetName && targetSound) {
                const regex = new RegExp(targetName, "gi");
                spokenText = text.replace(regex, targetSound);
            }

            const u = new SpeechSynthesisUtterance(spokenText);
            const selectedVoice = voices[setup.voiceIndex];
            if (selectedVoice) u.voice = selectedVoice;
            u.pitch = setup.pitch;
            u.rate = setup.rate;
            window.speechSynthesis.speak(u);
        }
    };

    const startSession = () => {
        const intro = "Hello, my name is Echo. What should I call you?";
        setMessages([{ sender: 'ai', text: intro }]);
        setPhase("onboarding");
        speak(intro);
    };

    const handleRetry = () => {
        setPhase("chat");
        setCurrentTranscript("");
        setCurrentClarification("");
        setIsEdited(false);
    };

    const handleEdit = (text) => {
        setCurrentTranscript(text);
        setIsEdited(true); 
    };

    const handleEditMeaning = (text) => {
        setCurrentClarification(text);
        setIsEdited(true);
    };

    // 🟢 NEW: REGENERATE MEANING FROM TEXT
    const handleRegenerateMeaning = async () => {
        if (!currentTranscript.trim()) return;
        setIsRegenerating(true);
        try {
            const app = await Client.connect(SPACE_URL);
            const d = setup.userDialect || "General";
            
            // Ask AI to re-analyze based on the NEW text
            const cRes = await app.predict("/generate_clarifications", [currentTranscript, d]);
            const cText = parseClarification(cRes.data[0]);
            
            setCurrentClarification(cText);
            setIsRegenerating(false);
        } catch (e) {
            console.error(e);
            setIsRegenerating(false);
        }
    };

    const handleSubmitName = () => {
        if (!currentTranscript.trim()) return;
        const name = currentTranscript.trim();
        const sound = pronunciation.trim() || name;

        setNickname(name);
        setPronunciation(sound);
        
        const response = `Nice to meet you, ${name}. What would you like to talk about?`;
        setMessages(p => [...p, { sender: 'user', text: name }, { sender: 'ai', text: response }]);
        
        speak(response, sound);
        setCurrentTranscript("");
        setPhase("chat");
    };

    const handleConfirm = async () => {
        setMessages(p => [
            ...p,
            { sender: 'user', text: currentTranscript, isAudio: !isEdited } 
        ]);
        setPhase("responding"); 

        try {
            const app = await Client.connect(SPACE_URL);
            const d = setup.userDialect || "General";
            
            if (currentAudio) {
                 await app.predict("/check_and_submit_logic", [
                    currentTranscript, d, "", currentClarification, 
                    "Conversational", "Chat", "Game: Listener", userKey, currentAudio, IS_ADMIN 
                ]);
            }

            const prompt = `User said: "${currentTranscript}". Meaning: "${currentClarification}". You are Echo. Reply naturally with a short follow-up question.`;
            const res = await app.predict("/generate_mission", [prompt]); 
            
            let replyText = "";
            const rawData = res.data[0];

            if (typeof rawData === "string") {
                try {
                    const parsed = JSON.parse(rawData);
                    replyText = parsed.text || rawData;
                } catch { replyText = rawData; }
            } else if (typeof rawData === "object" && rawData !== null) {
                replyText = rawData.text || JSON.stringify(rawData);
            } else { replyText = "I see. Tell me more."; }
            
            replyText = String(replyText).replace(/^{"text":\s*"/, "").replace(/"}$/, "");

            setMessages(p => [...p, { sender: 'ai', text: replyText }]);
            speak(replyText);
            setXP(x => x + 25);

        } catch (e) {
            const fallback = "I'm listening. Please continue.";
            setMessages(p => [...p, { sender: 'ai', text: fallback }]);
            speak(fallback);
        } finally {
            setPhase("chat"); 
            setCurrentTranscript("");
            setCurrentClarification("");
            setIsEdited(false);
        }
    };

    // --- AUDIO HANDLING ---
    const handleAudioStop = async (blobUrl, blob) => {
        if (phase === "onboarding") {
            setPhase("processing"); 
            try {
                const app = await Client.connect(SPACE_URL);
                const d = setup.userDialect || "General";
                
                const tRes = await app.predict("/transcribe_check", [blob, d]);
                const text = tRes.data[0];
                
                setCurrentTranscript(text);
                if(!pronunciation) setPronunciation(text); 
                setPhase("onboarding"); 
            } catch (e) {
                setPhase("onboarding");
            }
            return;
        }

        setPhase("processing");
        setCurrentAudio(blob);
        setIsEdited(false); 
        try {
            const app = await Client.connect(SPACE_URL);
            const d = setup.userDialect || "General";
            
            const tRes = await app.predict("/transcribe_check", [blob, d]);
            const text = tRes.data[0];
            setCurrentTranscript(text);
            
            const cRes = await app.predict("/generate_clarifications", [text, d]);
            const cText = parseClarification(cRes.data[0]);
            
            setCurrentClarification(cText);
            setPhase("verify");
        } catch (e) {
            setMessages(p => [...p, { sender: 'ai', text: "I couldn't hear you. Try again?" }]);
            setPhase("chat");
        }
    };

    const { status, startRecording, stopRecording } = useReactMediaRecorder({ 
        audio: true, blobPropertyBag: { type: "audio/wav" }, onStop: handleAudioStop 
    });

    const parseClarification = (raw) => {
        try { return JSON.parse(raw).clarification || raw; } catch { return raw; }
    };

    // --- RENDER ---
    return (
        <div className="game-layout listener-mode">
            <div className="listener-header">
                <button className="back-icon" onClick={onBack}>←</button>
                <div className={`status-dot ${status === "recording" ? "pulsing-red" : ""}`}></div>
                <h3>ECHO {nickname ? `| ${nickname.toUpperCase()}` : ""}</h3>
                <button style={{marginLeft:'auto', background:'transparent', border:'none', fontSize:'16px', cursor:'pointer'}} onClick={handleReset}>🗑️</button>
            </div>

            {phase === "setup" ? (
                <div className="setup-screen">
                    <div className="icon-large">🎛️</div>
                    <h3>CONFIGURE ECHO</h3>
                    <div className="setup-row">
                        <label>YOUR DIALECT</label>
                        <select value={setup.userDialect} onChange={e => setSetup({...setup, userDialect: e.target.value})}>
                            {dialects.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="setup-row">
                        <label>AI VOICE</label>
                        <select value={setup.voiceIndex} onChange={e => setSetup({...setup, voiceIndex: parseInt(e.target.value)})}>
                            {voices.map((v, i) => <option key={i} value={i}>{v.name} ({v.lang})</option>)}
                        </select>
                    </div>
                    <div className="setup-row">
                        <label>PITCH ({setup.pitch}x)</label>
                        <input type="range" min="0.5" max="2.0" step="0.1" value={setup.pitch} onChange={e => setSetup({...setup, pitch: parseFloat(e.target.value)})}/>
                    </div>
                    <div className="setup-row">
                        <label>SPEED ({setup.rate}x)</label>
                        <input type="range" min="0.5" max="2.0" step="0.1" value={setup.rate} onChange={e => setSetup({...setup, rate: parseFloat(e.target.value)})}/>
                    </div>
                    <button className="cyber-button" onClick={() => speak("Voice check.")} style={{marginBottom:'10px', background:'transparent', border:'1px solid #38bdf8'}}>🔊 TEST</button>
                    <button className="cyber-button" onClick={startSession}>INITIALIZE SYSTEM</button>
                </div>
            ) : (
                <>
                    <div className="chat-log">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-bubble ${m.sender}`}>
                                {m.isAudio && <span style={{marginRight:'5px'}}>🎤</span>}
                                {m.text}
                            </div>
                        ))}
                        {phase === "processing" && <div className="chat-bubble ai typing">Echo is thinking...</div>}
                        {phase === "responding" && <div className="chat-bubble ai typing">Echo is replying...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="listener-controls">
                        {phase === "onboarding" && (
                            <div className="onboarding-controls">
                                <label style={{fontSize:'11px', color:'#94a3b8', display:'block', marginBottom:'5px'}}>SAY OR TYPE YOUR NAME:</label>
                                <div className="input-bar" style={{marginBottom:'10px'}}>
                                    <input 
                                        className="cyber-input"
                                        value={currentTranscript} 
                                        onChange={e => {
                                            setCurrentTranscript(e.target.value);
                                            if(!showPhonetic) setPronunciation(e.target.value);
                                        }} 
                                        placeholder="Display Name (e.g. Onyi)"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}
                                    />
                                </div>
                                {showPhonetic && (
                                    <div className="input-bar" style={{marginBottom:'10px', animation:'fadeIn 0.3s'}}>
                                        <label style={{fontSize:'9px', color:'#38bdf8', marginRight:'10px'}}>PHONETIC SPELLING:</label>
                                        <input 
                                            className="cyber-input"
                                            value={pronunciation} 
                                            onChange={e => setPronunciation(e.target.value)} 
                                            placeholder="e.g. Own-yee"
                                        />
                                    </div>
                                )}
                                <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                                    {currentTranscript && (
                                        <button 
                                            onClick={() => speak(currentTranscript, pronunciation || currentTranscript)}
                                            style={{background:'transparent', border:'1px solid #38bdf8', color:'#38bdf8', borderRadius:'8px', padding:'0 10px', fontSize:'12px'}}
                                        >
                                            🔊 HEAR IT
                                        </button>
                                    )}
                                    {currentTranscript && !showPhonetic && (
                                        <button 
                                            onClick={() => {setShowPhonetic(true); setPronunciation(currentTranscript)}}
                                            style={{background:'transparent', border:'none', color:'#94a3b8', fontSize:'10px', textDecoration:'underline'}}
                                        >
                                            Wrong Pronunciation?
                                        </button>
                                    )}
                                </div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button 
                                        className={`record-btn ${status === "recording" ? "pulsing" : ""}`}
                                        onMouseDown={startRecording} onMouseUp={stopRecording}
                                        onTouchStart={startRecording} onTouchEnd={stopRecording}
                                        style={{flex:1, borderRadius:'8px', fontSize:'12px'}}
                                    >
                                        {status === "recording" ? "🛑 RELEASE" : "🎤 SAY NAME"}
                                    </button>
                                    <button 
                                        className="cyber-button" 
                                        onClick={handleSubmitName} 
                                        style={{flex:1, background: currentTranscript ? '#22c55e' : '#334155'}}
                                        disabled={!currentTranscript}
                                    >
                                        CONFIRM ✅
                                    </button>
                                </div>
                            </div>
                        )}

                        {(phase === "chat" || phase === "processing" || phase === "responding") && (
                            <div className="record-bar">
                                <button 
                                    className={`record-btn ${status === "recording" ? "pulsing" : ""}`}
                                    onMouseDown={startRecording} onMouseUp={stopRecording}
                                    onTouchStart={startRecording} onTouchEnd={stopRecording}
                                    disabled={phase !== "chat"}
                                    style={{width: '100%', borderRadius: '12px', padding: '20px'}}
                                >
                                    {status === "recording" ? "🛑 RELEASE TO SEND" : 
                                     phase === "processing" ? "⏳ PROCESSING..." :
                                     phase === "responding" ? "🔊 SPEAKING..." :
                                     "🎙️ HOLD TO SPEAK"}
                                </button>
                            </div>
                        )}

                        {phase === "verify" && (
                            <div className="verify-card">
                                <div className="verify-row">
                                    <label>I HEARD (TYPE TO EDIT):</label>
                                    <input 
                                        className="cyber-input" 
                                        value={currentTranscript} 
                                        onChange={e => handleEdit(e.target.value)} 
                                        style={{border: isEdited ? '1px solid #22c55e' : '1px solid #475569'}}
                                    />
                                </div>
                                
                                {/* 🟢 1. MEANING + REGENERATE BUTTON */}
                                <div className="verify-row">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                                        <label style={{margin:0}}>MEANING (EDIT IF WRONG):</label>
                                        <button 
                                            onClick={handleRegenerateMeaning}
                                            disabled={isRegenerating}
                                            style={{
                                                background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8',
                                                fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            {isRegenerating ? "UPDATING..." : "🔄 UPDATE MEANING"}
                                        </button>
                                    </div>
                                    <input 
                                        className="cyber-input" 
                                        value={currentClarification} 
                                        onChange={e => handleEditMeaning(e.target.value)} 
                                        style={{
                                            border: '1px solid #38bdf8', 
                                            color: '#34d399', 
                                            fontStyle: 'italic'
                                        }}
                                    />
                                </div>

                                <div className="verify-actions">
                                    <button className="reject-btn" onClick={handleRetry} style={{background: '#334155', border:'none', color:'#ef4444'}}>🎤 RETRY</button>
                                    <button className="confirm-btn" onClick={handleConfirm}>{isEdited ? "SEND EDIT ✅" : "CONFIRM ✅"}</button>
                                </div>
                            </div>
                        )}

			{/* 🟢 NEW: Feedback Link */}
                        <div style={{textAlign: 'center', marginTop: '15px', paddingBottom: '10px'}}>
                            <a 
                                href={`mailto:toecm.solutions@gmail.com?subject=PureConvo Feedback (The Listener)&body=User ID: ${userKey}%0D%0A%0D%0A(Type your feedback here...)`}
                                style={{color: '#94a3b8', fontSize: '11px', textDecoration: 'none', borderBottom: '1px dotted #94a3b8'}}
                            >
                                💬 Submit Feedback
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


// ==========================================
// ⚙️ SHARED GAME LAYOUT (Updated with Regenerate)
// ==========================================
function SharedGameLayout({ title, mission, recStatus, startRec, stopRec, mediaBlob, dialects, userKey, setXP, onBack, onNext, timer, mode, sourceTag, onReset }) {
    const [step, setStep] = useState("RECORD"); 
    
    // Data State
    const [transcribed, setTranscribed] = useState("");
    const [clarification, setClarification] = useState("");
    const [tone, setTone] = useState("Neutral / Conversational"); 
    const [context, setContext] = useState("General");
    const [pragmatics, setPragmatics] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false); // 🟢 NEW STATE
    
    const [dialect, setDialect] = useState(dialects[0] || "General");
    const [customD, setCustomD] = useState("");

    // 1. Initial Analysis (Audio -> Text + Meaning)
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
            
            // Initial Clarification
            const cRes = await app.predict("/generate_clarifications", [text, d]);
            parseClarification(cRes.data[0]);
            
            setStep("REVIEW");
        } catch (e) { 
            console.error(e);
            setStep("REVIEW"); 
            setTranscribed("Error analyzing audio."); 
        }
    };

    // 2. 🟢 NEW: Regenerate Meaning (Text -> Meaning)
    const handleRegenerate = async () => {
        if (!transcribed.trim()) return;
        setIsRegenerating(true);
        try {
            const app = await Client.connect(SPACE_URL);
            const d = dialect === "+ Add New Dialect" ? customD : dialect;
            
            const res = await app.predict("/generate_clarifications", [transcribed, d]);
            parseClarification(res.data[0]);
            
            setIsRegenerating(false);
        } catch (e) {
            console.error(e);
            setClarification("Failed to regenerate. Please type manually.");
            setIsRegenerating(false);
        }
    };

    // Helper to parse JSON or String responses
    const parseClarification = (rawData) => {
        let data;
        try {
            data = JSON.parse(rawData);
        } catch {
            data = { clarification: rawData }; // Fallback for plain text
        }
        setClarification(data.clarification || data.Meaning || rawData);
        setContext(data.context || "General");
        setPragmatics(data.pragmatics || "");
    };

    // 3. Final Submit
    const handleSubmit = async () => {
        setStep("MINTING");
        try {
            const blob = await fetch(mediaBlob).then(r => r.blob());
            const app = await Client.connect(SPACE_URL);
            const d = dialect === "+ Add New Dialect" ? customD : dialect;
            
            await app.predict("/check_and_submit_logic", [
                transcribed, 
                d, 
                customD, 
                clarification, 
                tone, 
                context, 
                sourceTag || pragmatics,
                userKey, 
                blob, 
                false
            ]);
            setXP(p => p + 50);
            
            if (onNext) { 
                setStep("RECORD"); 
                setTranscribed("");
                setClarification("");
                onNext(); 
            } 
            else { onBack(); }
        } catch { setStep("RECORD"); }
    };

    return (
        <div className="game-layout">
            
            {/* DYNAMIC LAYOUT SWITCHER */}
            {mode === "vision" ? (
                <div className="vision-mode-container">
                    <div className="vision-image" style={{backgroundImage: `url(${mission.image})`}} />
                    <div className="vision-text-block">
                        <h3>{title}</h3>
                        {mission.subtext && <p className="subtext">{mission.subtext}</p>}
                        <p className="main-text">{mission.text}</p>
                    </div>
                </div>
            ) : (
                <div className="mission-card">
                    <div className="doodle-bg" style={{backgroundImage: `url(${mission.image})`}} />
                    <div className="mission-content-overlay">
                        {/* 🟢 NEW: Header with Reset Option */}
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div>
                                <h3>{title}</h3>
                                {mission.subtext && <p style={{fontSize:'0.8em', opacity:0.7, marginBottom:'5px'}}>{mission.subtext}</p>}
                            </div>
                            {/* Show Trash Can if onReset is provided */}
                            {onReset && (
                                <button 
                                    onClick={onReset}
                                    style={{background:'rgba(0,0,0,0.3)', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer', fontSize:'14px', marginLeft:'10px'}}
                                    title="Reset Game"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                        <p>{mission.text}</p>
                    </div>
                </div>
            )}

            <div className="control-panel">
                {step === "RECORD" && (
                    <>
                        <div className="dialect-selector">
                            <label style={{fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', letterSpacing: '1px', fontWeight: '600'}}>
                                SELECT TARGET DIALECT (OR ADD NEW):
                            </label>

                            <select value={dialect} onChange={e => setDialect(e.target.value)}>
                                {dialects.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {dialect === "+ Add New Dialect" && (
                                <input 
                                    className="cyber-input" 
                                    placeholder="Enter Name (e.g. Toronto Slang)" 
                                    value={customD} 
                                    onChange={e => setCustomD(e.target.value)} 
                                    style={{marginTop:'8px'}}
                                />
                            )}
                        </div>

                        <div className={`record-zone ${recStatus === "recording" ? "active" : ""}`}>
                            {timer !== undefined && recStatus === "recording" && <div className="timer">{timer}s</div>}
                            <button 
                                className={`record-btn ${recStatus === "recording" ? "pulsing" : ""}`}
                                onMouseDown={startRec} onMouseUp={stopRec}
                                onTouchStart={startRec} onTouchEnd={stopRec}
                            >
                                {recStatus === "recording" ? "🛑 RELEASE" : "🎙️ HOLD TO SPEAK"}
                            </button>
                        </div>
                        <div className="action-row">
                             <button className="cancel-btn" onClick={onBack}>BACK</button>
                             <button className="cyber-button" onClick={handleAnalyze} disabled={!mediaBlob}>ANALYZE</button>
                        </div>
                    </>
                )}

                {(step === "ANALYZING" || step === "MINTING") && <div className="loading">PROCESSING...</div>}

                {step === "REVIEW" && (
                    <div className="review-box">
                        <div className="audio-preview" style={{marginBottom: '10px'}}>
                            <label style={{fontSize:'10px', color:'#94a3b8', display:'block', marginBottom:'5px'}}>REVIEW RECORDING:</label>
                            <audio src={mediaBlob} controls style={{width: '100%', borderRadius: '8px'}} />
                        </div>

                        {/* 🟢 EDITABLE TRANSCRIPTION */}
                        <div className="input-group">
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <label>I HEARD (EDIT IF NEEDED):</label>
                            </div>
                            <textarea value={transcribed} onChange={e => setTranscribed(e.target.value)} />
                        </div>
                        
                        {/* 🟢 REGENERATE BUTTON + MEANING */}
                        <div className="input-group">
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                                <label style={{margin:0}}>MEANING:</label>
                                <button 
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                    style={{
                                        background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8',
                                        fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    {isRegenerating ? "UPDATING..." : "🔄 REGENERATE FROM TEXT"}
                                </button>
                            </div>
                            <textarea value={clarification} onChange={e => setClarification(e.target.value)} />
                        </div>

                        <div className="input-group">
                            <label>TONE:</label>
                            <select value={tone} onChange={e => setTone(e.target.value)}>
                                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="action-row">
                            <button className="cancel-btn" onClick={() => setStep("RECORD")}>RETRY</button>
                            <button className="cyber-button" onClick={handleSubmit}>MINT (+50 XP)</button>
                        </div>
                    </div>
                )}

 		{/* 🟢 NEW: Feedback Link in Footer of Controls */}
                <div style={{textAlign: 'center', marginTop: '15px'}}>
                    <a 
                        href={`mailto:toecm.solutions@gmail.com?subject=PureConvo Feedback (${title})&body=User ID: ${userKey}%0D%0A%0D%0A(Type your feedback here...)`}
                        style={{color: '#94a3b8', fontSize: '11px', textDecoration: 'none', borderBottom: '1px dotted #94a3b8'}}
                    >
                        💬 Submit Feedback
                    </a>
                </div>
            </div>
        </div>
    );
}
export default App;