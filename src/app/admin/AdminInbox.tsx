"use client";
// ═══ Palm Art Studio — Full-Screen Email Client v4 ═══
// Edge-to-edge email body, expandable details, per-message actions
import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

const C = {
  bg: "#0a0906", bg2: "#111110", bg3: "#1c1915",
  border: "rgba(245,240,232,0.06)", border2: "rgba(245,240,232,0.12)",
  text: "#F5F0E8", muted: "#8B7F72", dim: "#4a4440",
  terra: "#C47D5A", gold: "#C4A86E",
};
const FROM = "cj@palmartstudio.com";

interface Thread { thread_id:string; subject:string; to_email:string; from_email:string; latest_message:string; latest_body_preview:string; latest_direction:string; message_count:number; unread_count:number; starred:boolean; has_attachments:boolean; created_at:string; customer_name?:string; }
interface Msg { id:string; thread_id:string; direction:string; from_email:string; to_email:string; subject:string; body_html:string|null; body_text:string|null; read:boolean; starred:boolean; folder:string; created_at:string; cc_emails:string[]; bcc_emails:string[]; has_attachments:boolean; is_draft:boolean; attachments:{id:string;filename:string;content_type:string;size_bytes:number;s3_url:string}[]; }
type Folder = "inbox"|"sent"|"drafts"|"starred"|"trash"|"spam";
type View = "list"|"thread"|"compose";
const FOLDERS:{key:Folder;label:string;icon:string}[] = [
  {key:"inbox",label:"Inbox",icon:"📥"},{key:"starred",label:"Starred",icon:"⭐"},
  {key:"sent",label:"Sent",icon:"📨"},{key:"drafts",label:"Drafts",icon:"📝"},
  {key:"trash",label:"Trash",icon:"🗑️"},{key:"spam",label:"Spam",icon:"⚠️"},
];
function avatarColor(e:string){const c=["#C47D5A","#C4A86E","#8B9A7E","#3b8dd4","#EC4899","#8B5CF6","#EF4444","#06B6D4","#22C55E","#F97316"];let h=0;for(let i=0;i<e.length;i++)h=e.charCodeAt(i)+((h<<5)-h);return c[Math.abs(h)%c.length];}
function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();if(diff<60000)return"now";if(diff<3600000)return`${Math.floor(diff/60000)}m`;if(diff<86400000)return`${Math.floor(diff/3600000)}h`;const days=Math.floor(diff/86400000);return days<7?`${days}d`:new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function formatDate(d:string){return new Date(d).toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true});}
function fmtSize(b:number){if(b<1024)return`${b}B`;if(b<1048576)return`${(b/1024).toFixed(0)}KB`;return`${(b/1048576).toFixed(1)}MB`;}
function useIsDesktop(){const[d,setD]=useState(false);useEffect(()=>{const c=()=>setD(window.innerWidth>=768);c();window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c);},[]);return d;}

// ── Email body: full-width iframe, no extra padding ──
function EmailBody({html,text}:{html:string|null;text:string|null}){
  const ref=useRef<HTMLIFrameElement>(null);
  const[h,setH]=useState(200);
  useEffect(()=>{
    if(!ref.current||!html)return;
    const doc=ref.current.contentDocument;if(!doc)return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      body{margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#222;background:#fff;word-wrap:break-word;overflow-wrap:break-word;}
      img{max-width:100%!important;height:auto!important;display:block;}
      a{color:#C47D5A;}
      table{max-width:100%!important;width:100%!important;}
      *{max-width:100%!important;box-sizing:border-box;}
      blockquote{border-left:3px solid #ddd;margin:10px 0;padding:0 12px;color:#666;}
      pre{white-space:pre-wrap;overflow-x:auto;}
    </style></head><body>${html}</body></html>`);
    doc.close();
    const resize=()=>{if(doc.body){const sh=doc.body.scrollHeight;if(sh>50)setH(Math.min(sh+32,1200));}};
    setTimeout(resize,200);setTimeout(resize,800);setTimeout(resize,2000);
  },[html]);
  if(html)return <iframe ref={ref} style={{width:"100%",height:h,border:"none",background:"#fff",display:"block"}} sandbox="allow-same-origin"/>;
  return <div style={{padding:16,background:"#fff",color:"#222",fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"}}>{text||"(no content)"}</div>;
}

// ── Expandable message details (clickable "to me") ──
function MsgDetails({msg}:{msg:Msg}){
  const[open,setOpen]=useState(false);
  const out=msg.direction==="outbound";
  return <div>
    <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,fontSize:13,color:C.dim,fontFamily:"inherit"}}>
      to {out?msg.to_email:"me"} <span style={{fontSize:10,transition:"transform 0.2s",transform:open?"rotate(180deg)":"none"}}>▼</span>
    </button>
    {open&&(
      <div style={{marginTop:8,padding:12,borderRadius:10,background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,fontSize:12,lineHeight:2}}>
        <div style={{display:"flex",gap:8}}><span style={{color:C.dim,width:55,flexShrink:0}}>From</span><span style={{color:C.muted}}>{msg.from_email}</span></div>
        <div style={{display:"flex",gap:8}}><span style={{color:C.dim,width:55,flexShrink:0}}>To</span><span style={{color:C.muted}}>{msg.to_email}</span></div>
        {msg.cc_emails?.length>0&&<div style={{display:"flex",gap:8}}><span style={{color:C.dim,width:55,flexShrink:0}}>CC</span><span style={{color:C.muted}}>{msg.cc_emails.join(", ")}</span></div>}
        <div style={{display:"flex",gap:8}}><span style={{color:C.dim,width:55,flexShrink:0}}>Date</span><span style={{color:C.muted}}>{formatDate(msg.created_at)}</span></div>
        <div style={{display:"flex",gap:8}}><span style={{color:C.dim,width:55,flexShrink:0}}>Subject</span><span style={{color:C.muted}}>{msg.subject}</span></div>
      </div>
    )}
  </div>;
}

// ── Toolbar ──
function Toolbar({editor}:{editor:any}){
  if(!editor)return null;
  const b=(active:boolean,onClick:()=>void,label:string)=><button key={label} onClick={onClick} style={{padding:"6px 8px",borderRadius:4,border:"none",cursor:"pointer",background:active?"rgba(196,125,90,0.2)":"transparent",color:active?C.terra:C.muted,fontSize:15,fontWeight:active?700:400,minWidth:32,minHeight:32}}>{label}</button>;
  return <div style={{display:"flex",gap:2,padding:"6px 10px",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",background:"rgba(0,0,0,0.2)"}}>
    {b(editor.isActive("bold"),()=>editor.chain().focus().toggleBold().run(),"B")}
    {b(editor.isActive("italic"),()=>editor.chain().focus().toggleItalic().run(),"I")}
    {b(editor.isActive("underline"),()=>editor.chain().focus().toggleUnderline().run(),"U")}
    <span style={{width:1,background:C.border2,margin:"0 4px"}}/>
    {b(editor.isActive("bulletList"),()=>editor.chain().focus().toggleBulletList().run(),"•")}
    {b(editor.isActive("orderedList"),()=>editor.chain().focus().toggleOrderedList().run(),"1.")}
    {b(false,()=>{const url=prompt("Link URL:");if(url)editor.chain().focus().setLink({href:url}).run();},"🔗")}
  </div>;
}

// ── Per-message action menu ──
function MsgMenu({msg,onReply,onForward}:{msg:Msg;onReply:()=>void;onForward:()=>void}){
  const[open,setOpen]=useState(false);
  return <div style={{position:"relative"}}>
    <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:8,fontSize:18}}>⋮</button>
    {open&&<>
      <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:70}}/>
      <div style={{position:"absolute",right:0,top:"100%",zIndex:71,background:C.bg3,border:`1px solid ${C.border2}`,borderRadius:12,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",minWidth:160}}>
        <button onClick={()=>{setOpen(false);onReply();}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",color:C.text,fontSize:15,fontFamily:"inherit",textAlign:"left"}}>↩ Reply</button>
        <button onClick={()=>{setOpen(false);onForward();}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",color:C.text,fontSize:15,fontFamily:"inherit",textAlign:"left",borderTop:`1px solid ${C.border}`}}>⤻ Forward</button>
      </div>
    </>}
  </div>;
}

export default function AdminInbox(){
  const isDesktop=useIsDesktop();
  const[view,setViewRaw]=useState<View>("list");
  const[folder,setFolder]=useState<Folder>("inbox");
  const[threads,setThreads]=useState<Thread[]>([]);
  const[fc,setFc]=useState<Record<string,number>>({});
  const[sel,setSel]=useState<Thread|null>(null);
  const[msgs,setMsgs]=useState<Msg[]>([]);
  const[loading,setLoading]=useState(true);
  const[sending,setSending]=useState(false);
  const[search,setSearch]=useState("");
  const[composeTo,setComposeTo]=useState("");
  const[composeSubject,setComposeSubject]=useState("");
  const[composeCC,setComposeCC]=useState("");
  const[showCC,setShowCC]=useState(false);
  const[composeMode,setComposeMode]=useState<"new"|"reply"|"forward"|null>(null);
  const[toast,setToast]=useState<string|null>(null);
  const[sidebar,setSidebar]=useState(false);
  const[selectMode,setSelectMode]=useState(false);
  const[selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const longPressTimer=useRef<NodeJS.Timeout>();
  const longPressTriggered=useRef(false);
  const msgEnd=useRef<HTMLDivElement>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};

  // ── History-aware navigation (Android back button support) ──
  const viewRef = useRef<View>("list");
  const sidebarRef = useRef(false);
  const setView=(v:View)=>{
    viewRef.current = v;
    if(v !== "list"){ window.history.pushState({emailView:v},""); }
    setViewRaw(v);
  };
  // Keep refs in sync
  useEffect(()=>{ sidebarRef.current = sidebar; },[sidebar]);
  useEffect(()=>{
    const onPop = (e: PopStateEvent) => {
      const cv = viewRef.current;
      // Sidebar open? Close it, re-push state so we don't lose position
      if(sidebarRef.current){ setSidebar(false); if(cv !== "list") window.history.pushState({emailView:cv},""); return; }
      // Navigate back through views
      if(cv === "compose"){
        viewRef.current = sel ? "thread" : "list";
        setViewRaw(viewRef.current);
        if(sel) window.history.pushState({emailView:"thread"},"");
        return;
      }
      if(cv === "thread"){ viewRef.current = "list"; setViewRaw("list"); setSel(null); return; }
      // On list — don't prevent, let AdminApp or browser handle it
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  },[]);

  const editor=useEditor({extensions:[StarterKit,Link.configure({openOnClick:false}),Underline,Placeholder.configure({placeholder:"Write your message..."})],content:""});

  const syncRef=useRef(false);
  const sync=useCallback(async()=>{await fetch("/api/email/sync",{method:"POST"}).catch(()=>null);},[]);
  const load=useCallback(async()=>{setLoading(true);const r=await fetch(`/api/email/threads?folder=${folder}`).catch(()=>null);if(r?.ok){const d=await r.json();setThreads(d.threads||[]);setFc(d.folderCounts||{});}setLoading(false);},[folder]);
  useEffect(()=>{load().then(()=>{if(!syncRef.current){syncRef.current=true;sync().then(()=>load());}});},[load,sync]);
  useEffect(()=>{const iv=setInterval(()=>{sync().then(()=>load());},60000);return()=>clearInterval(iv);},[sync,load]);
  useEffect(()=>{if(msgs.length)setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:"smooth"}),100);},[msgs]);

  const openThread=async(t:Thread)=>{setSel(t);setView("thread");setSidebar(false);const r=await fetch("/api/email/threads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_id:t.thread_id})});if(r?.ok){const d=await r.json();setMsgs(d.messages||[]);}setThreads(p=>p.map(x=>x.thread_id===t.thread_id?{...x,unread_count:0}:x));};
  const threadAction=async(action:string)=>{if(!sel)return;await fetch("/api/email/threads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_ids:[sel.thread_id],action})});const m:Record<string,string>={trash:"Moved to trash",star:"Starred",unstar:"Unstarred",mark_read:"Read",mark_unread:"Unread",spam:"Spam"};showToast(m[action]||"Done");if(action==="trash"||action==="mark_unread")setView("list");load();};
  const startCompose=(mode:"new"|"reply"|"forward",msg?:Msg)=>{
    setComposeMode(mode);
    if(mode==="reply"&&msg){setComposeTo(msg.direction==="inbound"?msg.from_email:msg.to_email);setComposeSubject(msg.subject.startsWith("Re:")?msg.subject:`Re: ${msg.subject}`);editor?.commands.setContent("");}
    else if(mode==="forward"&&msg){setComposeTo("");setComposeSubject(`Fwd: ${msg.subject.replace(/^Fwd:\s*/i,"")}`);editor?.commands.setContent(`<br><p style="color:#888">---------- Forwarded ----------</p><p style="color:#888">From: ${msg.from_email}<br>Date: ${formatDate(msg.created_at)}<br>Subject: ${msg.subject}</p><br>${msg.body_html||msg.body_text||""}`);}
    else{setComposeTo("");setComposeSubject("");editor?.commands.setContent("");}
    setComposeCC("");setShowCC(false);setView("compose");setSidebar(false);
  };
  const handleSend=async()=>{if(!composeTo||!composeSubject)return;setSending(true);const html=editor?.getHTML()||"";const text=editor?.getText()||"";const isReply=composeMode==="reply"&&sel;const url=isReply?"/api/email/reply":"/api/email/compose";const payload=isReply?{thread_id:sel!.thread_id,to_email:composeTo,subject:composeSubject,reply_html:html,reply_body:text,from_email:FROM}:{to_email:composeTo,subject:composeSubject,body_html:html,body:text,cc_emails:composeCC?composeCC.split(",").map((s:string)=>s.trim()):[],from_email:FROM};const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});setSending(false);if(r.ok){showToast("Email sent!");setView("list");load();}else showToast("Failed to send");};
  const filtered=threads.filter(t=>!search||t.subject.toLowerCase().includes(search.toLowerCase())||t.to_email.toLowerCase().includes(search.toLowerCase())||t.from_email.toLowerCase().includes(search.toLowerCase()));

  // ── Multi-select helpers ──
  const enterSelect=(tid:string)=>{setSelectMode(true);setSelectedIds(new Set([tid]));};
  const toggleSelect=(tid:string)=>{setSelectedIds(p=>{const n=new Set(p);n.has(tid)?n.delete(tid):n.add(tid);return n;});};
  const exitSelect=()=>{setSelectMode(false);setSelectedIds(new Set());};
  const batchAction=async(action:string)=>{const ids=Array.from(selectedIds);if(!ids.length)return;await fetch("/api/email/threads",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({thread_ids:ids,action})});const m:Record<string,string>={trash:"Moved to trash",star:"Starred",unstar:"Unstarred",mark_read:"Marked read",mark_unread:"Marked unread",spam:"Moved to spam"};showToast(m[action]||"Done");exitSelect();load();};
  const handlePointerDown=(tid:string)=>{longPressTriggered.current=false;longPressTimer.current=setTimeout(()=>{longPressTriggered.current=true;enterSelect(tid);},500);};
  const handlePointerUp=()=>{clearTimeout(longPressTimer.current);};
  const handleThreadClick=(t:Thread)=>{if(longPressTriggered.current){longPressTriggered.current=false;return;}if(selectMode){toggleSelect(t.thread_id);}else{openThread(t);}};

  // ═══ COMPOSE — Full Screen ═══
  if(view==="compose"&&!isDesktop){
    return(
      <div style={{position:"fixed",inset:0,zIndex:60,background:C.bg,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
          <button onClick={()=>setView(sel?"thread":"list")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,fontSize:22}}>✕</button>
          <h2 style={{flex:1,fontSize:17,fontWeight:600,color:C.text,margin:0}}>{composeMode==="reply"?"Reply":composeMode==="forward"?"Forward":"Compose"}</h2>
          <button onClick={handleSend} disabled={sending||!composeTo||!composeSubject} style={{padding:"8px 22px",background:sending||!composeTo||!composeSubject?C.dim:C.terra,color:"#fff",border:"none",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:700}}>{sending?"...":"Send"}</button>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch" as any}}>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.dim,fontSize:15,width:55}}>To</span>
            <input value={composeTo} onChange={e=>setComposeTo(e.target.value)} placeholder="Recipient" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:15,color:C.text,fontFamily:"inherit"}}/>
            {!showCC&&<button onClick={()=>setShowCC(true)} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:13}}>Cc</button>}
          </div>
          {showCC&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.dim,fontSize:15,width:55}}>Cc</span>
            <input value={composeCC} onChange={e=>setComposeCC(e.target.value)} style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:15,color:C.text,fontFamily:"inherit"}}/>
          </div>}
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.dim,fontSize:15,width:55}}>Subject</span>
            <input value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} placeholder="Subject" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:15,color:C.text,fontFamily:"inherit"}}/>
          </div>
          <Toolbar editor={editor}/>
          <EditorContent editor={editor} style={{minHeight:250,padding:"14px 16px",fontSize:15,lineHeight:1.6,color:C.text}}/>
        </div>
      </div>
    );
  }

  // ═══ THREAD — Full Screen, Edge-to-Edge Body ═══
  if(view==="thread"&&sel&&!isDesktop){
    return(
      <div style={{position:"fixed",inset:0,zIndex:60,background:C.bg,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"8px 8px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <button onClick={()=>{setView("list");setSel(null);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:8,fontSize:22}}>←</button>
          <div style={{flex:1}}/>
          <button onClick={()=>threadAction("trash")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:8,fontSize:18}}>🗑️</button>
          <button onClick={()=>threadAction(sel.starred?"unstar":"star")} style={{background:"none",border:"none",cursor:"pointer",padding:8,fontSize:18}}>{sel.starred?"⭐":"☆"}</button>
        </div>
        <div style={{padding:"14px 16px 8px"}}>
          <h1 style={{fontSize:20,fontWeight:700,color:C.text,margin:0,lineHeight:1.3}}>{sel.subject}</h1>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch" as any}}>
          {msgs.length===0?<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading...</div>
          :msgs.map(msg=>{const out=msg.direction==="outbound";const sender=msg.from_email.split("@")[0];return(
            <div key={msg.id} style={{borderBottom:`1px solid ${C.border}`,marginBottom:0}}>
              {/* Sender header — full width, no card padding */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px"}}>
                <div style={{width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,flexShrink:0,background:avatarColor(msg.from_email)+"30",color:avatarColor(msg.from_email)}}>{(sender[0]||"?").toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:15,fontWeight:600,color:C.text}}>{out?"You":sender}</span>
                    <span style={{fontSize:12,color:C.dim}}>{timeAgo(msg.created_at)}</span>
                  </div>
                  <MsgDetails msg={msg}/>
                </div>
                <button onClick={()=>startCompose("reply",msg)} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:8,fontSize:18}}>↩</button>
                <MsgMenu msg={msg} onReply={()=>startCompose("reply",msg)} onForward={()=>startCompose("forward",msg)}/>
              </div>
              {/* Email body — EDGE TO EDGE, no side padding */}
              <div style={{overflow:"hidden"}}>
                <EmailBody html={msg.body_html} text={msg.body_text}/>
              </div>
              {/* Attachments */}
              {msg.attachments?.length>0&&(
                <div style={{padding:"0 16px 12px"}}>
                  <div style={{border:`1px solid ${C.border2}`,borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"8px 14px",background:"rgba(255,255,255,0.02)",borderBottom:`1px solid ${C.border}`,fontSize:13,color:C.dim}}>📎 {msg.attachments.length} attachment{msg.attachments.length>1?"s":""}</div>
                    {msg.attachments.map(a=>(
                      <a key={a.id} href={a.s3_url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,textDecoration:"none",color:C.muted}}>
                        <span style={{fontSize:18}}>{a.content_type.startsWith("image/")?"🖼️":a.content_type==="application/pdf"?"📄":"📎"}</span>
                        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.filename}</div><div style={{fontSize:11,color:C.dim}}>{fmtSize(a.size_bytes)}</div></div>
                        <span style={{color:C.dim}}>⬇</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>);
          })}
          <div ref={msgEnd}/>
        </div>
        {/* Reply bar */}
        <div style={{display:"flex",gap:10,padding:"12px 16px",borderTop:`1px solid ${C.border}`,flexShrink:0,paddingBottom:"calc(12px + env(safe-area-inset-bottom))"}}>
          <button onClick={()=>startCompose("reply",msgs[msgs.length-1])} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:14,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border2}`,borderRadius:24,color:C.muted,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>↩ Reply</button>
          <button onClick={()=>startCompose("forward",msgs[msgs.length-1])} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:14,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border2}`,borderRadius:24,color:C.muted,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>⤻ Forward</button>
        </div>
      </div>
    );
  }

  // ═══ SIDEBAR OVERLAY ═══
  const SidebarPanel=()=>(
    <div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,zIndex:60}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:0,left:0,bottom:0,width:"82%",maxWidth:300,background:C.bg2,display:"flex",flexDirection:"column",animation:"slideIn .25s ease-out"}}>
        <div style={{padding:"20px 20px 16px"}}><span style={{fontSize:20,fontWeight:700,color:C.terra,fontFamily:"'DM Serif Display',serif"}}>Palm Art Mail</span></div>
        <nav style={{flex:1,overflowY:"auto",padding:"0 8px"}}>
          {FOLDERS.map(f=>(
            <button key={f.key} onClick={()=>{setFolder(f.key);setSidebar(false);setSel(null);setView("list");}} style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"14px 16px",borderRadius:24,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:folder===f.key?600:400,background:folder===f.key?"rgba(196,125,90,0.1)":"transparent",color:folder===f.key?C.terra:C.muted,marginBottom:2}}>
              <span style={{fontSize:20}}>{f.icon}</span><span style={{flex:1,textAlign:"left"}}>{f.label}</span>
              {(fc[f.key]||0)>0&&<span style={{fontSize:14,fontWeight:600}}>{fc[f.key]}</span>}
            </button>
          ))}
        </nav>
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );

  // ═══ DESKTOP LAYOUT ═══
  const desktopHeader = sel && msgs.length > 0 ? (
    <>
      <button onClick={()=>{setSel(null);setMsgs([]);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,fontSize:18}}>←</button>
      <h2 style={{flex:1,fontSize:15,fontWeight:600,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.subject}</h2>
      <button onClick={()=>startCompose("reply",msgs[msgs.length-1])} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:6,fontSize:14}} title="Reply">↩</button>
      <button onClick={()=>startCompose("forward",msgs[msgs.length-1])} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:6,fontSize:14}} title="Forward">⤻</button>
      <button onClick={()=>threadAction("trash")} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:6,fontSize:14}} title="Trash">🗑️</button>
    </>
  ) : (
    <>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:"rgba(255,255,255,0.02)",borderRadius:20,border:`1px solid ${C.border}`,maxWidth:500}}>
        <span style={{color:C.dim,fontSize:14}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mail..." style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:C.text,fontFamily:"inherit"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12}}>✕</button>}
      </div>
      <button onClick={()=>{sync().then(()=>load());}} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:6,fontSize:14}} title="Refresh">🔄</button>
    </>
  );

  let desktopContent;
  if(view==="compose"){
    desktopContent = (
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{maxWidth:650,margin:"0 auto",padding:24}}>
          <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:`1px solid ${C.border}`}}>
              <h3 style={{fontSize:15,fontWeight:600,color:C.text,margin:0}}>{composeMode==="reply"?"Reply":composeMode==="forward"?"Forward":"New Message"}</h3>
              <button onClick={()=>setView("list")} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:14}}>✕</button>
            </div>
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{color:C.dim,fontSize:13,width:50}}>To</span><input value={composeTo} onChange={e=>setComposeTo(e.target.value)} placeholder="recipient@email.com" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:C.text,fontFamily:"inherit",padding:"4px 0"}}/></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:C.dim,fontSize:13,width:50}}>Subject</span><input value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} placeholder="Subject" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:C.text,fontFamily:"inherit",padding:"4px 0"}}/></div>
            </div>
            <EditorContent editor={editor} style={{minHeight:300,padding:"16px 20px",fontSize:14,lineHeight:1.6,color:C.text}}/>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderTop:`1px solid ${C.border}`}}>
              <button onClick={handleSend} disabled={sending} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 24px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,background:`linear-gradient(135deg,${C.terra},${C.gold})`,color:"#000"}}>{sending?"Sending...":"📨 Send"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if(sel&&msgs.length>0){
    desktopContent = (
      <div style={{flex:1,overflowY:"auto"}}>
        {msgs.map(msg=>{const out=msg.direction==="outbound";const sender=msg.from_email.split("@")[0];return(
          <div key={msg.id} style={{borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px"}}>
              <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0,background:avatarColor(msg.from_email)+"30",color:avatarColor(msg.from_email)}}>{(sender[0]||"?").toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,fontWeight:600,color:C.text}}>{out?"You":sender}</span>
                  <span style={{fontSize:12,color:C.dim}}>&lt;{msg.from_email}&gt;</span>
                  <span style={{fontSize:12,color:C.dim}}>{timeAgo(msg.created_at)}</span>
                </div>
                <MsgDetails msg={msg}/>
              </div>
              <button onClick={()=>startCompose("reply",msg)} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,padding:6,fontSize:14}}>↩</button>
              <MsgMenu msg={msg} onReply={()=>startCompose("reply",msg)} onForward={()=>startCompose("forward",msg)}/>
            </div>
            <EmailBody html={msg.body_html} text={msg.body_text}/>
            {msg.attachments?.length>0&&(
              <div style={{padding:"8px 20px 12px"}}>{msg.attachments.map(a=><a key={a.id} href={a.s3_url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",marginRight:8,background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border2}`,borderRadius:8,textDecoration:"none",color:C.muted,fontSize:13}}><span>{a.content_type.startsWith("image/")?"🖼️":"📎"}</span>{a.filename}<span style={{color:C.dim}}>({fmtSize(a.size_bytes)})</span></a>)}</div>
            )}
          </div>);
        })}
        <div style={{display:"flex",gap:10,padding:"12px 20px"}}>
          <button onClick={()=>startCompose("reply",msgs[msgs.length-1])} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:20,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>↩ Reply</button>
          <button onClick={()=>startCompose("forward",msgs[msgs.length-1])} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:20,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>⤻ Forward</button>
        </div>
      </div>
    );
  } else {
    desktopContent = (
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{padding:"8px 20px 4px",fontSize:13,color:C.dim,fontWeight:500,textTransform:"capitalize"}}>{folder}</div>
        {loading?<div style={{textAlign:"center",padding:60,color:C.muted}}>Syncing...</div>
        :filtered.length===0?<div style={{textAlign:"center",padding:60,color:C.dim}}><div style={{fontSize:40,marginBottom:12,opacity:0.15}}>✉️</div><p style={{fontSize:15}}>No emails</p></div>
        :filtered.map(t=>{const name=(folder==="sent"?t.to_email:t.from_email).split("@")[0];return(
          <button key={t.thread_id} onClick={()=>openThread(t)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 20px",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:t.unread_count>0?"rgba(196,125,90,0.015)":"transparent",fontFamily:"inherit",textAlign:"left",height:42}}>
            <span style={{fontSize:14,color:t.starred?"#C47D5A":"rgba(255,255,255,0.08)",cursor:"pointer"}} onClick={e=>{e.stopPropagation();setSel(t);threadAction(t.starred?"unstar":"star");}}>{t.starred?"★":"☆"}</span>
            <span style={{width:130,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:14,fontWeight:t.unread_count>0?700:400,color:t.unread_count>0?C.text:"rgba(255,255,255,0.5)"}}>{name}{t.message_count>1?` (${t.message_count})`:""}</span>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,minWidth:0}}>
              <span style={{flexShrink:0,fontSize:14,fontWeight:t.unread_count>0?600:400,color:t.unread_count>0?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.4)"}}>{t.subject}</span>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.15)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}> — {t.latest_body_preview}</span>
            </div>
            <span style={{flexShrink:0,fontSize:12,color:t.unread_count>0?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.15)"}}>{timeAgo(t.latest_message)}</span>
          </button>);
        })}
      </div>
    );
  }

  if(isDesktop){
    return(
      <div style={{display:"flex",height:"calc(100vh - 130px)",background:C.bg2,borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,position:"relative"}}>
        {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:C.bg3,border:`1px solid rgba(196,125,90,0.3)`,color:C.terra,padding:"10px 20px",borderRadius:20,fontSize:14}}>{toast}</div>}
        <div style={{width:200,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",background:C.bg,flexShrink:0}}>
          <div style={{padding:12}}><button onClick={()=>startCompose("new")} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:12,background:`linear-gradient(135deg,${C.terra},${C.gold})`,color:"#000",border:"none",borderRadius:16,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>✏️ Compose</button></div>
          <nav style={{flex:1,overflowY:"auto",padding:"0 6px"}}>
            {FOLDERS.map(f=><button key={f.key} onClick={()=>{setFolder(f.key);setSel(null);setMsgs([]);setView("list");}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 14px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,background:folder===f.key?"rgba(196,125,90,0.1)":"transparent",color:folder===f.key?C.terra:C.muted,fontWeight:folder===f.key?600:400,marginBottom:1}}>
              <span style={{fontSize:16}}>{f.icon}</span><span style={{flex:1,textAlign:"left"}}>{f.label}</span>
              {(fc[f.key]||0)>0&&f.key!=="sent"&&<span style={{fontSize:12,fontWeight:600}}>{fc[f.key]}</span>}
            </button>)}
          </nav>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}>
            {desktopHeader}
          </div>
          {desktopContent}
        </div>
      </div>
    );
  }

  // ═══ MOBILE LIST VIEW ═══
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:C.bg,position:"relative"}}>
      {sidebar&&<SidebarPanel/>}
      {toast&&<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:9999,padding:"10px 20px",background:C.bg3,border:`1px solid rgba(196,125,90,0.3)`,borderRadius:20,color:C.terra,fontSize:15}}>{toast}</div>}

      {/* Batch action bar — shown in select mode */}
      {selectMode?(<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:C.bg2}}>
        <button onClick={exitSelect} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:6,fontSize:20}}>✕</button>
        <span style={{fontSize:16,fontWeight:600,color:C.text}}>{selectedIds.size} selected</span>
        <button onClick={()=>{selectedIds.size===filtered.length?setSelectedIds(new Set()):setSelectedIds(new Set(filtered.map(t=>t.thread_id)));}} style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${C.border2}`,background:"none",color:C.dim,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{selectedIds.size===filtered.length?"None":"All"}</button>
        <div style={{flex:1}}/>
        <button onClick={()=>batchAction("mark_read")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:8,fontSize:16}} title="Mark read">📖</button>
        <button onClick={()=>batchAction("mark_unread")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:8,fontSize:16}} title="Mark unread">📩</button>
        <button onClick={()=>batchAction("star")} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:8,fontSize:16}} title="Star">⭐</button>
        <button onClick={()=>batchAction("trash")} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:8,fontSize:16}} title="Delete">🗑️</button>
      </div>):(
      /* Top bar */
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
        <button onClick={()=>setSidebar(true)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:8,fontSize:22}}>☰</button>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:C.bg3,borderRadius:24,border:`1px solid ${C.border}`}}>
          <span style={{color:C.dim,fontSize:16}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search in mail" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:15,color:C.text,fontFamily:"inherit"}}/>
        </div>
      </div>)}
      {!selectMode&&<div style={{padding:"4px 20px 8px"}}><span style={{fontSize:15,fontWeight:500,color:C.dim,textTransform:"capitalize"}}>{folder}</span></div>}
      {/* Thread list */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch" as any}}>
        {loading?<div style={{textAlign:"center",padding:60,color:C.muted}}>Syncing emails...</div>
        :filtered.length===0?<div style={{textAlign:"center",padding:60,color:C.dim}}><div style={{fontSize:44,opacity:0.1,marginBottom:12}}>✉️</div><p style={{fontSize:16}}>No emails in {folder}</p></div>
        :filtered.map(t=>{const sEmail=folder==="sent"?t.to_email:t.from_email;const name=sEmail.split("@")[0];const isSel=selectedIds.has(t.thread_id);return(
          <button key={t.thread_id} onPointerDown={()=>handlePointerDown(t.thread_id)} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onContextMenu={e=>{e.preventDefault();if(!selectMode)enterSelect(t.thread_id);}} onClick={()=>handleThreadClick(t)} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"14px 20px",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:isSel?"rgba(196,125,90,0.08)":t.unread_count>0?"rgba(196,125,90,0.015)":"transparent",fontFamily:"inherit",textAlign:"left"}}>
            {/* Avatar — tap to toggle select in select mode */}
            <div onClick={e=>{e.stopPropagation();if(selectMode){toggleSelect(t.thread_id);}else{enterSelect(t.thread_id);}}} style={{width:44,height:44,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0,transition:"all 0.15s",...(isSel?{border:`2px solid ${C.terra}`,background:"rgba(196,125,90,0.2)"}:selectMode?{border:"2px solid rgba(255,255,255,0.15)",background:"transparent"}:{background:avatarColor(sEmail)+"25",color:avatarColor(sEmail)})}}>
              {isSel?"✓":selectMode?" ":(name[0]||"?").toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16,fontWeight:t.unread_count>0?700:500,color:t.unread_count>0?C.text:"rgba(255,255,255,0.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                {t.message_count>1&&<span style={{fontSize:13,color:C.dim}}>{t.message_count}</span>}
                <span style={{flex:1}}/><span style={{fontSize:13,color:C.dim,flexShrink:0}}>{timeAgo(t.latest_message)}</span>
                {t.unread_count>0&&<div style={{width:10,height:10,borderRadius:"50%",background:C.terra,flexShrink:0}}/>}
              </div>
              <p style={{fontSize:15,fontWeight:t.unread_count>0?600:400,color:t.unread_count>0?C.text:"rgba(255,255,255,0.4)",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.subject}</p>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.2)",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.latest_body_preview}</p>
            </div>
            {!selectMode&&t.starred&&<span style={{fontSize:16,marginTop:4,flexShrink:0}}>⭐</span>}
          </button>);
        })}
      </div>
      {!selectMode&&<button onClick={()=>startCompose("new")} style={{position:"fixed",bottom:80,right:20,zIndex:30,display:"flex",alignItems:"center",gap:8,padding:"16px 24px",background:C.bg3,border:`1px solid rgba(196,125,90,0.2)`,borderRadius:16,color:C.terra,fontSize:15,fontWeight:700,fontFamily:"inherit",cursor:"pointer",boxShadow:"0 4px 20px rgba(0,0,0,0.4)",marginBottom:"env(safe-area-inset-bottom)"}}>✏️ Compose</button>}
      <style>{`.ProseMirror{outline:none;min-height:120px;} .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;color:${C.dim};pointer-events:none;height:0;}`}</style>
    </div>
  );
}
