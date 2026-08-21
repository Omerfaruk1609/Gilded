import { env } from '../../config/env.js';
import { LocalKintsugiModel } from './local-model.js';

export class AIEngineService {
  /**
   * Tier 2 Semantik AI Analizi
   * 1. Öncelik: Python AI Mikroservisi (http://localhost:8000/predict)
   * 2. Öncelik: Google Gemini API (Eğer Key Varsa)
   * 3. Öncelik: Dahili JS ML Modeli
   */
  async analyze(text) {
    const startTime = Date.now();

    // 1. Python AI Servisine Bağlanmayı Dene (FastAPI + Scikit-Learn ML Modeli)
    try {
      const pythonResult = await this.callPythonAIService(text);
      if (pythonResult) {
        return {
          ai_used: true,
          duration_ms: Date.now() - startTime,
          provider: pythonResult.provider,
          scores: pythonResult.scores,
          violations: pythonResult.violations
        };
      }
    } catch (err) {
      // Python servisi kapalıysa sessizce sonraki adıma geçer
    }

    // 2. Google Gemini API (Eğer Key Varsa)
    if (env.GEMINI_API_KEY) {
      try {
        const geminiResult = await this.callGoogleGemini(text, env.GEMINI_API_KEY);
        return {
          ai_used: true,
          duration_ms: Date.now() - startTime,
          provider: 'Google Gemini 1.5 Flash (Free Tier)',
          scores: geminiResult.scores,
          violations: geminiResult.violations
        };
      } catch (err) {
        console.error('⚠️ Google Gemini API Error:', err);
      }
    }

    // 3. Dahili Çevrimdışı JS Modeli
    return LocalKintsugiModel.analyze(text);
  }

  /**
   * Python FastAPI ML Servisine İletişim (http://localhost:8000/predict)
   */
  async callPythonAIService(text) {
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, entity_type: 'comment' })
    });

    if (!response.ok) return null;
    return await response.json();
  }

  /**
   * Google Gemini API Çağrısı
   */
  async callGoogleGemini(text, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Sen Türkçe içerik güvenliği ve moderasyon uzmanısın.
Aşağıdaki Türkçe metni analiz et ve kesinlikle geçerli bir JSON yanıtı döndür.

Metin: "${text}"

Yanıt Formatı (JSON):
{
  "toxicity": 0.0 ile 1.0 arası skor,
  "hate_speech": 0.0 ile 1.0 arası skor,
  "spam": 0.0 ile 1.0 arası skor,
  "implicit_threat": 0.0 ile 1.0 arası skor,
  "reason": "Eğer risk > 0.5 ise Türkçe kısa açıklama, yoksa boş string"
}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) throw new Error(`Gemini API HTTP Error: ${response.status}`);

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('Gemini API returned empty output');

    const parsed = JSON.parse(candidateText);
    const scores = {
      toxicity: Number(parsed.toxicity) || 0,
      hate_speech: Number(parsed.hate_speech) || 0,
      spam: Number(parsed.spam) || 0,
      implicit_threat: Number(parsed.implicit_threat) || 0
    };

    const violations = [];
    if (scores.implicit_threat >= 0.5) violations.push({ category: 'IMPLICIT_THREAT', score: scores.implicit_threat, reason: parsed.reason || 'Gemini AI: Tehdit tespiti' });
    if (scores.hate_speech >= 0.5) violations.push({ category: 'HATE_SPEECH', score: scores.hate_speech, reason: parsed.reason || 'Gemini AI: Nefret söylemi' });
    if (scores.toxicity >= 0.6) violations.push({ category: 'TOXICITY', score: scores.toxicity, reason: parsed.reason || 'Gemini AI: Toksisite tespiti' });

    return { scores, violations };
  }
}
