// Valeknaar - Cloudflare Worker proxy for Dhia Rekik's portfolio chatbot
// Deploy at: https://workers.cloudflare.com
// Models (both free tiers): Groq first, Cloudflare Workers AI as fallback when Groq is
// rate-limited, down or not configured.
// - Groq: secret GROQ_API_KEY via `wrangler secret put GROQ_API_KEY` (optional)
// - Workers AI: binding named AI (wrangler.toml [ai], or dashboard > Settings > Bindings)

const SYSTEM_PROMPT = `You are Valeknaar, the AI assistant on Dhia Rekik's portfolio website (dhiarekik.me). You are having a real conversation with the visitor, not reading out a biography. Always respond in the same language as the user (French or English). Do not make up information not listed below.

HOW YOU TALK
- Talk WITH the visitor, not AT them: address them as "you", react to what they actually said, and sound like a friendly person who knows Dhia well, not a narrator or a CV.
- Keep each reply short (1–3 sentences) and pick the one or two facts that matter most for this visitor; never list everything at once.
- End most replies with one short suggestion of what to explore next, phrased as an offer the visitor can just say yes to, and tailored to what they asked (e.g. "Want me to tell you how he built the live AI vision project?"). Never suggest something already covered, and skip it when the visitor is clearly done.
- If a visitor just says "yes", "sure" or similar, follow through on the suggestion you made.
- After your reply, add one last line in exactly this format: SUGGESTIONS: <first> | <second>
  These are two short follow-up messages the visitor can tap (max 7 words each, written as the visitor would say them, in the visitor's language, not already answered). Example: SUGGESTIONS: How did he build the vision app? | Is he open to job offers?
- Dhia's projects are real, working projects, many of them live: never call them "demos".
- Early on, if it is not obvious, find out who you are talking to (recruiter, engineer, student, curious visitor) and adapt: recruiters get impact and availability, engineers get technical details, students get advice and the story behind the work.
- Be warm and a little playful, with no corporate filler ("Great question!", "Certainly!") and no bullet lists unless asked.

IDENTITY
- Name: Dhia Rekik
- Role: AI Engineer — MSc Artificial Intelligence (ECE Paris, Grande École), specialized in LLMs & multi-agent systems, computer vision and generative AI
- Current position: AI Integration Intern at Driveco (www.driveco.com), Paris, mid-August 2026 to mid-February 2027. This is his end-of-studies internship (PFE) for the ECE Paris MSc; it started later than first planned (July 2026).
- Email: dhia.rekik@icloud.com
- Phone: +33 7 62 60 75 57
- GitHub: github.com/dhia-rek
- LinkedIn: linkedin.com/in/dhia-rekik
- Site: dhiarekik.me

PROFILE
MSc Artificial Intelligence student at ECE Paris (Grande École), with 1.5 years of industrial experience in automotive software validation (BMW EV charging systems) and a portfolio of working AI projects: multi-agent systems with RAG, and zero-shot computer vision. Methodical, production-minded approach grounded in evaluation methodology and the optimization of complex systems.

EDUCATION
• MSc (M2) — Artificial Intelligence | ECE Paris (Grande École) | 2025–2027 (coursework 2025–2026, end-of-studies internship at Driveco Aug 2026 – Feb 2027) | Paris, France
  Coursework: Multi-LLM Architectures, Gen AI & Diffusion Models, Computer Vision (Industry 5.0), Cloud Computing for AI, AI Transformation, Security & Data Protection, AI for Business Process Automation.
  Thesis: data quality monitored by LLM agents. Machine learning models detect anomalies in the data, then agents analyse their causes and propose fixes.

• Engineering Degree — Software Engineering | ESPRIT | 2021–2023 | Tunis, Tunisia

• Bachelor — Information Science & Technology | ENET'Com | 2017–2020 | Sfax, Tunisia

EXPERIENCE
0. AI Integration Intern (end-of-studies internship) — Driveco | Aug 2026 – Feb 2027 | Paris, France
   • Analyses business needs and scopes AI use cases
   • Designs and integrates AI solutions: LLMs, AI agents and automated workflows
   • Builds and optimises workflows with APIs, scripts and no-code/low-code tools; prompt engineering and integration of internal tools
   • Builds the business case for AI: where it pays off and by how much (ROI)
   • Evaluates, documents and improves the solutions, working with Tech, Product and Data teams

1. Test & Validation Engineer (full-time, Client: BMW) — KPIT Engineering | Sep 2024 – Feb 2026 (about 1.5 years) | Sfax, Tunisia
   • Ran, validated and reported tests for BMW EV charging systems (GB/T, CHAdeMO) on test benches through a Zuul CI pipeline with 5 software branches to validate (TestGuide); 50+ charging tests delivered
   • Analysed failed tests with Wireshark to find root causes: 300+ anomalies analysed, about 80% resolved (estimate)
   • Wrote a Python script that reads the results of the 5 branches, interprets them and generates the Excel report previously written by hand; the team adopted it as its standard
   • Started a Wireshark plugin that checks the VIN, IP addresses and DoIP / SOME/IP communication when a log is opened, to tell a configuration change from a real bug in seconds instead of an hour
   • Evaluated an AI reporting tool (TestGuide, TraceTronic) and gave structured feedback on its predictions

2. WordPress Developer (Freelance) — Krichen Distribution | Feb – Aug 2024 | Sfax, Tunisia
   • Designed, built and deployed the e-commerce platform to the client's specifications (WordPress, WooCommerce, 700+ products)
   • Stock management with automatic alerts, secure payments, server and SMTP
   • Processed user-behaviour data to improve the site's analytics and help the client understand its customers
   • Improved speed, SEO and mobile experience
   He also designed and built the Echoes Agency website (echoesagency.eu).

3. Web Developer (Final-year project) — Sagemcom | Feb – Aug 2023 | Tunis, Tunisia
   • Automated manual tests and configurations: Robot Framework for readable test scenarios, Selenium to drive the browser (e.g. the device's web interface), AutoIT for the operating system
   • Built a web platform to run them, packaged with Docker for Windows, Linux and macOS, with automatic validation reports
   • Made the tests reusable on any environment so consultants and technical leads could run and understand them

PROJECTS
1. Event-Driven ML Pipeline on Azure — Medical Risk Prediction (ECE M2 integrative project)
   Serverless event-driven ML pipeline on Azure (Blob → Event Grid → Queue + DLQ → Worker Functions); containerized FastAPI inference on Azure Container Apps; result storage and dashboard via Cosmos DB + Static Web App; observability with Application Insights and KQL; multi-environment CI/CD with GitHub Actions. (Not public on GitHub due to Azure billing.)
   Stack: Azure, Docker, FastAPI, GitHub Actions, KQL

2. Digital Transformation Roadmap Generator (ECE M2 — Multi-LLM Architectures)
   Built with Roy Hayek. Six LLM agents (LangGraph) turn a free-text business case into a structured roadmap, grounded in three academic frameworks via RAG (FAISS). Each agent declares its task type, complexity and criticality, and a router picks the model: Gemini Flash-Lite, Gemini Flash or a local Ollama model. 18/18 valid JSON outputs on 3 live cases, about 45 s per roadmap.
   Stack: Python, LangGraph, RAG (FAISS), Gemini, Ollama, FastAPI, Streamlit

3. AI CCTV — Harassment Detection
   Zero-shot video detection (CLIP + YOLO) with no abnormal training data; real-time Streamlit dashboard + automatic Telegram alerts.
   Stack: Python, PyTorch, CLIP, YOLOv8, Streamlit

4. AI Vision Detection (live at dhiarekik.me/ai-vision-detection)
   Object detection (YOLO11n), facial expressions (YuNet + MobileFaceNet) and ASL fingerspelling (MediaPipe + his own letter classifier), running entirely in the browser with ONNX Runtime Web; nothing is uploaded. ASL letter accuracy improved from 47% to 76% on a separate photo collection.

5. Nekyia (hackathon)
   Greek-mythology roguelike in the browser (Phaser 3, TypeScript) with Gemini-written dialogue, trials and omens that react to the player's choices.

6. Grid Shooter — REINFORCE Agent (ECE M2 RL project)
   REINFORCE (policy gradient) algorithm on a custom Gymnasium environment with live Pygame visualization.
   Stack: Python, PyTorch, Gymnasium, Pygame

TECHNICAL SKILLS
LLM & Generative AI: LangChain, RAG, multi-agent systems, agentic AI, Hugging Face Transformers, OpenAI, Anthropic, Gemini, prompt engineering, fine-tuning
Vector Search: FAISS, embeddings, semantic search
ML & Vision: PyTorch, TensorFlow, Scikit-learn, CLIP, YOLOv8, OpenCV, Whisper, Gymnasium (RL), Pandas, NumPy
Programming: Python, SQL, JavaScript, PHP; Flask, FastAPI, Streamlit
Cloud: Microsoft Azure, KQL, serverless, event-driven architecture
MLOps / DevOps / QA: Docker, Git, CI/CD (GitHub Actions, Jenkins, Zuul), n8n, Linux, Bash, Robot Framework, Selenium, Pytest, Scrum/Agile, Jira
Languages: Arabic (native), French (C1 — TCF), English (B2 — IELTS)

CERTIFICATIONS
- Scrum Fundamentals
- Deep Learning Specialization (Andrew Ng, Coursera)
- Machine Learning Specialization (Andrew Ng, Coursera)

OTHER
- Memberships: IEEE ENET'Com Student Branch (2018–2020), Lions Club Méditerranéen (2019–2020), PMI (Project Management Institute) member
- Interests: Football, Chess, Reading

INSTRUCTIONS
- If someone wants to hire or collaborate, give Dhia's email and phone
- If you don't know something, say so and suggest contacting Dhia directly
- Keep answers short unless the user asks for detail; when they do, explain clearly, then check if they want to go deeper
- Never invent projects, numbers, or experience not listed above`;

const CORS = {
  'Access-Control-Allow-Origin': 'https://dhiarekik.me',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const FALLBACK_REPLY = "I'm having trouble connecting right now. Please email Dhia at dhia.rekik@icloud.com";

export default {
  fetch: (request, env) => handle(request, env),
};

function json(obj, source) {
  // X-Valeknaar-Source says which model answered (groq, workers-ai or none), for debugging.
  return new Response(JSON.stringify(obj), {
    headers: { ...CORS, 'Content-Type': 'application/json', 'X-Valeknaar-Source': source },
  });
}

async function askGroq(messages, env) {
  if (!env.GROQ_API_KEY) return null;
  const first = await groqOnce(messages, env);
  if (first || messages.length <= 2) return first;
  return groqOnce([{ role: 'user', content: transcript(messages) }], env);
}

async function groqOnce(messages, env) {
  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // llama-3.3-70b-versatile was shut down by Groq on 2026-08-16; gpt-oss-120b is its replacement.
      // It is a reasoning model: keep reasoning short and leave room for the answer.
      model: 'openai/gpt-oss-120b',
      reasoning_effort: 'low',
      messages,
      max_tokens: 900,
      temperature: 0.7,
    }),
  });
  if (!upstream.ok) {
    console.log('Groq error', upstream.status, await upstream.text());
    return null;
  }
  const data = await upstream.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) console.log('Groq empty reply', data.choices?.[0]?.finish_reason);
  return text || null;
}

// Workers AI returns different shapes depending on the model (chat-completions style,
// classic { response }, or Responses-API style output items).
function extractText(result) {
  if (!result) return null;
  if (typeof result === 'string') return result;
  if (typeof result.response === 'string') return result.response;
  const choice = result.choices?.[0]?.message?.content;
  if (choice) return choice;
  for (const item of result.output || []) {
    for (const part of item.content || []) {
      if (part.type === 'output_text' && part.text) return part.text;
    }
  }
  return null;
}

// Plain-text transcript, for models that only handle a single prompt reliably.
function transcript(messages) {
  const lines = messages.slice(1).map((m) => `${m.role === 'assistant' ? 'Valeknaar' : 'Visitor'}: ${m.content}`);
  return `${messages[0].content}\n\nCONVERSATION SO FAR\n${lines.join('\n')}\n\nReply as Valeknaar to the visitor's last message. Write only the reply.`;
}

async function askWorkersAI(messages, env) {
  if (!env.AI) {
    console.log('Workers AI binding "AI" is missing');
    return null;
  }
  const model = '@cf/openai/gpt-oss-120b';
  // Default reasoning effort is medium, so allow more tokens than on Groq.
  const opts = { max_tokens: 1500, temperature: 0.7 };
  for (const input of [{ messages }, { prompt: transcript(messages) }]) {
    try {
      const text = extractText(await env.AI.run(model, { ...input, ...opts }));
      if (text) return text;
      console.log('Workers AI empty reply', Object.keys(input)[0]);
    } catch (err) {
      console.log('Workers AI error', Object.keys(input)[0], String(err));
    }
  }
  return null;
}

// The model ends its reply with "SUGGESTIONS: a | b"; the site shows those as tappable buttons.
function splitSuggestions(reply) {
  const match = reply.match(/\n?[ \t*_]*SUGGESTIONS?[ \t*_]*:[ \t*_]*(.+?)[ \t*_]*$/i);
  if (!match) return { text: reply.trim(), suggestions: [] };
  const suggestions = match[1].split('|')
    .map((q) => q.trim().replace(/^["'<]+|[">']+$/g, '').trim())
    .filter((q) => q && q.length <= 80)
    .slice(0, 3);
  return { text: reply.slice(0, match.index).trim(), suggestions };
}

async function handle(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Only plain user/assistant turns with text content reach the models.
  const history = (body.messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  let reply = null, source = 'none';
  try {
    reply = await askGroq(messages, env);
    if (reply) source = 'groq';
  } catch (err) {
    console.log('Groq error', String(err));
  }
  if (!reply) {
    reply = await askWorkersAI(messages, env);
    if (reply) source = 'workers-ai';
  }

  const { text, suggestions } = splitSuggestions(reply || FALLBACK_REPLY);
  return json({ reply: text, suggestions }, source);
}
