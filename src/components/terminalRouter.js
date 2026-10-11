import { isGameBoyTrigger } from '../gameboy/triggerMatcher.js';

export const DIRECTIVE_RESPONSES = {
  GREETING: `system operational.\nenter a directive: whois | skills | projects | contact | help\nor ask any technical query.`,

  HELP: `[AVAILABLE DIRECTIVES]
whois      - identity, education & specialization
skills     - machine learning & engineering stack
projects   - live deployments & repositories
experience - professional timeline & certificates
badges     - 23 verified credly badges (IBM / Google)
contact    - direct comm channels
education  - academic credentials
game       - retro game boy arcade
audio      - toggle terminal audio
clear      - clear terminal buffer`,

  WHOIS: `[IDENTITY: SAYANDH RAJ]
role       : AI/ML Engineer & Data Architect
education  : 1. M.Sc. Computer Science (AI Specialization) [2026-2028, Pursuing]
                Kerala University of Digital Sciences, Innovation and Technology
                (Digital University of Kerala / DUK, formerly IIITM-K), Trivandrum
             2. BCA in AI & Data Science [2023-2026, CGPA: 8.59/10]
                Yenepoya (Deemed to be University), Bengaluru Off-Campus
                (Main University: Mangalore, Karnataka, India)
                Industrial Partners: IBM & TCS iON
domain     : Deep Learning, Neural Networks, Generative AI (LLMs/RAG),
             NLP, Computer Vision, Scalable Data Pipelines
github     : https://github.com/sayandhsr
linkedin   : https://linkedin.com/in/sayandh-raj
credly     : https://credly.com/users/sayandhraj`,

  SKILLS: `[TECHNICAL ARSENAL]
ai / ml    : PyTorch, TensorFlow, Deep Neural Networks, NLP, OpenCV
gen ai     : LangChain, Hugging Face, RAG Architecture, OpenRouter
analytics  : Pandas, NumPy, Scikit-Learn, Power BI, Tableau, SQL, R
systems    : FastAPI, Docker, Firebase, Supabase, Git, Vercel`,

  PROJECTS: `[DEPLOYMENTS]
1. Unsullied Code - Offline-first mobile IDE with true AST engine
   url: https://unsulliedcode.vercel.app/
2. KILL SWITCH - Brutalist smoking community platform
   url: https://notkillwitch.vercel.app/
3. ATS Resume Analyzer & AI Builder - JD parsing & vector ranking
   url: https://github.com/sayandhsr
4. RAG Document Chatbot - Enterprise multi-doc QA engine
   url: https://github.com/sayandhsr
5. Precision Crop Forecasting & Skin Disease Prediction
   url: https://github.com/sayandhsr`,

  KILL_SWITCH: `[PROJECT: KILL SWITCH]
brutalist community platform for open debate arenas and culture.
status : live
url    : https://notkillwitch.vercel.app/`,

  UNSULLIED: `[PROJECT: UNSULLIED CODE]
offline-first mobile IDE with client-side AST engine and 3D tactile motion.
status : live
url    : https://unsulliedcode.vercel.app/`,

  EXPERIENCE: `[EXPERIENCE TIMELINE]
- Networkers Home : AI Engineering Intern (ML network optimization)
  cert: https://drive.google.com/file/d/14CDnqWtqvgZdBRMsQfnHxQSejRQ_rW3H/view
- TCS iON : Applied Industry Project (Cloud Big Data Logistics)
  cert: https://drive.google.com/file/d/1PaUBkPkdkWM6r0UbMbtRwC3ANRpt4TKP/view
- AISECT Learn : Python for Data Science Intern
  cert: https://drive.google.com/file/d/1FlF3gsDiORiWDPdoq1mZKw5H9y0BIHad/view
- The Developers Arena : Data Science & Analytics Intern
  cert: https://drive.google.com/file/d/1tIRGmHjQig1_3QKwpW9yxTmygaZBNiWH/view
- IBM : Applied AI Programs & Industry Projects`,

  BADGES: `[VERIFIED CREDENTIALS]
23 verified Credly badges across IBM, Google & Coursera:
- IBM Artificial Intelligence & Machine Learning Graduate
- Google Advanced Data Analytics Professional Certificate
- Google Data Analytics Professional Certificate
- IBM Data Science Professional Certificate (V3)
- Machine Learning with Python (V2)
registry: https://credly.com/users/sayandhraj`,

  EDUCATION: `[ACADEMIC CREDENTIALS]
1. Master of Science (M.Sc.) in Computer Science (Artificial Intelligence)
   period      : 2026 – 2028 [Pursuing / Active Scholar]
   institution : Kerala University of Digital Sciences, Innovation and Technology
                 (Digital University of Kerala / DUK)
   former name : Indian Institute of Information Technology and Management - Kerala (IIITM-K)
   campus      : Trivandrum (Thiruvananthapuram), Kerala, India
   focus       : Deep Learning, Neural Architectures, Autonomous AI Systems

2. Bachelor of Computer Applications (BCA) in AI & Data Science
   period              : 2023 – 2026
   institution         : Yenepoya (Deemed to be University)
   campus              : Bengaluru Off-Campus, Karnataka
   main campus         : Mangalore, Karnataka, India
   industrial partners : IBM (Applied AI) & TCS iON (Big Data Logistics)
   cgpa                : 8.59 / 10.00
   focus               : Machine Learning, Statistical Modeling, Data Pipelines`,

  CONTACT: `[COMM CHANNELS]
phone    : +91 8590679716
email    : sayandhsr123@gmail.com
github   : https://github.com/sayandhsr
linkedin : https://linkedin.com/in/sayandh-raj
kaggle   : https://kaggle.com/sayandhsr
x/tw     : https://twitter.com/SayandhSr`,

  MATCHA: `[BUY A MATCHA]\nprotocol : direct UPI\nupi id   : sayandhsr123-2@okicici\npayee    : Sayandh Raj\nlink     : upi://pay?pa=sayandhsr123-2@okicici&pn=Sayandh%20Raj&cu=INR`
};

export const getSystemClockString = () => {
  const now = new Date();
  return `system clock: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`;
};

/**
 * Classifies raw user input in the UNIX terminal into:
 * - Special actions: 'CLEAR', 'AUDIO', 'MATCHA', 'EXIT', 'GAMEBOY'
 * - Offline directives: 'GREETING', 'HELP', 'WHOIS', 'SKILLS', 'PROJECTS', 'KILL_SWITCH', 'UNSULLIED', 'EXPERIENCE', 'BADGES', 'EDUCATION', 'CONTACT', 'DATE_TIME'
 * - Remote AI fallback: 'REMOTE_AI'
 *
 * Prevents greedy substring collision so general technical / conversational queries
 * (e.g. "tell me about quantum computing", "how does backpropagation work", "what is time complexity")
 * route to remote AI rather than returning Sayandh's resume credentials.
 */
export const classifyTerminalCommand = (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return { type: 'REMOTE_AI' };
  }

  const cleanCmd = rawInput.toLowerCase().replace(/^>\s*/, '').trim();

  // 1. CLEAR COMMAND
  if (cleanCmd === 'clear' || cleanCmd === 'cls') {
    return { type: 'CLEAR' };
  }

  // 2. AUDIO COMMAND
  if (['toggle_audio', 'audio', 'sound', 'mute', 'unmute'].includes(cleanCmd)) {
    return { type: 'AUDIO' };
  }

  // 3. MATCHA / TIP
  if (['tip', 'donate', 'matcha', 'coffee', 'buy matcha'].includes(cleanCmd) || rawInput.trim() === '> execute tip_matcha.sh') {
    return { type: 'MATCHA' };
  }

  // 4. GAME BOY EXIT
  if (cleanCmd === 'exit' || cleanCmd === 'quit') {
    return { type: 'EXIT' };
  }

  // 5. GAME BOY TRIGGER
  if (isGameBoyTrigger(cleanCmd)) {
    return { type: 'GAMEBOY' };
  }

  // Strip CLI verb prefixes (cat, show, get, view, open, run, echo) and trailing punctuation
  const normCmd = cleanCmd
    .replace(/^(cat|show|get|view|open|run|echo)\s+/, '')
    .replace(/[?.!]+$/, '')
    .trim();

  // 6. GREETINGS (Only standalone greetings, never queries containing 'hi' like 'machine')
  if (/^(hi+|hello|hey+|yo|sup|helo|howdy|good\s+morning|good\s+evening|good\s+afternoon|gm|gn)[!.]*$/i.test(cleanCmd)) {
    return { type: 'GREETING' };
  }

  // 7. HELP / DIRECTIVES
  if (
    ['help', 'commands', 'menu', 'options', 'guide', 'man', '?'].includes(normCmd) ||
    /^(what\s+can\s+you\s+do|how\s+to\s+use|list\s+commands|help\s+me)$/i.test(normCmd)
  ) {
    return { type: 'HELP' };
  }

  // 8. WHOIS / ABOUT SAYANDH
  if (
    ['whois', 'bio', 'profile', 'identity', 'whoami', 'id'].includes(normCmd) ||
    /^who\s+(is|are)\s+(sayandh(\s+raj)?|you)$/i.test(normCmd) ||
    /^(about|tell\s+me\s+about)\s+(sayandh(\s+raj)?|yourself)$/i.test(normCmd) ||
    /^who\s+are\s+you$/i.test(normCmd) ||
    /^sayandh(\s+raj)?$/i.test(normCmd)
  ) {
    return { type: 'WHOIS' };
  }

  // 9. SKILLS
  if (
    ['skills', 'skill', 'stack', 'techstack', 'tech-stack', 'arsenal', 'tech'].includes(normCmd) ||
    /^(what\s+are\s+your\s+skills|what\s+is\s+your\s+stack|sayandh('s)?\s+skills|technical\s+skills|tech\s+stack|your\s+skills|what\s+tools\s+do\s+you\s+use)$/i.test(normCmd)
  ) {
    return { type: 'SKILLS' };
  }

  // 10. PROJECTS
  if (
    ['projects', 'project', 'deployments', 'portfolio', 'apps'].includes(normCmd) ||
    /^(show\s+projects|what\s+did\s+you\s+build|sayandh('s)?\s+projects|your\s+projects|list\s+projects|recent\s+work)$/i.test(normCmd)
  ) {
    return { type: 'PROJECTS' };
  }

  // 11. KILL SWITCH PROJECT
  if (
    ['kill switch', 'killswitch', 'notkillwitch'].includes(normCmd) ||
    /^(tell\s+me\s+about\s+kill\s*switch|what\s+is\s+kill\s*switch)$/i.test(normCmd)
  ) {
    return { type: 'KILL_SWITCH' };
  }

  // 12. UNSULLIED CODE PROJECT
  if (
    ['unsullied', 'unsullied code', 'unsulliedcode'].includes(normCmd) ||
    /^(tell\s+me\s+about\s+unsullied(\s+code)?|what\s+is\s+unsullied(\s+code)?)$/i.test(normCmd)
  ) {
    return { type: 'UNSULLIED' };
  }

  // 13. EXPERIENCE
  if (
    ['experience', 'exp', 'career', 'internships', 'work history', 'work experience', 'jobs'].includes(normCmd) ||
    /^(where\s+did\s+you\s+work|show\s+experience|sayandh('s)?\s+experience|work\s+timeline|your\s+experience)$/i.test(normCmd)
  ) {
    return { type: 'EXPERIENCE' };
  }

  // 14. CERTIFICATIONS & BADGES
  if (
    ['badges', 'badge', 'cert', 'certs', 'certificates', 'certifications', 'credly', 'credentials'].includes(normCmd) ||
    /^(credly\s+badges|sayandh('s)?\s+badges|verified\s+credentials|show\s+badges|your\s+certifications|your\s+badges)$/i.test(normCmd)
  ) {
    return { type: 'BADGES' };
  }

  // 15. EDUCATION
  if (
    ['education', 'academics', 'academic', 'degrees', 'degree', 'college', 'university', 'bca', 'msc'].includes(normCmd) ||
    /^(where\s+did\s+you\s+study|what\s+is\s+your\s+degree|sayandh('s)?\s+education|academic\s+credentials|what\s+did\s+you\s+study)$/i.test(normCmd)
  ) {
    return { type: 'EDUCATION' };
  }

  // 16. CONTACT
  if (
    ['contact', 'email', 'phone', 'reach', 'socials', 'links'].includes(normCmd) ||
    /^(how\s+to\s+contact(\s+you)?|contact\s+info(rmation)?|sayandh('s)?\s+contact|your\s+contact|your\s+email|your\s+phone)$/i.test(normCmd)
  ) {
    return { type: 'CONTACT' };
  }

  // 17. DATE / TIME
  if (
    ['date', 'time', 'clock'].includes(normCmd) ||
    /^(what('?s|\s+is)\s+the\s+(time|date)|current\s+(time|date))$/i.test(normCmd)
  ) {
    return { type: 'DATE_TIME' };
  }

  // Default: Any other question or query goes to remote AI (spurce.ai)
  return { type: 'REMOTE_AI' };
};

/**
 * Builds multi-turn conversation payloads for Gemini and OpenRouter APIs.
 * Preserves context continuity so follow-up queries ("full name?", "why?", "tell me more")
 * have access to prior user and assistant exchanges.
 */
export const buildChatHistory = (messages, currentQuery, maxTurns = 12) => {
  const rawHistory = [];
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (!m || !m.text) continue;
      if (m.sender === 'user') {
        const text = m.text.trim();
        if (text) rawHistory.push({ role: 'user', text });
      } else if (m.sender === 'ai') {
        // Strip the [via spurce.ai] footer from historical messages
        const cleanText = m.text.replace(/\s*\[via\s+spurce\.ai\]\s*$/i, '').trim();
        if (cleanText) rawHistory.push({ role: 'assistant', text: cleanText });
      }
    }
  }

  // Take the most recent turns up to maxTurns
  const sliced = rawHistory.slice(-maxTurns);

  // Gemini contents requires strictly alternating 'user' and 'model' turns,
  // starting with 'user' and ending with 'user' (currentQuery)
  const geminiContents = [];
  let lastRole = null;

  for (const item of sliced) {
    const geminiRole = item.role === 'user' ? 'user' : 'model';
    if (geminiContents.length === 0 && geminiRole !== 'user') {
      // First turn in Gemini must be user
      continue;
    }
    if (geminiRole === lastRole) {
      // Merge consecutive identical roles to satisfy strict alternation requirement
      geminiContents[geminiContents.length - 1].parts[0].text += '\n' + item.text;
    } else {
      geminiContents.push({ role: geminiRole, parts: [{ text: item.text }] });
      lastRole = geminiRole;
    }
  }

  // Append current query
  if (lastRole === 'user' && geminiContents.length > 0) {
    geminiContents[geminiContents.length - 1].parts[0].text += '\n' + currentQuery.trim();
  } else {
    geminiContents.push({ role: 'user', parts: [{ text: currentQuery.trim() }] });
  }

  // OpenRouter messages: { role: 'user' | 'assistant', content }
  const openRouterHistory = sliced.map(item => ({
    role: item.role === 'user' ? 'user' : 'assistant',
    content: item.text
  }));
  openRouterHistory.push({ role: 'user', content: currentQuery.trim() });

  return { geminiContents, openRouterHistory };
};

