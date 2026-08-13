# SAYANDH RAJ - BRUTALIST PORTFOLIO ARCHITECTURE

> **SYSTEM STATUS: ONLINE // PROTOCOL: INDUSTRIAL TOKYO**

Welcome to the central repository for the personal portfolio architecture of **Sayandh Raj**, Elite AI Engineer & Data Architect. This system is engineered with a strict adherence to Brutalist design principles—favoring raw performance, high-contrast aesthetics, and heavy-duty, physics-driven interactions over delicate web norms.

## TECH STACK MATRIX
This infrastructure is powered by the following core components:

### 1. FRONTEND ENGINE
* **Framework:** React (Vite) for lightning-fast compilation and routing.
* **Animations:** GSAP (ScrollTrigger) for heavy slide-ins, slam-downs, and inertia-driven masonry grids. Optimized via `matchMedia` for seamless mobile execution.
* **Styling:** Pure Vanilla CSS enforcing the strict "Industrial Tokyo" palette (Asphalt Black, Concrete White, Industrial Cream, Alert Red).

### 2. MICRO-INTERACTIONS
* **Cursor Interface:** Custom `mix-blend-mode: difference` crosshair tracking for dynamic color inversion against all surfaces.
* **Audio Feedback:** Native Web Audio API integrated directly into the terminal, generating zero-latency mechanical keystroke oscillators. 

### 3. THE UNIX AI TERMINAL
* **Dual-LLM Architecture:** Primary queries hit the **Gemini 1.5 Flash** API. Fallback protocols automatically route to **OpenRouter** on timeout.
* **Persona Injection:** The AI acts as a personal UNIX CLI agent, loaded with a hidden system prompt containing advanced architectural data, skills, and certifications.
* **UI Protocol:** Strict character-by-character rendering. Zero chat bubbles.

### 4. BACKEND & SECURITY
* **Auth Protocol:** Firebase Authentication (Google/GitHub) via terminal command `> login`.
* **Logging System:** Firestore seamlessly logs all terminal queries and AI responses for data analytics.

### 5. MONETIZATION NODE
* **Matcha Protocol:** Integrated Stripe/Razorpay payment link, executed via terminal command `> execute tip_matcha.sh` or the footer action button.

---

## LOCAL SETUP PROTOCOL

To clone and initialize this architecture locally, execute the following commands:

### 1. Initialize Workspace
```bash
git clone https://github.com/sayandhsr/portfolio-website.git
cd portfolio-website
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory. Do **NOT** expose this file to version control.
```env
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_FIREBASE_API_KEY=your_firebase_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 3. Launch Development Server
```bash
npm run dev
```

---

## DEPLOYMENT ARCHITECTURE
This application is configured for edge deployment on **Vercel**. 
The repository includes a `vercel.json` configuration file enforcing strict Single Page Application (SPA) routing protocols to `/index.html`. All environment variables must be securely injected via the Vercel project dashboard prior to deployment. 

> **SYSTEM ARCHITECT: SAYANDH RAJ**
