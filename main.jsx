import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Send, Plus, Settings, Download, Trash2, Sparkles, MessageCircle, ShieldCheck, UserRound, ChevronDown } from 'lucide-react'
import './styles.css'

const starter = [
  { id: 'mika', name: 'มิกะ', role: 'เพื่อนสมัยเด็ก', mood: 'ร่าเริง ขี้เล่น', color: '#f2a6c8', avatar: '🌸', desc: 'สาวสดใสที่ชอบแหย่คุณและคอยเป็นกำลังใจ' },
  { id: 'rei', name: 'เรย์', role: 'นักเรียนปริศนา', mood: 'สุขุม พูดน้อย', color: '#9ba9ff', avatar: '🌙', desc: 'คนเงียบ ๆ ที่มีเรื่องราวซ่อนอยู่' },
  { id: 'luna', name: 'ลูน่า', role: 'นักเวทฝึกหัด', mood: 'ขี้สงสัย อ่อนโยน', color: '#c5a2ff', avatar: '🔮', desc: 'นักเวทมือใหม่จากโลกแฟนตาซี' }
]

function App() {
  const [characters, setCharacters] = useState(starter)
  const [active, setActive] = useState(starter[0])
  const [mode, setMode] = useState('roleplay')
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'สวัสดีค่ะ! วันนี้อยากเริ่มเรื่องราวแบบไหนดี?' }])
  const [draft, setDraft] = useState('')
  const [apiUrl, setApiUrl] = useState('https://api.openai.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [systemPrompt, setSystemPrompt] = useState('คุณกำลังสวมบทบาทเป็นตัวละครในเรื่องสมมติ ตอบเป็นธรรมชาติ รักษาบุคลิกและความต่อเนื่องของฉาก')
  const [showSettings, setShowSettings] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const exportChat = () => {
    const blob = new Blob([JSON.stringify({ character: active.name, mode, messages }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `prism-${active.id}-chat.json`; a.click(); URL.revokeObjectURL(url)
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const content = draft.trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next); setDraft(''); setBusy(true)
    try {
      const base = apiUrl.trim().replace(/\/+$/, '')
      const response = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: `${systemPrompt}\nตัวละคร: ${active.name}\nบทบาท: ${active.role}\nบุคลิก: ${active.mood}\nรายละเอียด: ${active.desc}\nโหมด: ${mode === 'roleplay' ? 'Roleplay' : 'Chat'}` }, ...next],
          temperature: 0.85
        })
      })
      if (!response.ok) throw new Error(`API ตอบกลับ ${response.status}: ${await response.text()}`)
      const data = await response.json()
      setMessages([...next, { role: 'assistant', content: data.choices?.[0]?.message?.content || 'ไม่ได้รับข้อความตอบกลับจากโมเดล' }])
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `เชื่อมต่อไม่สำเร็จ: ${err.message}\n\nตรวจสอบ API URL, API Key, ชื่อโมเดล และการอนุญาต CORS ของผู้ให้บริการ` }])
    } finally { setBusy(false) }
  }

  function chooseCharacter(c) {
    setActive(c); setMessages([{ role: 'assistant', content: `เริ่มต้นบทสนทนากับ ${c.name} ได้เลยค่ะ` }])
  }
  function createCharacter(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const c = { id: crypto.randomUUID(), name: newName.trim(), role: newRole || 'ตัวละครของคุณ', mood: 'กำหนดเอง', color: '#b59cff', avatar: '✨', desc: newDesc }
    setCharacters([...characters, c]); chooseCharacter(c); setShowCreate(false); setNewName(''); setNewRole(''); setNewDesc('')
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={20}/></div><div><b>PRISM</b><small>ROLEPLAY STUDIO</small></div></div>
      <button className="new-chat" onClick={() => { setMessages([{ role: 'assistant', content: `เริ่มต้นบทสนทนากับ ${active.name} ได้เลยค่ะ` }]); setMode('roleplay') }}><Plus size={17}/> เริ่มบทสนทนาใหม่</button>
      <div className="side-label">ตัวละครของคุณ <button onClick={() => setShowCreate(true)} aria-label="สร้างตัวละคร"><Plus size={15}/></button></div>
      <div className="character-list">{characters.map(c => <button key={c.id} className={`character ${active.id === c.id ? 'selected' : ''}`} onClick={() => chooseCharacter(c)}><span className="avatar" style={{background: `${c.color}22`}}>{c.avatar}</span><span className="character-copy"><b>{c.name}</b><small>{c.role}</small></span><span className="online-dot"/></button>)}</div>
      <div className="sidebar-bottom"><div className="private-note"><ShieldCheck size={16}/><span>พื้นที่ส่วนตัว<br/><small>การป้องกันการเข้าถึงตั้งค่าที่ Cloudflare</small></span></div><button className="settings-link" onClick={() => setShowSettings(true)}><Settings size={17}/> ตั้งค่า AI</button></div>
    </aside>

    <main className="main-panel">
      <header className="topbar"><div className="mobile-brand">✦ PRISM</div><div className="crumb">Workspace <span>/</span> {active.name}</div><div className="top-actions"><span className="private-pill"><ShieldCheck size={14}/> PRIVATE</span><button className="icon-btn" title="ส่งออกแชต" onClick={exportChat}><Download size={18}/></button><button className="icon-btn" title="ตั้งค่า" onClick={() => setShowSettings(true)}><Settings size={18}/></button></div></header>
      <section className="chat-area">
        <div className="character-heading"><div className="big-avatar" style={{background: `${active.color}25`}}>{active.avatar}</div><div><h1>{active.name}</h1><p>{active.role} <span>·</span> {active.mood}</p></div><button className="mode-select" onClick={() => setMode(mode === 'roleplay' ? 'chat' : 'roleplay')}>{mode === 'roleplay' ? '🎭 Roleplay' : '💬 Chat'} <ChevronDown size={14}/></button></div>
        <div className="messages">
          {messages.map((m, i) => <div key={i} className={`message-row ${m.role}`}><div className="message-avatar">{m.role === 'assistant' ? active.avatar : 'คุณ'}</div><div className="message-content"><small>{m.role === 'assistant' ? active.name : 'คุณ'}</small><div className="bubble">{m.content}</div></div></div>)}
          {busy && <div className="typing"><span/ ><span/><span/> {active.name} กำลังพิมพ์...</div>}
        </div>
        <form className="composer" onSubmit={sendMessage}><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder={mode === 'roleplay' ? 'พิมพ์บทพูดหรือการกระทำของคุณ...' : 'พิมพ์ข้อความ...'} rows="2" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}/><div className="composer-bottom"><span>Enter เพื่อส่ง · Shift + Enter เพื่อขึ้นบรรทัดใหม่</span><button className="send-btn" disabled={!draft.trim() || busy}><Send size={17}/> ส่งข้อความ</button></div></form>
        <p className="disclaimer">ตัวละครและเหตุการณ์เป็นเรื่องสมมติ · ใช้เฉพาะตัวละครผู้ใหญ่ที่ยินยอมในเนื้อหาสำหรับผู้ใหญ่</p>
      </section>
    </main>

    {showSettings && <div className="overlay" onClick={() => setShowSettings(false)}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><h2>ตั้งค่าการเชื่อมต่อ AI</h2><p>รองรับ API ที่เข้ากันได้กับ OpenAI เช่น LocalAI และบริการ API อื่น</p></div><button className="icon-btn" onClick={() => setShowSettings(false)}>✕</button></div><label>API Base URL<input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="http://localhost:1234/v1"/></label><label>ชื่อโมเดล<input value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4o-mini"/></label><label>API Key <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="ใส่ API Key (ไม่บันทึกลงเซิร์ฟเวอร์)"/></label><label>System Prompt<textarea rows="4" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}/></label><p className="security-hint"><ShieldCheck size={16}/> API Key อยู่ในหน่วยความจำของหน้าเว็บเท่านั้น รีเฟรชแล้วจะหาย แต่การเรียก API จากเบราว์เซอร์ยังมองเห็นได้ในเครื่องของคุณ</p><button className="primary-btn" onClick={() => setShowSettings(false)}>บันทึกการตั้งค่าในหน้านี้</button></section></div>}

    {showCreate && <div className="overlay" onClick={() => setShowCreate(false)}><form className="modal" onSubmit={createCharacter} onClick={e => e.stopPropagation()}><div className="modal-head"><div><h2>สร้างตัวละคร</h2><p>สร้างตัวละครใหม่สำหรับบทสนทนาของคุณ</p></div><button type="button" className="icon-btn" onClick={() => setShowCreate(false)}>✕</button></div><label>ชื่อตัวละคร<input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="ชื่อตัวละคร"/></label><label>บทบาท<input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="เช่น เพื่อนร่วมชั้น นักผจญภัย"/></label><label>รายละเอียดและบุคลิก<textarea rows="4" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="บรรยายตัวละครและบุคลิก..."/></label><button className="primary-btn">สร้างตัวละคร</button></form></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
