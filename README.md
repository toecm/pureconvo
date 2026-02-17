# 🦜 PureConvo: Gamified Dialect Data Collection

> **A multi-agent AI platform for preserving under-represented languages through gameplay.**

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Stack](https://img.shields.io/badge/tech-React%20%7C%20Python%20%7C%20Gemini%20%7C%20HuggingFace-orange)

## 📖 Overview
PureConvo is a research-driven application designed to collect, verify, and preserve diverse English dialects (e.g., Nigerian Pidgin, AAVE) that are often misunderstood by standard AI models. 

Instead of boring surveys, users play **4 interactive audio games** to contribute voice data. The system uses a **Split-Agent Architecture** to process, verify, and learn from this data in real-time.

---

## 🎮 The Games
PureConvo gamifies data collection through four distinct modes:

### 1. 👂 The Listener (Active Conversation)
* **Goal:** Teach the AI to understand your unique dialect.
* **Mechanic:** Speak naturally to "Echo," verify the transcript, and correct the *meaning* (pragmatics) behind slang or idioms.

### 2. 📜 The Archivist (Journaling)
* **Goal:** Preserve storytelling styles and monologues.
* **Mechanic:** Receive a daily prompt (e.g., "Childhood") and record a short story.

### 3. ⚡ Speed Chat (Rapid Fire)
* **Goal:** Capture spontaneous, unscripted reactions.
* **Mechanic:** Answer random questions within a 10-second timer.

### 4. 👁️ Vision Quest (Image Description)
* **Goal:** Teach the AI visual context in different cultures.
* **Mechanic:** Describe a random image (e.g., a market scene) in your local dialect.

---

## 🏗️ Architecture
PureConvo runs on a **Split-Agent Architecture**:

* **Frontend (React):** Handles the interactive game UI and audio recording.
* **Backend (Python/Gradio):** Manages the AI agents.
    * **AgentInput:** Process raw audio and text.
    * **AgentBrain (Gemini 2.0):** Routes queries between "Fast" (Flash) and "Smart" (Pro) models for interpretation.
    * **AgentTrust:** Verifies data quality and handles storage.
    * **AgentUX:** Manages the admin dashboard and feedback loops.
* **Storage:** Hugging Face Datasets (PureChain).

---

## 🚀 Installation

### Prerequisites
* Node.js & npm
* Python 3.9+
* Hugging Face Account (for storage)
* Google Gemini API Key

### 1. Frontend Setup
```bash
cd pure-app
npm install
npm start

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py

🛡️ Privacy & Ethics
Anonymous: No personally identifiable information (PII) is linked to voice data.

Consent: All data is contributed voluntarily via gameplay.

Open Source: We believe in democratizing language AI.

📄 License
This project is licensed under the Apache 2.0 License - see the LICENSE file for details.


### **Step 3: Push to GitHub**
Run these commands to save and upload it:

```bash
git add README.md
git commit -m "Add project documentation"
git push origin main
