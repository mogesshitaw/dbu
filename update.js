const fs = require('fs');

const file = 'backend/src/controllers/scheduleController.js';
let s = fs.readFileSync(file, 'utf8');
const isCrlf = s.includes('\r\n');
if (isCrlf) {
  s = s.replace(/\r\n/g, '\n');
}

const oldPrompt = `Provide a structured analysis with:
1. **Schedule Quality Score** (1–10) with brief justification.
2. **Issues Detected** — list concrete problems (instructor overload, back-to-back labs, room underutilisation, long gaps, etc.).
3. **Optimisation Suggestions** — specific, actionable improvements.
4. **Ethiopian Context** — respect prayer times (06:00–07:30) and DBU working hours (08:00–17:00). Note any violations.

Be concise and practical. Use bullet points.`;

const newPrompt = `Provide a comprehensive, detailed, and structured analysis for the Department Head:
1. **Schedule Quality Score (1–10)**:
   - Provide a numerical score from 1 to 10.
   - Give an in-depth justification detailing strengths, structural bottlenecks, and feasibility.
2. **Issues Detected & Risk Analysis**:
   - Instructor Fatigue & Overload: Highlight instructors with >3 sessions/day or heavy back-to-back lectures.
   - Student Learning Experience: Identify long gaps/dead hours between classes or exhausting consecutive lab blocks.
   - Facility & Room Allocation: Verify if practical lab sessions are correctly placed in computer/hardware labs vs general lecture halls, and check room capacity matching.
3. **Actionable Optimisation Suggestions**:
   - Provide clear, specific improvements naming exact courses, recommended days, and rooms to relocate.
4. **Ethiopian Higher Education Context (DBU Guidelines)**:
   - Check strict compliance with DBU working hours (08:00 – 17:00).
   - Ensure the university lunch break (12:00 – 13:30) and morning prayer window (06:00 – 07:30) are free of classes.

Provide full, thorough explanations with detailed bullet points so the Department Head has clear, actionable guidance.`;

s = s.replace(oldPrompt, newPrompt);

const oldCall = `const callGemini = async (apiKey, prompt, maxTokens = 1500) => {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
  for (const model of models) {
    try {
      const res = await fetch(
        \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: maxTokens }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, model };
      } else {
        const err = await res.text();
        console.warn(\`Gemini model \${model} error:\`, err);
      }
    } catch (e) {
      console.warn(\`Failed calling \${model}:\`, e.message);
    }
  }
  return null;
};`;

const newCall = `const callGemini = async (apiKey, prompt, maxTokens = 4096) => {
  const models = ["gemini-2.5-flash", "gemini-2.5-pro"];
  for (const model of models) {
    try {
      const res = await fetch(
        \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: maxTokens,
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, model };
      } else {
        const err = await res.text();
        console.warn(\`Gemini model \${model} error:\`, err);
      }
    } catch (e) {
      console.warn(\`Failed calling \${model}:\`, e.message);
    }
  }
  return null;
};`;

s = s.replace(oldCall, newCall);

if (isCrlf) {
  s = s.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done!');

