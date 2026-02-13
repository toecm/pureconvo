import React, { useState, useEffect } from 'react';
import { Client } from "@gradio/client";
import { ethers } from "ethers";
import { useReactMediaRecorder } from "react-media-recorder";
import './App.css';

const SPACE_URL = "https://toecm-pureconvo.hf.space"; 
const CONTEXTS = ["Marketplace", "School", "Traffic", "Food", "Street", "Family", "Rain", "Hospital"];
const TONES = ["Neutral / Conversational", "Casual / Slang", "Formal / Professional", "Proverb / Idiom"];

function App() {
  // --- 1. STATE ---
  const [userKey, setUserKey] = useState(null);
  const [address, setAddress] = useState("");
  const [xp, setXP] = useState(0);
  const [status, setStatus] = useState("IDLE"); 
  const [consentStatus, setConsentStatus] = useState(null);
  const [missionState, setMissionState] = useState({ 
    text: "Connecting to Satellite...", emoji: "🛰️", ctx: "Loading", image: "https://loremflickr.com/400/220/city" 
  });
  
  const [isReviewing, setIsReviewing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [clarificationOptions, setClarificationOptions] = useState([]);
  const [selectedClarification, setSelectedClarification] = useState("");
  const [selectedTone, setSelectedTone] = useState("Neutral / Conversational"); // 🟢 NEW TONE STATE
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [selectedDialect, setSelectedDialect] = useState("Korean English");
  const [availableDialects, setAvailableDialects] = useState(["Korean English"]);

  const { status: recStatus, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ 
    audio: true,
    blobPropertyBag: { type: "audio/wav" } 
  });

  // --- 2. CORE FUNCTIONS ---
  const fetchNewMission = React.useCallback(async (forcedContext = null) => {
    const nextContext = forcedContext || CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)];
    const imageUrl = `https://loremflickr.com/400/220/${nextContext.toLowerCase()}?lock=${Date.now()}`;
    setMissionState(prev => ({ ...prev, image: imageUrl, ctx: nextContext, text: "Receiving transmissions..." }));

    try {
      const client = await Client.connect(SPACE_URL);
      const result = await client.predict("/generate_mission", [nextContext]);
      const missionData = JSON.parse(result.data[0]);
      setMissionState({ text: missionData.text, emoji: missionData.emoji, ctx: nextContext, image: imageUrl });
    } catch (e) {
      setMissionState({ text: "Describe what you see in this image.", emoji: "📸", ctx: nextContext, image: imageUrl });
    }
  }, []);

  // --- 3. INITIALIZATION ---
  useEffect(() => {
    const storedConsent = localStorage.getItem("pureconvo_consent");
    if (storedConsent) setConsentStatus(storedConsent);

    const initSystem = async () => {
      let storedKey = localStorage.getItem("pureconvo_burner_key");
      let wallet = storedKey ? new ethers.Wallet(storedKey) : ethers.Wallet.createRandom();
      if (!storedKey) localStorage.setItem("pureconvo_burner_key", wallet.privateKey);
      
      setUserKey(wallet.privateKey);
      setAddress(wallet.address);
      setXP(parseInt(localStorage.getItem("pureconvo_xp") || "0"));

      try {
        const client = await Client.connect(SPACE_URL);
        const result = await client.predict("/get_dialects", []);
        if (result.data && Array.isArray(result.data[0])) setAvailableDialects(result.data[0]); 
      } catch (e) { console.log("Connecting to Brain..."); }
    };

    initSystem();
    fetchNewMission("Traffic"); 
  }, [fetchNewMission]);

  // --- 4. ACTION HANDLERS ---
  const handleReview = async () => {
    if (!mediaBlobUrl) return;
    setStatus("TRANSCRIBING...");
    try {
      const audioBlob = await fetch(mediaBlobUrl).then(r => r.blob());
      const client = await Client.connect(SPACE_URL);
      const result = await client.predict("/transcribe_check", [audioBlob, selectedDialect]);
      setTranscribedText(result.data[0]); 
      setIsReviewing(true); 
      setStatus("REVIEW");
    } catch (error) { setStatus("OFFLINE ERROR"); }
  };

  const handleGenerateClarifications = async () => {
    if (!transcribedText || isGeneratingOptions) return;
    setIsGeneratingOptions(true);
    try {
      const client = await Client.connect(SPACE_URL);
      const result = await client.predict("/generate_clarifications", [transcribedText, selectedDialect]);
      
      // 🟢 THE FIX: Safely check if Gradio already unpacked the JSON
      let options = [];
      if (typeof result.data[0] === 'string') {
          options = JSON.parse(result.data[0]); // Unpack it if it's a string
      } else {
          options = result.data[0]; // Use it directly if Gradio already unpacked it!
      }

      setClarificationOptions(options);
      
      // Auto-fill the text box with the baseline
      if (options && options.length > 0) {
        setSelectedClarification(options[0]);
      }
    } catch (error) {
      // 🟢 If it fails now, it will print the EXACT error message so we aren't guessing
      const fallback = `UI Error: ${error.message}`;
      setClarificationOptions([fallback]);
      setSelectedClarification(fallback);
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedClarification || status === "UPLOADING") return;
    setStatus("UPLOADING");
    
    try {
      const audioBlob = await fetch(mediaBlobUrl).then(r => r.blob());
      const client = await Client.connect(SPACE_URL);
      
      await client.predict("/check_and_submit_logic", [
        transcribedText, "+ Add New Dialect", selectedDialect, selectedClarification, selectedTone, missionState.ctx, "", userKey, audioBlob, false 
      ]);

      setXP(prev => prev + 50);
      localStorage.setItem("pureconvo_xp", (xp + 50).toString());
      
      setIsReviewing(false);
      setTranscribedText("");
      setSelectedClarification("");
      setSelectedTone("Neutral / Conversational");
      setClarificationOptions([]);
      clearBlobUrl();
      setStatus("✅ SAVED TO PURE CHAIN");
      
      setTimeout(() => {
        setStatus("IDLE");
        fetchNewMission();
      }, 2000);

    } catch (error) { setStatus("UPLOAD ERROR"); }
  };

  // --- 5. RENDER ---
  if (!consentStatus) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#020617', color:'white', textAlign:'center', padding:'20px'}}>
      <div style={{background:'#0f172a', padding:'40px', borderRadius:'20px', border:'1px solid #3b82f6', maxWidth:'400px'}}>
        <h2>🌍 PureConvo</h2>
        <p>Help AI learn your community's English. Data is secured on the Pure Chain.</p>
        <button className="cyber-button SUCCESS" onClick={() => {localStorage.setItem("pureconvo_consent", "yes"); setConsentStatus("yes")}}>START GAME</button>
      </div>
    </div>
  );

  return (
    <div className="game-wrapper">
      <div className="game-container">
        {/* HUD */}
        <div className="hud-header">
          <div className="level-badge">LVL {Math.floor(xp / 100) + 1}</div>
          <div className="xp-bar-container"><div className="xp-bar-fill" style={{width: `${xp % 100}%`}}></div></div>
        </div>

        {/* MISSION CARD */}
        <div className="mission-card">
          <img src={missionState.image} alt="Scene" style={{width:'100%', height:'180px', objectFit:'cover'}} />
          <div style={{padding:'15px'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#60a5fa'}}>{missionState.emoji} {missionState.ctx}</span>
                <button onClick={() => fetchNewMission()} className="skip-btn">SKIP</button>
            </div>
            <p style={{color:'white', fontWeight:'bold', marginTop:'10px'}}>"{missionState.text}"</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="controls-area">
          <select className="cyber-select" value={selectedDialect} onChange={e => setSelectedDialect(e.target.value)}>
            {availableDialects.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          {isReviewing ? (
            <div className="review-box">
              <p style={{fontSize:'12px', color:'#94a3b8', marginBottom:'5px', textAlign:'left'}}>1. Edit Transcription:</p>
              <textarea className="cyber-input" value={transcribedText} onChange={e => setTranscribedText(e.target.value)} style={{minHeight:'40px'}} />
              
              {!clarificationOptions.length ? (
                <button className="cyber-button" onClick={handleGenerateClarifications} disabled={isGeneratingOptions}>
                  {isGeneratingOptions ? "🧠 LOADING PERSONA..." : "GET AI BASELINE"}
                </button>
              ) : (
                <div className="clarification-area" style={{textAlign:'left', marginTop:'15px'}}>
                  {/* SINGLE EDITABLE CLARIFICATION BOX */}
                  <p style={{fontSize:'12px', color:'#10b981', marginBottom:'5px'}}>2. Edit Meaning:</p>
                  <textarea 
                    className="cyber-input" 
                    value={selectedClarification} 
                    onChange={e => setSelectedClarification(e.target.value)} 
                    style={{ minHeight: '60px', borderColor: '#10b981', marginBottom: '10px' }}
                  />

                  {/* TONE DROPDOWN */}
                  <p style={{fontSize:'12px', color:'#f59e0b', marginBottom:'5px'}}>3. Select Tone:</p>
                  <select className="cyber-select" value={selectedTone} onChange={e => setSelectedTone(e.target.value)} style={{borderColor:'#f59e0b', marginBottom:'15px'}}>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <button className="cyber-button SUCCESS" onClick={handleFinalSubmit} disabled={!selectedClarification || status === "UPLOADING"}>
                    {status === "UPLOADING" ? "CONNECTING..." : "SUBMIT DATA"}
                  </button>
                </div>
              )}
              <button onClick={() => {setIsReviewing(false); setClarificationOptions([]);}} className="discard-btn">CANCEL</button>
            </div>
          ) : (
            <>
              <div className="record-area" style={{textAlign:'center'}}>
                <button className={`record-btn ${recStatus === "recording" ? "recording" : ""}`} onMouseDown={startRecording} onMouseUp={stopRecording}>
                  {recStatus === "recording" ? "🎙️ RECORDING..." : "🎙️ HOLD TO SPEAK"}
                </button>
              </div>
              {mediaBlobUrl && (
                <div style={{margin:'15px 0', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'10px'}}>
                  <audio src={mediaBlobUrl} controls style={{width:'100%'}} />
                </div>
              )}
              <button className="cyber-button" onClick={handleReview} disabled={!mediaBlobUrl || status !== "IDLE"}>
                {status === "IDLE" ? "ANALYZE VOICE" : status}
              </button>
            </>
          )}
          <div className="id-footer">OPERATOR: {address.slice(0,6)}...</div>
        </div>
      </div>
    </div>
  );
}

export default App;