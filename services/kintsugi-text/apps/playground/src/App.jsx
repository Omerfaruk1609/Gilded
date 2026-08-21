import React, { useState, useEffect } from 'react';

const SAMPLE_PRESETS = [
  {
    label: '🟢 Temiz Yorum',
    text: 'KintsugiText Türkçe içerik moderasyon altyapısı çok başarılı olmuş.'
  },
  {
    label: '🔴 Leetspeak Küfür Hilesi',
    text: 'Sen ne s4l4k ve gerizekalı bir insansın amk!'
  },
  {
    label: '🚨 Yasadışı Bahis Spam',
    text: 'Anında 1000 TL bonus kazanmak için t.me/bahissitesi adresine tıkla!'
  },
  {
    label: '⚠️ Örtük Tehdit (AI)',
    text: 'Senin nerede oturduğunu biliyorum, akşam evinin önüne geleceğim.'
  },
  {
    label: '🔒 Telefon / TCKN (PII)',
    text: 'TCKN: 12345678901, Telefon: 05321234567 bizi hemen arayın.'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('tester'); // 'tester' | 'rules' | 'queue'
  const [inputText, setInputText] = useState(SAMPLE_PRESETS[1].text);
  const [forceAi, setForceAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Health, Rules, and Queue State
  const [healthInfo, setHealthInfo] = useState(null);
  const [rules, setRules] = useState([]);
  const [queue, setQueue] = useState([]);
  const [ruleLoading, setRuleLoading] = useState(false);

  // New Rule Form State
  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('PROFANITY');
  const [newScore, setNewScore] = useState(0.85);
  const [newReason, setNewReason] = useState('');
  const [ruleMsg, setRuleMsg] = useState(null);

  // Import / Export State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStrategy, setImportStrategy] = useState('merge');
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'X-API-Key': 'kt_live_dev_key'
  };

  const fetchHealthAndRules = async () => {
    try {
      const hRes = await fetch('/api/v1/health');
      if (hRes.ok) setHealthInfo(await hRes.json());

      const rRes = await fetch('/api/v1/rules', { headers: { 'X-API-Key': 'kt_live_dev_key' } });
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.success) setRules(rData.data || []);
      }

      const qRes = await fetch('/api/v1/moderation/queue', { headers: { 'X-API-Key': 'kt_live_dev_key' } });
      if (qRes.ok) {
        const qData = await qRes.json();
        if (qData.success) setQueue(qData.data || []);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchHealthAndRules();
  }, []);

  const handleAnalyze = async (textToAnalyze = inputText) => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/moderate', {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          text: textToAnalyze,
          entity_type: 'comment',
          tenant_id: 'gilded_playground',
          force_ai: forceAi
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error?.message || 'Analiz hatası');

      setResult(json.data);
      fetchHealthAndRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newPattern || !newReason) return;
    setRuleLoading(true);
    setRuleMsg(null);

    try {
      const res = await fetch('/api/v1/rules', {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ pattern: newPattern, category: newCategory, score: Number(newScore), reason: newReason })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Kural ekleme başarısız');

      setRuleMsg({ type: 'success', text: '✅ Kural başarıyla veritabanına eklendi!' });
      setNewPattern('');
      setNewReason('');
      fetchHealthAndRules();
    } catch (err) {
      setRuleMsg({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setRuleLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Bu kuralı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/v1/rules/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': 'kt_live_dev_key' }
      });
      if (res.ok) fetchHealthAndRules();
    } catch (e) {
      console.error('Kural silme hatası:', e);
    }
  };

  const handleExportRules = async () => {
    try {
      const res = await fetch('/api/v1/rules/export?download=true', {
        headers: { 'X-API-Key': 'kt_live_dev_key' }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kintsugi-rules-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Export failed:', e);
      alert('Kural dışa aktarma başarısız oldu.');
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportMsg(null);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(importText);
      } catch (err) {
        throw new Error('Geçersiz JSON formatı. Lütfen JSON verisini kontrol edin.');
      }

      const res = await fetch(`/api/v1/rules/import?strategy=${importStrategy}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(parsedPayload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const detailStr = json.error?.details ? json.error.details.join('\n') : json.error?.message;
        throw new Error(detailStr || 'İçe aktarma hatası oluştu.');
      }

      setImportMsg({
        type: 'success',
        text: `✅ ${json.message || 'Kurallar başarıyla aktarıldı.'}`,
        summary: json.data?.summary
      });
      fetchHealthAndRules();
      setTimeout(() => {
        setShowImportModal(false);
        setImportText('');
        setImportMsg(null);
      }, 2000);
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleModeratorOverride = async (logId, verdict) => {
    try {
      const res = await fetch('/api/v1/moderation/override', {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          log_id: logId,
          moderator_verdict: verdict,
          reason: 'Arayüz Moderatör İncelemesi',
          moderator_id: 'mod_admin_ui'
        })
      });

      if (res.ok) fetchHealthAndRules();
    } catch (e) {
      console.error('Moderator override error:', e);
    }
  };

  // Vurgulamalı Metin Önizleyici (Highlighted Text Component)
  const renderHighlightedText = () => {
    if (!result) return null;
    let text = result.sanitized_text || inputText;

    const matches = result.breakdown?.tier1?.matches || [];
    if (matches.length === 0 && result.violations.length === 0) {
      return <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm font-medium">{text}</div>;
    }

    const patterns = matches.map(m => m.pattern).filter(Boolean);
    if (patterns.length === 0) {
      return <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm font-medium">{text}</div>;
    }

    try {
      const combinedRegex = new RegExp(`(${patterns.join('|')})`, 'gi');
      const parts = text.split(combinedRegex);

      return (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm leading-relaxed font-mono">
          {parts.map((part, index) => {
            const isMatch = patterns.some(p => {
              try { return new RegExp(`^${p}$`, 'i').test(part); } catch { return false; }
            });

            if (isMatch) {
              return (
                <mark key={index} className="bg-rose-500/30 text-rose-200 border border-rose-500/50 px-1.5 py-0.5 rounded font-bold underline">
                  {part}
                </mark>
              );
            }
            return <span key={index} className="text-slate-300">{part}</span>;
          })}
        </div>
      );
    } catch {
      return <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm">{text}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header & Navigation */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏮</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                KintsugiText Enterprise
              </h1>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                Production Hardened
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Gilded Platformu İçin İki Kademeli (Rule Engine + Python AI) Türkçe İçerik Güvenlik Servisi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider">In-Memory Rules</span>
              <span className="text-sm font-bold text-indigo-400">{rules.length} Kural</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider">İnceleme Kuyruğu</span>
              <span className="text-sm font-bold text-amber-400">{queue.length} İçerik</span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-4">
          <button
            onClick={() => setActiveTab('tester')}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'tester' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔍 Moderasyon Tester & PII Maskeleme
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'rules' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ Dinamik Kural Paneli ({rules.length})
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'queue' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ HITL Moderatör Kuyruğu ({queue.length})
          </button>
        </div>

        {/* TAB 1: MODERATION TESTER */}
        {activeTab === 'tester' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hızlı Test Senaryoları</label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInputText(preset.text); handleAnalyze(preset.text); }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 rounded-lg transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-200">Türkçe İçerik Metni</label>
                    <span className="text-xs text-slate-500">{inputText.length} / 10000</span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={6}
                    placeholder="Analiz edilecek Türkçe metni buraya yazın..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={forceAi}
                        onChange={(e) => setForceAi(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                      />
                      <span>Python ML Semantik Analizini Zorla</span>
                    </label>

                    <button
                      onClick={() => handleAnalyze()}
                      disabled={loading || !inputText.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
                    >
                      {loading ? 'Analiz Ediliyor...' : 'Metni Analiz Et 🚀'}
                    </button>
                  </div>
                </div>

                {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">❌ {error}</div>}
              </div>

              <div className="lg:col-span-7">
                {result ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                      <div>
                        <span className="text-xs text-slate-400 block">Moderasyon Kararı</span>
                        <div className="mt-1">
                          {result.verdict === 'APPROVED' && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold text-xs">🟢 ONAYLANDI (APPROVED)</span>}
                          {result.verdict === 'REJECTED' && <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-semibold text-xs">🔴 REDDEDİLDİ (REJECTED)</span>}
                          {result.verdict === 'FLAGGED_FOR_REVIEW' && <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-semibold text-xs">🟡 İNCELEME GEREKİYOR (FLAGGED)</span>}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-xs text-slate-400 block">Toplam Risk Skoru</span>
                        <span className={`text-2xl font-black ${result.risk_score >= 80 ? 'text-rose-400' : result.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {result.risk_score} / 100
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vurgulanmış Çıktı & PII Maskeleme</span>
                      {renderHighlightedText()}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block">Değerlendiren Motor</span>
                        <span className="font-semibold text-indigo-300">{result.evaluated_by}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AI Sağlayıcı</span>
                        <span className="font-mono text-emerald-400">{result.breakdown.tier2?.scores ? 'Python Scikit-Learn ML' : 'Local Rule Engine'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <span className="text-4xl mb-3">🔍</span>
                    <p className="text-sm font-medium">Analiz sonuçları burada görüntülenecektir.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC RULES PANEL */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <form onSubmit={handleAddRule} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h2 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">➕ Yeni Moderasyon Kuralı Ekle</h2>
                {ruleMsg && <div className={`p-3 rounded-xl text-xs font-medium ${ruleMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{ruleMsg.text}</div>}
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Regex veya Kelime Kalıbı (Pattern)</label>
                  <input type="text" required placeholder="(küfür|hakaret)" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Kategori</label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100">
                      <option value="PROFANITY">PROFANITY</option>
                      <option value="SPAM">SPAM</option>
                      <option value="SUSPICIOUS_LINK">SUSPICIOUS_LINK</option>
                      <option value="PII_LEAK">PII_LEAK</option>
                      <option value="HATE_SPEECH">HATE_SPEECH</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Risk Skoru ({newScore})</label>
                    <input type="range" min="0.1" max="1.0" step="0.05" value={newScore} onChange={(e) => setNewScore(e.target.value)} className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Açıklama</label>
                  <input type="text" required placeholder="Argo tespiti" value={newReason} onChange={(e) => setNewReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600" />
                </div>

                <button type="submit" disabled={ruleLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition">
                  {ruleLoading ? 'Eklenecek...' : 'Kuralı Kaydet'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-200">📜 Aktif Moderasyon Kuralları ({rules.length})</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportRules}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    📤 Kural Dışa Aktar (JSON)
                  </button>
                  <button
                    onClick={() => { setShowImportModal(true); setImportMsg(null); }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    📥 Kural İçe Aktar (JSON)
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">{rule.category}</span>
                      <span className="ml-2 text-xs font-mono font-bold text-amber-300">{rule.pattern}</span>
                      <p className="text-xs text-slate-400 mt-1">{rule.reason}</p>
                    </div>
                    <button onClick={() => handleDeleteRule(rule.id)} className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg text-xs">Sil</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HITL MODERATOR QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-200">🛡️ Human-in-the-Loop Moderatör İnceleme Kuyruğu</h2>
                <p className="text-xs text-slate-400">Şüpheli (FLAGGED_FOR_REVIEW) veya AI tarafından kararsız kalınan içerikler insan moderatör kararına açılır.</p>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                {queue.length} Bekleyen İçerik
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="p-12 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-sm">
                ✨ Şüpheli veya inceleme bekleyen içerik bulunmuyor!
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-indigo-400">{item.correlation_id}</span>
                      <span>Risk Skoru: <strong className="text-amber-400">{item.risk_score}%</strong></span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-slate-200">
                      "{item.sanitized_text || item.text}"
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        onClick={() => handleModeratorOverride(item.id, 'APPROVED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition"
                      >
                        🟢 İncele & Onayla (APPROVED)
                      </button>
                      <button
                        onClick={() => handleModeratorOverride(item.id, 'REJECTED')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition"
                      >
                        🔴 İncele & Engelle (REJECTED)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">📥 Toplu Kural İçe Aktar (JSON Schema)</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
            </div>

            {importMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-medium space-y-1 ${importMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                <p>{importMsg.text}</p>
                {importMsg.summary && (
                  <div className="text-[11px] font-mono text-emerald-400 pt-1">
                    Aktarılan: {importMsg.summary.importedCount} | Atlanan: {importMsg.summary.skippedCount} | Başarısız: {importMsg.summary.failedCount}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Çakışma / İçe Aktarma Stratejisi</label>
                <select
                  value={importStrategy}
                  onChange={(e) => setImportStrategy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="merge">Merge (Mevcut kuralları koru, çakışmayanları ekle/güncelle)</option>
                  <option value="overwrite">Overwrite (Mevcut kuralları temizle ve yenilerini yaz)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">JSON Dosyası Yükle</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Veya JSON İçeriğini Yapıştır</label>
                <textarea
                  rows={6}
                  placeholder='{"strategy": "merge", "rules": [{"pattern": "(test)", "category": "profanity", "action": "block"}]}'
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {importLoading ? 'Doğrulanıyor...' : 'İçe Aktar ve Şemayı Doğrula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
