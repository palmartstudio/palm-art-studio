"use client";
// ═══ Palm Art Studio — Email Client (Mobile Optimized) ═══
import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

const C = {
  bg: "#0a0906", bg2: "#141210", bg3: "#1c1915",
  border: "rgba(245,240,232,0.06)", border2: "rgba(245,240,232,0.12)",
  text: "#F5F0E8", muted: "#8B7F72", dim: "#4a4440",
  terra: "#C47D5A", gold: "#C4A86E", sage: "#8B9A7E",
};
const FROM_EMAIL = "cj@palmartstudio.com";

interface Thread { thread_id:string; subject:string; to_email:string; from_email:string; latest_message:string; latest_body_preview:string; latest_direction:string; message_count:number; unread_count:number; starred:boolean; has_attachments:boolean; created_at:string; customer_name?:string; }
interface Message { id:string; thread_id:string; direction:string; from_email:string; to_email:string; subject:string; body_html:string|null; body_text:string|null; read:boolean; starred:boolean; folder:string; created_at:string; cc_emails:string[]; bcc_emails:string[]; has_attachments:boolean; is_draft:boolean; attachments:{id:string;filename:string;content_type:string;size_bytes:number;s3_url:string}[]; }
type Folder = "inbox"|"sent"|"drafts"|"starred"|"trash"|"spam";
type View = "list"|"thread"|"compose";

const FOLDERS: {key:Folder;label:string;icon:string}[] = [
  {key:"inbox",label:"Inbox",icon:"✉️"},{key:"starred",label:"Starred",icon:"⭐"},
  {key:"sent",label:"Sent",icon:"📨"},{key:"drafts",label:"Drafts",icon:"📝"},
  {key:"trash",label:"Trash",icon:"🗑️"},{key:"spam",label:"Spam",icon:"⚠️"},
];
function avatarColor(email:string):string {
  const colors=["#C47D5A","#C4A86E","#8B9A7E","#3b8dd4","#EC4899","#8B5CF6","#EF4444","#06B6D4","#22C55E","#F97316"];
  let h=0;for(let i=0;i<email.length;i++)h=email.charCodeAt(i)+((h<<5)-h);return colors[Math.abs(h)%colors.length];
}
function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();if(diff<60000)return"now";if(diff<3600000)return`${Math.floor(diff/60000)}m`;if(diff<86400000)return`${Math.floor(diff/3600000)}h`;const days=Math.floor(diff/86400000);if(days<7)return`${days}d`;return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function formatDate(d:string){return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});}
function formatSize(b:number){if(b<1024)return`${b}B`;if(b<1048576)return`${(b/1024).toFixed(1)}KB`;return`${(b/1048576).toFixed(1)}MB`;}

// ── Email body renderer (iframe for proper HTML isolation) ──
function EmailBody({ html, text }: { html: string | null; text: string | null }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);

  useEffect(() => {
    if (!iframeRef.current || !html) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      body{margin:0;padding:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#333;word-wrap:break-word;background:#fff;}
      img{max-width:100%;height:auto;}
      a{color:#C47D5A;}
      table{max-width:100%!important;width:auto!important;}
      *{max-width:100%!important;box-sizing:border-box;}
    </style></head><body>${html}</body></html>`);
    doc.close();
    // Auto-resize iframe to content
    const resize = () => {
      if (doc.body) {
        const h = doc.body.scrollHeight;
        if (h > 40) setHeight(Math.min(h + 20, 600));
      }
    };
    setTimeout(resize, 100);
    setTimeout(resize, 500);
  }, [html]);

  if (html) {
    return <iframe ref={iframeRef} style={{ width: "100%", height, border: "none", borderRadius: 6, background: "#fff" }} sandbox="allow-same-origin" />;
  }
  return <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, color: C.text, fontSize: 13, lineHeight: 1.7 }}>{text || "(no content)"}</pre>;
}

// ── Rich text toolbar ──
function Toolbar({editor}:{editor:any}){
  if(!editor)return null;
  const Btn=({onClick,active,children}:{onClick:()=>void;active?:boolean;children:React.ReactNode})=>(<button onClick={onClick} style={{padding:"5px 8px",borderRadius:4,border:"none",cursor:"pointer",background:active?`rgba(196,125,90,0.15)`:"transparent",color:active?C.terra:C.muted,fontSize:14,minWidth:28,minHeight:28}}>{children}</button>);
  return(<div style={{display:"flex",gap:2,padding:"6px 8px",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap"}}>
    <Btn onClick={()=>editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><b>B</b></Btn>
    <Btn onClick={()=>editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><em>I</em></Btn>
    <Btn onClick={()=>editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><u>U</u></Btn>
    <div style={{width:1,background:C.border2,margin:"0 3px"}}/>
    <Btn onClick={()=>editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>•</Btn>
    <Btn onClick={()=>editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>1.</Btn>
    <Btn onClick={()=>{const url=prompt("Link URL:");if(url)editor.chain().focus().setLink({href:url}).run();}}>🔗</Btn>
  </div>);
}

// ═══ MAIN COMPONENT ═══
export default function AdminInbox() {
  const [view,setView]=useState<View>("list");
  const [folder,setFolder]=useState<Folder>("inbox");
  const [threads,setThreads]=useState<Thread[]>([]);
  const [fc,setFc]=useState<Record<string,number>>({});
  const [sel,setSel]=useState<Thread|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [search,setSearch]=useState("");
  const [composeTo,setComposeTo]=useState("");
  const [composeSubject,setComposeSubject]=useState("");
  const [composeCC,setComposeCC]=useState("");
  const [showCC,setShowCC]=useState(false);
  const [composeMode,setComposeMode]=useState<"new"|"reply"|"forward"|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  const [showSidebar,setShowSidebar]=useState(false);
  const msgEnd=useRef<HTMLDivElement>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const editor=useEditor({extensions:[StarterKit,Link.configure({openOnClick:false}),Underline,Placeholder.configure({placeholder:"Write your message..."})],content:""});

  const syncImap=useCallback(async()=>{await fetch("/api/email/sync",{method:"POST"}).catch(()=>null);},[]);
  const loadThreads=useCallback(async()=>{setLoading(true);const r=await fetch(`/api/email/threads?folder=${folder}`).catch(()=>null);if(r?.ok){const d=await r.json();setThreads(d.threads||[]);setFc(d.folderCounts||{});}setLoading(false);},[folder]);
  useEffect(()=>{syncImap().then(()=>loadThreads());},[syncImap,loadThreads]);
  useEffect(()=>{const iv=setInterval(()=>{syncImap().then(()=>loadThreads());},30000);return()=>clearInterval(iv);},[syncImap,loadThreads]);
  useEffect(()=>{if(messages.length)setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:"smooth"}),100);},[messages]);

  const openThread=async(t:Thread)=>{setSel(t);setView("thread");setShowSidebar(false);const r=await fetch("/api/email/threads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_id:t.thread_id})});if(r?.ok){const d=await r.json();setMessages(d.messages||[]);}setThreads(p=>p.map(x=>x.thread_id===t.thread_id?{...x,unread_count:0}:x));};
  const threadAction=async(action:string,ids?:string[])=>{const tids=ids||(sel?[sel.thread_id]:[]);if(!tids.length)return;await fetch("/api/email/threads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_ids:tids,action})});const m:Record<string,string>={trash:"Moved to trash",star:"Starred",unstar:"Unstarred",mark_read:"Read",mark_unread:"Unread",spam:"Spam"};showToast(m[action]||"Updated");if((action==="trash"||action==="mark_unread")&&view==="thread")setView("list");loadThreads();};
  const startCompose=(mode:"new"|"reply"|"forward",t?:Thread)=>{setComposeMode(mode);if(mode==="reply"&&t){setComposeTo(t.to_email);setComposeSubject(t.subject);}else if(mode==="forward"&&t){setComposeTo("");setComposeSubject(`Fwd: ${t.subject}`);}else{setComposeTo("");setComposeSubject("");}setComposeCC("");setShowCC(false);editor?.commands.clearContent();setView("compose");setShowSidebar(false);};
  const handleSend=async()=>{if(!composeTo||!composeSubject)return;setSending(true);const html=editor?.getHTML()||"";const text=editor?.getText()||"";const isReply=composeMode==="reply"&&sel;const url=isReply?"/api/email/reply":"/api/email/compose";const payload=isReply?{thread_id:sel!.thread_id,to_email:composeTo,subject:composeSubject,reply_html:html,reply_body:text,from_email:FROM_EMAIL}:{to_email:composeTo,subject:composeSubject,body_html:html,body:text,cc_emails:composeCC?composeCC.split(",").map((s: string)=>s.trim()):[],from_email:FROM_EMAIL};const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});setSending(false);if(r.ok){showToast("Email sent!");setView("list");loadThreads();}else showToast("Failed to send");};
  const filtered=threads.filter(t=>!search||t.subject.toLowerCase().includes(search.toLowerCase())||t.to_email.toLowerCase().includes(search.toLowerCase())||(t.customer_name||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:"flex",height:"calc(100vh - 130px)",background:C.bg2,borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,position:"relative"}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:C.terra,color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>{toast}</div>}

      {/* Mobile sidebar overlay */}
      {showSidebar&&<div onClick={()=>setShowSidebar(false)} className="email-sidebar-overlay" style={{position:"absolute",inset:0,background:"rgba(10,9,6,0.6)",zIndex:49,display:"none"}}/>}

      {/* ── Sidebar ── */}
      <div className="email-sidebar" style={{width:180,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",background:C.bg,flexShrink:0,zIndex:50,transition:"transform 0.25s ease"}}>
        <div style={{padding:10}}>
          <button onClick={()=>startCompose("new")} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px 14px",background:C.terra,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>✏️ Compose</button>
        </div>
        <nav style={{flex:1,padding:"0 6px",overflowY:"auto"}}>
          {FOLDERS.map(f=>{const active=folder===f.key&&view==="list";const count=fc[f.key]||0;return(
            <button key={f.key} onClick={()=>{setFolder(f.key);setView("list");setShowSidebar(false);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,background:active?`rgba(196,125,90,0.15)`:"transparent",color:active?C.terra:C.muted,fontWeight:active?600:400,marginBottom:2}}>
              <span style={{fontSize:15}}>{f.icon}</span><span style={{flex:1,textAlign:"left"}}>{f.label}</span>
              {count>0&&<span style={{fontSize:11,fontWeight:600,color:f.key==="inbox"?C.terra:C.dim,background:f.key==="inbox"?"rgba(196,125,90,0.15)":"transparent",padding:"1px 6px",borderRadius:10,minWidth:18,textAlign:"center"}}>{count}</span>}
            </button>);
          })}
        </nav>
      </div>

      {/* ── Main Content ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* ═══ THREAD LIST ═══ */}
        {view==="list"&&(<>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
            <button className="email-menu-btn" onClick={()=>setShowSidebar(s=>!s)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4,fontSize:18,display:"none",flexShrink:0}}>☰</button>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:C.bg3,borderRadius:8,padding:"7px 10px"}}>
              <span style={{color:C.dim,fontSize:13}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{flex:1,border:"none",background:"none",outline:"none",fontSize:13,fontFamily:"inherit",color:C.text}}/>
              {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:0,fontSize:14}}>✕</button>}
            </div>
            <button onClick={()=>{syncImap().then(()=>loadThreads());}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,fontSize:16}}>🔄</button>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            {loading?<div style={{textAlign:"center",padding:60,color:C.muted,fontSize:13}}>Syncing emails...</div>
            :filtered.length===0?<div style={{textAlign:"center",padding:60,color:C.muted}}><div style={{fontSize:36,marginBottom:12,opacity:0.3}}>✉️</div><p style={{fontSize:14}}>No messages in {folder}</p></div>
            :filtered.map(t=>{const unread=t.unread_count>0;const name=t.customer_name||t.to_email.split("@")[0];return(
              <div key={t.thread_id} onClick={()=>openThread(t)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:unread?"rgba(196,125,90,0.04)":"transparent",transition:"background 0.15s"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:avatarColor(t.to_email),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,flexShrink:0}}>{(name[0]||"?").toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:unread?600:400,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                    {t.message_count>1&&<span style={{fontSize:10,color:C.dim,background:C.bg3,padding:"1px 5px",borderRadius:8}}>({t.message_count})</span>}
                    <span style={{flex:1}}/><span style={{fontSize:11,color:C.dim,flexShrink:0}}>{timeAgo(t.latest_message)}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:unread?500:400,color:unread?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{t.subject}</div>
                  <div style={{fontSize:12,color:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.latest_body_preview}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                  {t.starred&&<span style={{fontSize:14}}>⭐</span>}
                  {t.has_attachments&&<span style={{fontSize:13}}>📎</span>}
                </div>
              </div>);
            })}
          </div>
        </>)}

        {/* ═══ THREAD DETAIL ═══ */}
        {view==="thread"&&sel&&(<>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <button onClick={()=>{setView("list");loadThreads();}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,fontSize:18,flexShrink:0}}>←</button>
            <h3 style={{flex:1,fontSize:14,fontWeight:600,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.subject}</h3>
            <button onClick={()=>threadAction(sel.starred?"unstar":"star")} style={{background:"none",border:"none",cursor:"pointer",padding:6,fontSize:16}}>{sel.starred?"⭐":"☆"}</button>
            <button onClick={()=>threadAction("trash")} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:6,fontSize:16}}>🗑️</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
            {messages.length===0?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>Loading messages...</div>
            :messages.map(msg=>{const out=msg.direction==="outbound";return(
              <div key={msg.id} style={{marginBottom:12,background:out?"rgba(196,125,90,0.06)":C.bg3,border:`1px solid ${C.border2}`,borderRadius:12,overflow:"hidden"}}>
                {/* Message header */}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:avatarColor(msg.from_email),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0}}>{(msg.from_email[0]||"?").toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:C.text}}>{out?"You":msg.from_email}</div>
                    <div style={{fontSize:11,color:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>to {out?msg.to_email:"me"} · {formatDate(msg.created_at)}</div>
                  </div>
                  {out&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(196,125,90,0.15)",color:C.terra,flexShrink:0}}>Sent</span>}
                </div>
                {/* Message body — rendered in iframe for HTML emails */}
                <div style={{padding:"12px",overflow:"hidden"}}>
                  <EmailBody html={msg.body_html} text={msg.body_text} />
                </div>
                {/* Attachments */}
                {msg.attachments?.length>0&&(
                  <div style={{padding:"0 12px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
                    {msg.attachments.map(a=>(
                      <a key={a.id} href={a.s3_url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:C.bg,borderRadius:8,textDecoration:"none",color:C.muted,fontSize:12}}>
                        📎 {a.filename} <span style={{color:C.dim}}>({formatSize(a.size_bytes)})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>);
            })}
            <div ref={msgEnd}/>
          </div>
          {/* Reply bar */}
          <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 12px",display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>startCompose("reply",sel)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 16px",background:C.terra,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>↩ Reply</button>
            <button onClick={()=>startCompose("forward",sel)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 16px",background:C.bg3,color:C.muted,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>⤻ Forward</button>
          </div>
        </>)}

        {/* ═══ COMPOSE ═══ */}
        {view==="compose"&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <button onClick={()=>setView(sel?"thread":"list")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,fontSize:18}}>←</button>
              <h3 style={{flex:1,fontSize:14,fontWeight:600,color:C.text,margin:0}}>{composeMode==="reply"?"Reply":composeMode==="forward"?"Forward":"New Message"}</h3>
            </div>
            <div style={{padding:"10px 14px 0",display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
              <div className="compose-field" style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:C.dim,width:50,flexShrink:0}}>To</span>
                <input value={composeTo} onChange={e=>setComposeTo(e.target.value)} placeholder="recipient@email.com" style={{flex:1,padding:"9px 10px",borderRadius:8,border:`1px solid ${C.border2}`,background:C.bg3,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none",minWidth:0}}/>
                <button onClick={()=>setShowCC(!showCC)} style={{background:"none",border:`1px solid ${C.border2}`,borderRadius:6,cursor:"pointer",fontSize:11,color:C.dim,padding:"6px 10px",flexShrink:0}}>CC</button>
              </div>
              {showCC&&(
                <div className="compose-field" style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,color:C.dim,width:50,flexShrink:0}}>CC</span>
                  <input value={composeCC} onChange={e=>setComposeCC(e.target.value)} placeholder="cc@email.com" style={{flex:1,padding:"9px 10px",borderRadius:8,border:`1px solid ${C.border2}`,background:C.bg3,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none",minWidth:0}}/>
                </div>
              )}
              <div className="compose-field" style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:C.dim,width:50,flexShrink:0}}>Subject</span>
                <input value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} placeholder="Email subject" style={{flex:1,padding:"9px 10px",borderRadius:8,border:`1px solid ${C.border2}`,background:C.bg3,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none",minWidth:0}}/>
              </div>
            </div>
            {/* Rich text editor */}
            <div style={{flex:1,display:"flex",flexDirection:"column",margin:"10px 14px",border:`1px solid ${C.border2}`,borderRadius:10,overflow:"hidden",background:C.bg3,minHeight:0}}>
              <Toolbar editor={editor}/>
              <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
                <EditorContent editor={editor} style={{minHeight:160,padding:"10px 14px",fontSize:14,lineHeight:1.6,color:C.text}}/>
              </div>
            </div>
            {/* Send bar */}
            <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
              <button onClick={()=>setView(sel?"thread":"list")} style={{padding:"10px 18px",background:C.bg3,color:C.muted,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Discard</button>
              <button onClick={handleSend} disabled={sending||!composeTo||!composeSubject} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 24px",background:sending||!composeTo||!composeSubject?C.dim:C.terra,color:"#fff",border:"none",borderRadius:10,cursor:sending?"not-allowed":"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>{sending?"Sending...":"📨 Send"}</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Responsive CSS ── */}
      <style>{`
        .ProseMirror { outline: none; min-height: 120px; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left; color: ${C.dim}; pointer-events: none; height: 0;
        }
        @media (max-width: 640px) {
          .email-sidebar {
            position: absolute !important; left: 0; top: 0; bottom: 0;
            transform: translateX(-100%); width: 220px !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.4);
          }
          .email-sidebar-overlay { display: block !important; }
        }
        @media (max-width: 640px) {
          .email-menu-btn { display: flex !important; }
        }
      `}</style>
      {showSidebar&&<style>{`
        .email-sidebar { transform: translateX(0) !important; }
      `}</style>}
    </div>
  );
}
