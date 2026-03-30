"use client";
// ═══ Palm Art Studio — Email Client ═══
import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

// ── Brand colors (matches admin panel) ──
const C = {
  bg: "#0a0906", bg2: "#141210", bg3: "#1c1915",
  border: "rgba(245,240,232,0.06)", border2: "rgba(245,240,232,0.12)",
  text: "#F5F0E8", muted: "#8B7F72", dim: "#4a4440",
  terra: "#C47D5A", gold: "#C4A86E", sage: "#8B9A7E",
};
const FROM_EMAIL = "cj@palmartstudio.com";

// ── Types ──
interface Thread { thread_id:string; subject:string; to_email:string; from_email:string; latest_message:string; latest_body_preview:string; latest_direction:string; message_count:number; unread_count:number; starred:boolean; has_attachments:boolean; created_at:string; customer_name?:string; }
interface Message { id:string; thread_id:string; direction:string; from_email:string; to_email:string; subject:string; body_html:string|null; body_text:string|null; read:boolean; starred:boolean; folder:string; created_at:string; cc_emails:string[]; bcc_emails:string[]; has_attachments:boolean; is_draft:boolean; attachments:{id:string;filename:string;content_type:string;size_bytes:number;s3_url:string}[]; }
type Folder = "inbox"|"sent"|"drafts"|"starred"|"trash"|"spam";
type View = "list"|"thread"|"compose";

const FOLDERS: {key:Folder;label:string;icon:string}[] = [
  {key:"inbox",label:"Inbox",icon:"✉"},{key:"starred",label:"Starred",icon:"⭐"},
  {key:"sent",label:"Sent",icon:"📨"},{key:"drafts",label:"Drafts",icon:"📝"},
  {key:"trash",label:"Trash",icon:"🗑"},{key:"spam",label:"Spam",icon:"⚠"},
];
function avatarColor(email:string):string {
  const colors=["#C47D5A","#C4A86E","#8B9A7E","#3b8dd4","#EC4899","#8B5CF6","#EF4444","#06B6D4","#22C55E","#F97316"];
  let h=0;for(let i=0;i<email.length;i++)h=email.charCodeAt(i)+((h<<5)-h);return colors[Math.abs(h)%colors.length];
}
function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();if(diff<60000)return"now";if(diff<3600000)return`${Math.floor(diff/60000)}m`;if(diff<86400000)return`${Math.floor(diff/3600000)}h`;const days=Math.floor(diff/86400000);if(days<7)return`${days}d`;return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function formatDate(d:string){return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});}
function formatSize(b:number){if(b<1024)return`${b}B`;if(b<1048576)return`${(b/1024).toFixed(1)}KB`;return`${(b/1048576).toFixed(1)}MB`;}

// ── Editor Toolbar ──
function Toolbar({editor}:{editor:any}){
  if(!editor)return null;
  const Btn=({onClick,active,children}:{onClick:()=>void;active?:boolean;children:React.ReactNode})=>(<button onClick={onClick} style={{padding:"3px 5px",borderRadius:4,border:"none",cursor:"pointer",background:active?`rgba(196,125,90,0.15)`:"transparent",color:active?C.terra:C.muted,fontSize:13}}>{children}</button>);
  return(<div style={{display:"flex",gap:2,padding:"6px 8px",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap"}}>
    <Btn onClick={()=>editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>B</Btn>
    <Btn onClick={()=>editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><em>I</em></Btn>
    <Btn onClick={()=>editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><u>U</u></Btn>
    <Btn onClick={()=>editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><s>S</s></Btn>
    <div style={{width:1,background:C.border,margin:"0 3px"}}/>
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
  const msgEnd=useRef<HTMLDivElement>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const editor=useEditor({extensions:[StarterKit,Link.configure({openOnClick:false}),Underline,Placeholder.configure({placeholder:"Write your message..."})],content:""});

  // Data fetching
  const syncImap=useCallback(async()=>{await fetch("/api/email/sync",{method:"POST"}).catch(()=>null);},[]);
  const loadThreads=useCallback(async()=>{setLoading(true);const r=await fetch(`/api/email/threads?folder=${folder}`).catch(()=>null);if(r?.ok){const d=await r.json();setThreads(d.threads||[]);setFc(d.folderCounts||{});}setLoading(false);},[folder]);
  useEffect(()=>{syncImap().then(()=>loadThreads());},[syncImap,loadThreads]);
  // Poll every 30s
  useEffect(()=>{const iv=setInterval(()=>{syncImap().then(()=>loadThreads());},30000);return()=>clearInterval(iv);},[syncImap,loadThreads]);
  useEffect(()=>{if(messages.length)setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:"smooth"}),100);},[messages]);

  const openThread=async(t:Thread)=>{setSel(t);setView("thread");const r=await fetch("/api/email/threads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_id:t.thread_id})});if(r?.ok){const d=await r.json();setMessages(d.messages||[]);}setThreads(p=>p.map(x=>x.thread_id===t.thread_id?{...x,unread_count:0}:x));};
  const threadAction=async(action:string,ids?:string[])=>{const tids=ids||(sel?[sel.thread_id]:[]);if(!tids.length)return;await fetch("/api/email/threads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_ids:tids,action})});const m:Record<string,string>={trash:"Moved to trash",star:"Starred",unstar:"Unstarred",mark_read:"Read",mark_unread:"Unread",spam:"Spam"};showToast(m[action]||"Updated");if((action==="trash"||action==="mark_unread")&&view==="thread")setView("list");loadThreads();};

  const startCompose=(mode:"new"|"reply"|"forward",t?:Thread)=>{setComposeMode(mode);if(mode==="reply"&&t){setComposeTo(t.to_email);setComposeSubject(t.subject);}else if(mode==="forward"&&t){setComposeTo("");setComposeSubject(`Fwd: ${t.subject}`);}else{setComposeTo("");setComposeSubject("");}setComposeCC("");setShowCC(false);editor?.commands.clearContent();setView("compose");};
  const handleSend=async()=>{if(!composeTo||!composeSubject)return;setSending(true);const html=editor?.getHTML()||"";const text=editor?.getText()||"";const isReply=composeMode==="reply"&&sel;const url=isReply?"/api/email/reply":"/api/email/compose";const payload=isReply?{thread_id:sel!.thread_id,to_email:composeTo,subject:composeSubject,reply_html:html,reply_body:text,from_email:FROM_EMAIL}:{to_email:composeTo,subject:composeSubject,body_html:html,body:text,cc_emails:composeCC?composeCC.split(",").map(s=>s.trim()):[],from_email:FROM_EMAIL};const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});setSending(false);if(r.ok){showToast("Email sent!");setView("list");loadThreads();}else showToast("Failed to send");};

  const filtered=threads.filter(t=>!search||t.subject.toLowerCase().includes(search.toLowerCase())||t.to_email.toLowerCase().includes(search.toLowerCase())||(t.customer_name||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:"flex",height:"calc(100vh - 130px)",background:C.bg2,borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,position:"relative"}}>
      {toast&&<div style={{position:"absolute",top:12,right:12,zIndex:100,background:C.terra,color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>{toast}</div>}

      {/* ── Sidebar ── */}
      <div style={{width:180,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",background:C.bg,flexShrink:0}}>
        <div style={{padding:10}}>
          <button onClick={()=>startCompose("new")} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 14px",background:C.terra,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>✏️ Compose</button>
        </div>
        <nav style={{flex:1,padding:"0 6px"}}>
          {FOLDERS.map(f=>{const active=folder===f.key&&view==="list";const count=fc[f.key]||0;return(
            <button key={f.key} onClick={()=>{setFolder(f.key);setView("list");}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 10px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,background:active?`rgba(196,125,90,0.15)`:"transparent",color:active?C.terra:C.muted,fontWeight:active?600:400,marginBottom:1}}>
              <span style={{fontSize:14}}>{f.icon}</span><span style={{flex:1,textAlign:"left"}}>{f.label}</span>
              {count>0&&<span style={{fontSize:10,fontWeight:600,color:f.key==="inbox"?C.terra:C.dim}}>{count}</span>}
            </button>);
          })}
        </nav>
      </div>

      {/* ── Main ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* ═══ THREAD LIST ═══ */}
        {view==="list"&&(<>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:C.bg3,borderRadius:8,padding:"5px 10px"}}>
              <span style={{color:C.dim,fontSize:13}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{flex:1,border:"none",background:"none",outline:"none",fontSize:12,fontFamily:"inherit",color:C.text}}/>
              {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:0,fontSize:12}}>✕</button>}
            </div>
            <button onClick={loadThreads} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4,fontSize:14}}>🔄</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {loading?<div style={{textAlign:"center",padding:60,color:C.muted,fontSize:13}}>Loading...</div>
            :filtered.length===0?<div style={{textAlign:"center",padding:60,color:C.muted}}><div style={{fontSize:32,marginBottom:12,opacity:0.4}}>✉️</div><p style={{fontSize:13}}>No messages in {folder}</p></div>
            :filtered.map(t=>{const unread=t.unread_count>0;const name=t.customer_name||t.to_email.split("@")[0];return(
              <div key={t.thread_id} onClick={()=>openThread(t)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:unread?"rgba(196,125,90,0.04)":"transparent",transition:"background 0.15s"}}
                onMouseEnter={e=>(e.currentTarget.style.background=C.bg3)} onMouseLeave={e=>(e.currentTarget.style.background=unread?"rgba(196,125,90,0.04)":"transparent")}>
                <div style={{width:32,height:32,borderRadius:"50%",background:avatarColor(t.to_email),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0}}>{(name[0]||"?").toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <span style={{fontSize:12,fontWeight:unread?600:400,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                    {t.message_count>1&&<span style={{fontSize:10,color:C.dim}}>({t.message_count})</span>}
                    <span style={{flex:1}}/><span style={{fontSize:10,color:C.dim,flexShrink:0}}>{timeAgo(t.latest_message)}</span>
                  </div>
                  <div style={{fontSize:12,fontWeight:unread?500:400,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>{t.subject}</div>
                  <div style={{fontSize:11,color:C.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.latest_body_preview}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                  {t.starred&&<span style={{fontSize:12}}>⭐</span>}
                  {t.has_attachments&&<span style={{fontSize:11}}>📎</span>}
                </div>
              </div>);
            })}
          </div>
        </>)}

        {/* ═══ THREAD DETAIL ═══ */}
        {view==="thread"&&sel&&(<>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
            <button onClick={()=>{setView("list");loadThreads();}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4,fontSize:16}}>←</button>
            <h3 style={{flex:1,fontSize:14,fontWeight:600,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'DM Serif Display',serif"}}>{sel.subject}</h3>
            <button onClick={()=>threadAction(sel.starred?"unstar":"star")} style={{background:"none",border:"none",cursor:"pointer",padding:4,fontSize:14}}>{sel.starred?"⭐":"☆"}</button>
            <button onClick={()=>threadAction("trash")} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:4,fontSize:14}}>🗑</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14}}>
            {messages.length===0?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>Loading...</div>
            :messages.map(msg=>{const out=msg.direction==="outbound";return(
              <div key={msg.id} style={{marginBottom:14,background:out?"rgba(196,125,90,0.06)":C.bg3,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:avatarColor(msg.from_email),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600}}>{(msg.from_email[0]||"?").toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:C.text}}>{out?"You":msg.from_email}</div>
                    <div style={{fontSize:10,color:C.dim}}>to {out?msg.to_email:"me"} · {formatDate(msg.created_at)}</div>
                  </div>
                  {out&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"rgba(196,125,90,0.15)",color:C.terra}}>Sent</span>}
                </div>
                <div style={{padding:14,fontSize:13,lineHeight:1.7,color:C.text}}>
                  {msg.body_html?<div dangerouslySetInnerHTML={{__html:msg.body_html}}/>:<pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0}}>{msg.body_text}</pre>}
                </div>
                {msg.attachments?.length>0&&(
                  <div style={{padding:"0 14px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
                    {msg.attachments.map(a=>(
                      <a key={a.id} href={a.s3_url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",background:C.bg,borderRadius:6,textDecoration:"none",color:C.muted,fontSize:11}}>
                        📎 {a.filename} <span style={{color:C.dim}}>({formatSize(a.size_bytes)})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>);
            })}
            <div ref={msgEnd}/>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",gap:8}}>
            <button onClick={()=>startCompose("reply",sel)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:C.terra,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>↩ Reply</button>
            <button onClick={()=>startCompose("forward",sel)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:C.bg3,color:C.muted,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>⤻ Forward</button>
          </div>
        </>)}

        {/* ═══ COMPOSE ═══ */}
        {view==="compose"&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
              <button onClick={()=>setView(sel?"thread":"list")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4,fontSize:16}}>←</button>
              <h3 style={{flex:1,fontSize:14,fontWeight:600,color:C.text,margin:0}}>{composeMode==="reply"?"Reply":composeMode==="forward"?"Forward":"New Message"}</h3>
            </div>
            <div style={{padding:"10px 14px 0",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.dim,width:50}}>To</span>
                <input value={composeTo} onChange={e=>setComposeTo(e.target.value)} placeholder="recipient@email.com" style={{flex:1,padding:"7px 10px",borderRadius:6,border:`1px solid ${C.border2}`,background:C.bg3,fontSize:12,fontFamily:"inherit",color:C.text,outline:"none"}}/>
                <button onClick={()=>setShowCC(!showCC)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.dim}}>CC</button>
              </div>
              {showCC&&(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:C.dim,width:50}}>CC</span>
                  <input value={composeCC} onChange={e=>setComposeCC(e.target.value)} placeholder="cc@email.com" style={{flex:1,padding:"7px 10px",borderRadius:6,border:`1px solid ${C.border2}`,background:C.bg3,fontSize:12,fontFamily:"inherit",color:C.text,outline:"none"}}/>
                </div>
              )}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.dim,width:50}}>Subject</span>
                <input value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} placeholder="Email subject" style={{flex:1,padding:"7px 10px",borderRadius:6,border:`1px solid ${C.border2}`,background:C.bg3,fontSize:12,fontFamily:"inherit",color:C.text,outline:"none"}}/>
              </div>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",margin:"10px 14px",border:`1px solid ${C.border2}`,borderRadius:8,overflow:"hidden",background:C.bg3}}>
              <Toolbar editor={editor}/>
              <div style={{flex:1,overflowY:"auto"}}>
                <EditorContent editor={editor} style={{minHeight:180,padding:"10px 14px",fontSize:13,lineHeight:1.6,color:C.text}}/>
              </div>
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",justifyContent:"flex-end",gap:8}}>
              <button onClick={()=>setView(sel?"thread":"list")} style={{padding:"8px 18px",background:C.bg3,color:C.muted,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Discard</button>
              <button onClick={handleSend} disabled={sending||!composeTo||!composeSubject} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 22px",background:sending||!composeTo||!composeSubject?C.dim:C.terra,color:"#fff",border:"none",borderRadius:8,cursor:sending?"not-allowed":"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>{sending?"Sending...":"📨 Send"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
