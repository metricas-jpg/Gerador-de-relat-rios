(function(){
"use strict";
/* ================= constantes ================= */
const NETS=[["imprensa","Imprensa","#49479D"],["instagram","Instagram","#00AE9D"],["x","X/Twitter","#003641"],["facebook","Facebook","#7DB61C"],["linkedin","LinkedIn","#C9D200"],["youtube","YouTube","#D98F2B"]];
const RISCO={"Baixo":"#5E9E1E","Médio":"#C77700","Alto":"#B03A3A"};
const STATUS=["Sinais","Fase aguda","Em desdobramento","Controlado","Encerrado"];
const TEND={"subindo":"↑ SUBINDO","estavel":"→ ESTÁVEL","caindo":"↓ CAINDO"};
const PROTAG=["Protagonista","Parte envolvida","Citação incidental","Sem menção"];
const TL={negativa:["Negativa","#B03A3A",1],neutra:["Neutra","#7A8A90",1],positiva:["Positiva","#5E9E1E",1],aclass:["A classificar","#C5CED0",1],contexto:["Contexto (sem menção ao Sicoob)","",0],proximo:["Próximo marco","",0]};
const TOM=["Negativa","Neutra","Positiva"];
const RESP=["Nota","Entrevista","Sem resposta"];
const PSTAT=["Em aberto","Respondido","Encerrado"];
const CLIENT=Math.random().toString(36).slice(2);

function blank(){return{
  meta:{area:"Presidência - Superintendência Negócios Digitais, Marketing e Experiência do Cooperado",tipo:"Relatório de monitoramento de crise",titulo:"",singular:"",inicio:"",edicao:"",periodoIni:"",periodoFim:"",atualizacao:"",rodape:"Documento interno · Sicoob — não redistribuir fora do ambiente autorizado."},
  risco:{nivel:"",tend:"estavel",desc:""},status:{nivel:"",tend:"estavel",desc:""},
  novas:{qtd:"",ultima:""},gerais:"",
  mudou:{destaque:"",texto:""},significa:{protag:"",texto:""},
  diario:[],timeline:[],
  imprensa:{nenhum:false,rows:[],leitura:""},
  contexto:{revisao:"",manchete:"",papel:"",centro:"",gatilhos:[]},
  anexos:[],logo:null};}

/* ================= estado ================= */
let S=blank(), curId=null;
let list=[], saveTimer=null, saving=false, dirty=false, lastSaved=null;

/* ================= utilidades ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const P=(t)=>`<span class="ph">${t||"[__]"}</span>`;
const v=(x,t)=>(x===""||x==null)?P(t):esc(x);
function getP(o,p){return p.split(".").reduce((a,k)=>a==null?a:a[k],o)}
function setP(o,p,val){const ks=p.split(".");let a=o;for(let i=0;i<ks.length-1;i++)a=a[ks[i]];a[ks[ks.length-1]]=val}
function pd(n){return String(n).padStart(2,"0")}
function dmy(iso){if(!iso)return"";const[y,m,d]=iso.slice(0,10).split("-");return`${d}/${m}/${y}`}
function dm(iso){if(!iso)return"";const[,m,d]=iso.slice(0,10).split("-");return`${d}/${m}`}
function hh(iso){if(!iso||iso.length<16)return"";const h=iso.slice(11,13),mi=iso.slice(14,16);return mi==="00"?`${h}h`:`${h}h${mi}`}
function dmyh(iso){return iso?`${dmy(iso)}, ${hh(iso)}`:""}
function dmh(iso){return iso?`${dm(iso)}, ${hh(iso)}`:""}
function num(x){const n=Number(x);return isFinite(n)?n:0}
function rich(t){return esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>")}

/* ================= formulário ================= */
function F(label,path,type,opt){opt=opt||{};const id="f_"+path.replace(/\./g,"_");const val=getP(S,path);const w=opt.wide?' style="grid-column:1/-1"':"";
  let ctl;
  if(type==="textarea")ctl=`<textarea id="${id}" data-path="${path}" rows="${opt.rows||3}" placeholder="${esc(opt.ph||"")}">${esc(val)}</textarea>`;
  else if(type==="select")ctl=`<select id="${id}" data-path="${path}"><option value="">Selecionar…</option>${opt.options.map(o=>{const[k,l]=Array.isArray(o)?o:[o,o];return`<option value="${esc(k)}"${k===val?" selected":""}>${esc(l)}</option>`}).join("")}</select>`;
  else ctl=`<input id="${id}" data-path="${path}" type="${type}" value="${esc(val)}" placeholder="${esc(opt.ph||"")}"${type==="number"?' min="0" inputmode="numeric"':""}>`;
  return`<div class="f" data-f="${path}"${w}><label for="${id}">${esc(label)}</label>${ctl}${opt.hint?`<span class="hint">${opt.hint}</span>`:""}</div>`}
function sec(id,pg,title,body,open){return`<details class="sec" id="s_${id}"${open?" open":""}><summary><span class="sec-pg">${pg}</span><span class="sec-t">${title}</span><span class="sec-n" data-cnt="${id}" hidden></span></summary><div class="sec-body">${body}</div></details>`}

function renderForm(){
  const openIds=[...document.querySelectorAll("details.sec[open]")].map(d=>d.id);
  const first=!document.querySelector("details.sec");
  const tendO=[["subindo","↑ Subindo"],["estavel","→ Estável"],["caindo","↓ Caindo"]];
  let h="";
  h+=sec("capa","Pág. 1","Cabeçalho",`
    ${F("Título do caso","meta.titulo","text",{ph:"Ex.: Recuperação judicial da Apex Partners"})}
    <div class="grid2">${F("Singular / unidade","meta.singular","text",{ph:"Ex.: Sicoob ES"})}${F("Edição nº","meta.edicao","number")}</div>
    <div class="grid2">${F("Início do monitoramento","meta.inicio","date")}${F("Última atualização","meta.atualizacao","datetime-local")}</div>
    <div class="grid2">${F("Período: de","meta.periodoIni","datetime-local")}${F("Período: até","meta.periodoFim","datetime-local")}</div>
    ${F("Área responsável (topo da capa)","meta.area","text")}
    ${F("Tipo de relatório","meta.tipo","text")}
    <div class="f"><span class="lbl">Logo</span><div class="check">${S.logo?`<img src="${esc(S.logo.url)}" alt="" style="height:28px;background:#003641;padding:3px;border-radius:4px"> <button class="btn small" data-act="logo-rm">Remover</button>`:`<span class="hint">Sem logo enviado: a capa usa a marca em texto.</span>`}<label class="btn small" style="margin-left:auto">Enviar logo<input type="file" accept="image/*" data-up="logo" hidden></label></div><span class="hint">Use a versão para fundo escuro (PNG com transparência).</span></div>`,first||openIds.includes("s_capa"));

  h+=sec("ind","Pág. 1","Risco, status e indicadores",`
    <div class="sub">Risco para a instituição</div>
    <div class="grid2">${F("Nível","risco.nivel","select",{options:Object.keys(RISCO)})}${F("Tendência","risco.tend","select",{options:tendO})}</div>
    ${F("Justificativa","risco.desc","textarea",{rows:2,hint:"O nível de risco define a frequência de monitoramento."})}
    <div class="sub">Status da crise</div>
    <div class="grid2">${F("Status","status.nivel","select",{options:STATUS})}${F("Tendência","status.tend","select",{options:tendO})}</div>
    ${F("Descrição","status.desc","textarea",{rows:2})}
    <div class="sub">Indicadores</div>
    <div class="grid2">${F("Novas menções ao Sicoob","novas.qtd","number")}${F("Última menção","novas.ultima","text",{ph:"Ex.: 04/10 (ES Hoje)"})}</div>
    ${F("Menções gerais ao tema nesta edição","gerais","number")}
    <p class="hint">Menções acumuladas e acionamentos de imprensa são calculados a partir das tabelas de menções por dia e de acionamentos.</p>`,openIds.includes("s_ind"));

  h+=sec("txt","Pág. 1","O que mudou e o que significa",`
    ${F("Frase de abertura (em negrito)","mudou.destaque","text",{ph:"Ex.: Sem fatos novos desde a edição anterior."})}
    ${F("O que mudou","mudou.texto","textarea",{rows:4})}
    ${F("Protagonismo do Sicoob","significa.protag","select",{options:PROTAG})}
    ${F("O que significa para o Sicoob","significa.texto","textarea",{rows:4,hint:"Use **texto** para negrito."})}`,openIds.includes("s_txt"));

  h+=sec("graf","Pág. 1","Menções ao Sicoob por dia",`<p class="hint">Uma linha por dia de coleta. O gráfico e o total acumulado por rede são montados a partir desta tabela.</p><div id="dailyBox"></div>`,openIds.includes("s_graf"));
  h+=sec("tl","Pág. 2","Linha do tempo das menções",`<p class="hint">Ordem de cima para baixo, como sai no relatório (mais recente no topo).</p><div id="tlBox" style="display:grid;gap:10px"></div>`,openIds.includes("s_tl"));
  h+=sec("pr","Pág. 2","Acionamentos de imprensa",`<label class="check"><input type="checkbox" data-path="imprensa.nenhum" id="f_imprensa_nenhum"${S.imprensa.nenhum?" checked":""}> Nenhum acionamento no período</label><div id="prBox" style="display:grid;gap:10px"></div>${F("Leitura","imprensa.leitura","textarea",{rows:2,hint:"Uma ou duas frases: os veículos estão procurando o Sicoob ou só citando? Algum pedido indica mudança de enfoque?"})}`,openIds.includes("s_pr"));
  h+=sec("ctx","Pág. 3","Contexto do caso",`
    <p class="hint">Texto de referência: escrito na abertura do caso e revisado só quando o papel do Sicoob mudar. É mantido de uma edição para outra.</p>
    ${F("Data da última revisão","contexto.revisao","date")}
    ${F("Mensagem principal","contexto.manchete","textarea",{rows:2})}
    ${F("Papel do Sicoob","contexto.papel","textarea",{rows:4})}
    ${F("Quem está no centro da pauta","contexto.centro","textarea",{rows:4})}
    <div class="sub">Gatilhos de escalada</div><div id="gtBox" style="display:grid;gap:8px"></div>`,openIds.includes("s_ctx"));
  h+=sec("an","Anexo","Registro de publicações",`<p class="hint">Cada publicação vira uma página no anexo. Se a matéria tiver vários prints, cada um vira uma parte ("Parte 2 de 3").</p><div id="anBox" style="display:grid;gap:12px"></div>`,openIds.includes("s_an"));
  $("#form").innerHTML=h;
  renderDaily();renderTL();renderPress();renderGat();renderAn();markMissing();
}

function btnRow(kind,i,n){return`<button class="btn small ghost" data-act="up" data-k="${kind}" data-i="${i}" ${i===0?"disabled":""} aria-label="Subir">↑</button><button class="btn small ghost" data-act="down" data-k="${kind}" data-i="${i}" ${i===n-1?"disabled":""} aria-label="Descer">↓</button><button class="btn small ghost danger" data-act="del" data-k="${kind}" data-i="${i}">Remover</button>`}

function renderDaily(){
  const rows=S.diario;
  let h=`<div class="daily"><table><thead><tr><th>Dia</th>${NETS.map(n=>`<th>${n[1]}</th>`).join("")}<th>Total</th><th></th></tr></thead><tbody>`;
  rows.forEach((r,i)=>{h+=`<tr><td><input type="date" data-path="diario.${i}.data" value="${esc(r.data)}" aria-label="Dia"></td>${NETS.map(n=>`<td><input type="number" min="0" inputmode="numeric" data-path="diario.${i}.${n[0]}" value="${esc(r[n[0]])}" aria-label="${n[1]}"></td>`).join("")}<td class="tot" data-tot="${i}">${NETS.reduce((a,n)=>a+num(r[n[0]]),0)}</td><td><button class="btn small ghost danger" data-act="del" data-k="diario" data-i="${i}" aria-label="Remover dia">×</button></td></tr>`});
  h+=`</tbody></table></div><div><button class="btn small" data-act="add" data-k="diario">+ Adicionar dia</button></div>`;
  $("#dailyBox").innerHTML=h;
}
function renderTL(){
  const n=S.timeline.length;
  $("#tlBox").innerHTML=S.timeline.map((t,i)=>`<div class="item"><div class="item-h"><b>Item ${i+1}</b><span class="sp"></span>${btnRow("timeline",i,n)}</div>
    <div class="grid2">${F("Data (como aparece)","timeline."+i+".data","text",{ph:"Ex.: 03/10 ou 09 a 13/08"})}${F("Tipo","timeline."+i+".tipo","select",{options:Object.entries(TL).map(([k,a])=>[k,a[0]])})}</div>
    ${F("Descrição","timeline."+i+".texto","textarea",{rows:2})}</div>`).join("")+`<div><button class="btn small" data-act="add" data-k="timeline">+ Adicionar item</button></div>`;
}
function renderPress(){
  const n=S.imprensa.rows.length;
  $("#prBox").innerHTML=S.imprensa.nenhum?`<p class="hint">O relatório vai mostrar "Nenhum acionamento no período".</p>`:S.imprensa.rows.map((r,i)=>`<div class="item"><div class="item-h"><b>Acionamento ${i+1}</b><span class="sp"></span>${btnRow("press",i,n)}</div>
    <div class="grid3">${F("Data","imprensa.rows."+i+".data","date")}${F("Veículo","imprensa.rows."+i+".veiculo","text")}${F("Jornalista","imprensa.rows."+i+".jornalista","text")}</div>
    ${F("Demanda","imprensa.rows."+i+".demanda","textarea",{rows:2,ph:"O que foi perguntado"})}
    <div class="grid3">${F("Prazo","imprensa.rows."+i+".prazo","datetime-local")}${F("Resposta","imprensa.rows."+i+".resposta","select",{options:RESP})}${F("Status","imprensa.rows."+i+".status","select",{options:PSTAT})}</div></div>`).join("")+`<div><button class="btn small" data-act="add" data-k="press">+ Adicionar acionamento</button></div>`;
}
function renderGat(){
  const n=S.contexto.gatilhos.length;
  $("#gtBox").innerHTML=S.contexto.gatilhos.map((g,i)=>`<div class="item" style="gap:6px"><div class="f"><input aria-label="Gatilho ${i+1}" data-path="contexto.gatilhos.${i}.texto" value="${esc(g.texto)}"></div>
    <div class="item-h"><label class="check"><input type="checkbox" data-path="contexto.gatilhos.${i}.acionado"${g.acionado?" checked":""}> Acionado nesta edição</label><span class="sp"></span>${btnRow("gat",i,n)}</div></div>`).join("")+`<div><button class="btn small" data-act="add" data-k="gat">+ Adicionar gatilho</button></div>`;
}
function renderAn(){
  const n=S.anexos.length;
  $("#anBox").innerHTML=S.anexos.map((a,i)=>`<div class="item"><div class="item-h"><b>Publicação ${i+1}</b><span class="sp"></span>${btnRow("an",i,n)}</div>
    <div class="grid2">${F("Rede","anexos."+i+".rede","select",{options:NETS.map(x=>x[1])})}${F("Veículo · editoria","anexos."+i+".veiculo","text",{ph:"Ex.: ES Hoje · Economia"})}</div>
    ${F("Título da publicação","anexos."+i+".titulo","textarea",{rows:2})}
    <div class="grid2">${F("Publicação","anexos."+i+".pub","date")}${F("Coleta","anexos."+i+".coleta","datetime-local")}</div>
    <div class="grid2">${F("Autoria","anexos."+i+".autoria","text")}${F("Link","anexos."+i+".link","url",{ph:"https://"})}</div>
    <div class="grid3">${F("Protagonismo","anexos."+i+".protag","select",{options:PROTAG})}${F("Tonalidade","anexos."+i+".tom","select",{options:TOM})}${F("Onde o Sicoob aparece","anexos."+i+".posicao","text",{ph:"Ex.: parte 3 de 3"})}</div>
    ${F("O que a publicação diz sobre o Sicoob","anexos."+i+".resumo","textarea",{rows:3})}
    ${F("Observação (rodapé do print)","anexos."+i+".nota","text",{ph:"Ex.: grafia usada pelo veículo"})}
    <div class="f"><span class="lbl">Prints (cada um vira uma parte)</span><div class="thumbs">${(a.prints||[]).map((p,k)=>`<div class="thumb"><img src="${esc(p.url)}" alt="Print ${k+1}"><div><span>Parte ${k+1}</span><button data-act="print-rm" data-i="${i}" data-j="${k}" aria-label="Remover print ${k+1}">×</button></div></div>`).join("")}</div>
    <div><label class="btn small">+ Enviar print<input type="file" accept="image/*" multiple data-up="print" data-i="${i}" hidden></label> <span class="hint">Print limpo, sem anúncios, com o trecho do Sicoob já marcado em amarelo.</span></div></div></div>`).join("")+`<div><button class="btn small" data-act="add" data-k="an">+ Adicionar publicação</button></div>`;
}

/* ================= pendências ================= */
function pend(){
  const out=[];const req=(path,label,pg,sec)=>{const x=getP(S,path);if(x===""||x==null)out.push({path,label,pg,sec})};
  req("meta.titulo","Título do caso","Pág. 1","capa");req("meta.singular","Singular / unidade","Pág. 1","capa");req("meta.edicao","Edição nº","Pág. 1","capa");
  req("meta.inicio","Início do monitoramento","Pág. 1","capa");req("meta.periodoIni","Período: de","Pág. 1","capa");req("meta.periodoFim","Período: até","Pág. 1","capa");req("meta.atualizacao","Última atualização","Pág. 1","capa");
  req("risco.nivel","Nível de risco","Pág. 1","ind");req("risco.desc","Justificativa do risco","Pág. 1","ind");req("status.nivel","Status da crise","Pág. 1","ind");req("status.desc","Descrição do status","Pág. 1","ind");
  req("novas.qtd","Novas menções ao Sicoob","Pág. 1","ind");req("gerais","Menções gerais ao tema","Pág. 1","ind");
  req("mudou.texto","O que mudou","Pág. 1","txt");req("significa.protag","Protagonismo","Pág. 1","txt");req("significa.texto","O que significa para o Sicoob","Pág. 1","txt");
  if(!S.diario.length)out.push({label:"Nenhum dia na tabela de menções",pg:"Pág. 1",sec:"graf"});
  S.diario.forEach((r,i)=>{if(!r.data)out.push({path:`diario.${i}.data`,label:`Dia sem data (linha ${i+1})`,pg:"Pág. 1",sec:"graf"})});
  S.timeline.forEach((t,i)=>{if(!t.tipo)out.push({path:`timeline.${i}.tipo`,label:`Linha do tempo: item ${i+1} sem tipo`,pg:"Pág. 2",sec:"tl"});else if(t.tipo==="aclass")out.push({path:`timeline.${i}.tipo`,label:`Linha do tempo: item ${i+1} a classificar`,pg:"Pág. 2",sec:"tl"});if(!t.texto)out.push({path:`timeline.${i}.texto`,label:`Linha do tempo: item ${i+1} sem descrição`,pg:"Pág. 2",sec:"tl"})});
  if(!S.imprensa.nenhum&&!S.imprensa.rows.length)out.push({path:"imprensa.nenhum",label:"Acionamentos: registre ou marque \"nenhum\"",pg:"Pág. 2",sec:"pr"});
  S.imprensa.rows.forEach((r,i)=>{["data","veiculo","demanda","status"].forEach(k=>{if(!r[k])out.push({path:`imprensa.rows.${i}.${k}`,label:`Acionamento ${i+1}: ${({data:"data",veiculo:"veículo",demanda:"demanda",status:"status"})[k]}`,pg:"Pág. 2",sec:"pr"})})});
  req("imprensa.leitura","Leitura dos acionamentos","Pág. 2","pr");
  req("contexto.manchete","Contexto: mensagem principal","Pág. 3","ctx");req("contexto.papel","Contexto: papel do Sicoob","Pág. 3","ctx");req("contexto.centro","Contexto: centro da pauta","Pág. 3","ctx");
  S.anexos.forEach((a,i)=>{[["titulo","título"],["pub","data de publicação"],["link","link"],["tom","tonalidade"],["resumo","o que diz sobre o Sicoob"]].forEach(([k,l])=>{if(!a[k])out.push({path:`anexos.${i}.${k}`,label:`Publicação ${i+1}: ${l}`,pg:"Anexo",sec:"an"})});if(!(a.prints||[]).length)out.push({label:`Publicação ${i+1}: sem print`,pg:"Anexo",sec:"an"})});
  return out;
}
function markMissing(){
  const p=pend();const set=new Set(p.map(x=>x.path).filter(Boolean));
  document.querySelectorAll(".f[data-f]").forEach(el=>el.classList.toggle("miss",set.has(el.dataset.f)));
  const cnt={};p.forEach(x=>cnt[x.sec]=(cnt[x.sec]||0)+1);
  document.querySelectorAll("[data-cnt]").forEach(el=>{const c=cnt[el.dataset.cnt]||0;el.hidden=!c;el.textContent=c+(c===1?" pendência":" pendências")});
  const b=$("#bPend");b.className="chip"+(p.length?"":" ok");b.textContent=p.length?`${p.length} pendência${p.length>1?"s":""}`:"Sem pendências";
  if(!$("#drawer").hidden&&$("#drawer").dataset.mode==="list")openDrawer("list");
  return p;
}
function openDrawer(mode){
  const p=pend();const d=$("#drawer");d.dataset.mode=mode;d.hidden=false;
  const items=p.map((x,i)=>`<li><button data-go="${i}"><span class="pg">${x.pg}</span>${esc(x.label)}</button></li>`).join("");
  if(mode==="pdf")d.innerHTML=`<h3>Há ${p.length} pendência${p.length>1?"s":""}</h3><p class="hint">Campos vazios saem no PDF como [__]. Você pode baixar assim mesmo ou completar antes.</p><div class="act"><button class="btn primary" data-act="pdf-go">Baixar assim mesmo</button><button class="btn" data-act="drawer-x">Revisar</button></div><ul>${items}</ul>`;
  else d.innerHTML=p.length?`<h3>Pendências</h3><p class="hint">Clique para ir ao campo.</p><ul>${items}</ul><div class="act"><button class="btn" data-act="drawer-x">Fechar</button></div>`:`<h3>Sem pendências</h3><p class="hint">Todos os campos obrigatórios estão preenchidos.</p><div class="act"><button class="btn" data-act="drawer-x">Fechar</button></div>`;
  d._p=p;
}
function goTo(x){
  $("#drawer").hidden=true;setView("form");
  const s=document.getElementById("s_"+x.sec);if(s)s.open=true;
  const el=x.path?document.querySelector(`[data-path="${x.path}"]`):s;
  if(el){el.scrollIntoView({block:"center",behavior:"smooth"});if(el.focus)setTimeout(()=>el.focus({preventScroll:true}),300)}
}

/* ================= páginas do relatório ================= */
function logoHtml(){return`<div class="logo">${S.logo?`<img src="${esc(S.logo.url)}" alt="Logo" crossorigin="anonymous">`:`<img src="/logo-sicoob.svg" alt="Sicoob" style="height:34px;width:136px">`}</div>`}
function foot(n){return`<div class="foot"><i>${esc(S.meta.rodape)}</i><span>${n}</span></div>`}
function minHdr(t){const m=S.meta;return`<div class="hdr min"><div class="t">${esc(t)}</div><div class="s">${v(m.titulo)} · ${v(m.singular)} · EDIÇÃO DE ${m.atualizacao?esc(dmyh(m.atualizacao)).toUpperCase():P("[dd/mm/aaaa, hh]")}</div>${logoHtml()}</div>`}
function totals(){const t={};NETS.forEach(n=>t[n[0]]=S.diario.reduce((a,r)=>a+num(r[n[0]]),0));t.all=NETS.reduce((a,n)=>a+t[n[0]],0);return t}
function sortedDaily(){return S.diario.filter(r=>r.data).slice().sort((a,b)=>a.data<b.data?-1:1)}

function page1(){
  const m=S.meta,t=totals(),days=sortedDaily();
  const since=days.find(r=>NETS.some(n=>num(r[n[0]])>0));
  const rc=RISCO[S.risco.nivel]||"#9AA7AA";
  const stc=S.status.nivel==="Encerrado"?"#5E9E1E":"#49479D";
  const pr=S.imprensa.rows, novos=pr.length, aberto=pr.filter(r=>r.status==="Em aberto").length;
  const accN=S.imprensa.nenhum?"0":(pr.length?`${novos}`:"");
  const max=Math.max(1,...days.map(r=>NETS.reduce((a,n)=>a+num(r[n[0]]),0)));
  const bars=days.map(r=>{const tot=NETS.reduce((a,n)=>a+num(r[n[0]]),0);
    return`<div class="bar"><div class="v">${tot}</div>${NETS.slice().reverse().map(n=>{const q=num(r[n[0]]);return q?`<div class="s" style="height:${(q/max*180).toFixed(1)}px;background:${n[2]}"></div>`:""}).join("")}</div>`}).join("");
  return`<div class="page">
  <div class="hdr"><div class="area">${v(m.area)}</div>${logoHtml()}
    <div class="eyebrow">${esc(m.tipo).toUpperCase()}</div>
    <h1>${v(m.titulo,"[Título do caso]")}</h1><div class="sing">${v(m.singular,"[Singular]")}</div>
    <div class="metaln">Início do monitoramento: ${m.inicio?dmy(m.inicio):P("[dd/mm/aaaa]")} &nbsp;·&nbsp; Edição nº ${v(m.edicao)} &nbsp;·&nbsp; Período: ${m.periodoIni?dmh(m.periodoIni):P("[dd/mm, hh]")} a ${m.periodoFim?dmyh(m.periodoFim):P("[dd/mm/aaaa, hh]")} &nbsp;·&nbsp; Última atualização: ${m.atualizacao?dmyh(m.atualizacao):P("[dd/mm/aaaa, hh]")}</div>
  </div>
  <div class="body">
    <div class="row2">
      <div class="card"><div class="k"><span>RISCO PARA A INSTITUIÇÃO</span><span>${TEND[S.risco.tend]||""}</span></div><div class="big" style="color:${rc}">${S.risco.nivel?esc(S.risco.nivel).toUpperCase():P("[NÍVEL]")}</div><div class="d">${v(S.risco.desc,"[Justificativa do risco]")}</div></div>
      <div class="card"><div class="k"><span>STATUS DA CRISE</span><span>${TEND[S.status.tend]||""}</span></div><div class="big" style="color:${stc};font-size:28px;margin-top:20px">${S.status.nivel?esc(S.status.nivel).toUpperCase():P("[STATUS]")}</div><div class="d">${v(S.status.desc,"[Descrição do status]")}</div></div>
    </div>
    <div class="kpis">
      <div class="kpi dark"><div class="k">NOVAS MENÇÕES<br>AO SICOOB</div><div class="n">${S.novas.qtd===""?"[__]":esc(S.novas.qtd)}</div><div class="c">${S.novas.ultima?"Última: "+esc(S.novas.ultima):"Última: [__]"}</div></div>
      <div class="kpi"><div class="k">MENÇÕES GERAIS<br>AO TEMA</div><div class="n${S.gerais===""?" ph":""}">${S.gerais===""?"[__]":esc(S.gerais)}</div><div class="c">nesta edição</div></div>
      <div class="kpi"><div class="k">MENÇÕES AO SICOOB ACUMULADAS</div><div class="acc"><div><div class="n">${t.all}</div><div class="c">${since?"desde "+dm(since.data):"sem registros"}</div></div>
        <div class="lg">${NETS.map(n=>`<span><i class="sw" style="background:${n[2]}"></i>${n[1]} <b>${t[n[0]]}</b></span>`).join("")}</div></div></div>
      <div class="kpi"><div class="k">ACIONAMENTOS<br>DE IMPRENSA</div><div class="n${accN===""?" ph":""}">${accN===""?"[__]":accN}</div><div class="c">${S.imprensa.nenhum?"nenhum no período":(pr.length?`novos · ${aberto} em aberto`:"novos · em aberto")}</div></div>
    </div>
    <div class="tx" style="margin-top:14px"><div class="l">O QUE MUDOU</div><div>${S.mudou.destaque?`<b>${esc(S.mudou.destaque)}</b> `:""}${S.mudou.texto?rich(S.mudou.texto):P("[O que mudou desde a edição anterior]")}</div></div>
    <div class="tx"><div class="l">O QUE SIGNIFICA<br>PARA O SICOOB<small>Protagonismo: ${S.significa.protag?esc(S.significa.protag.toLowerCase()):"[__]"}</small></div><div>${S.significa.texto?rich(S.significa.texto):P("[Leitura do impacto para o Sicoob]")}</div></div>
    <div class="chart-h"><b>MENÇÕES AO SICOOB POR DIA DE COLETA, POR REDE</b><i>O total acumulado (${t.all}) fica no indicador acima, fora do gráfico</i></div>
    <div class="legend">${NETS.map(n=>`<span><i class="sw" style="background:${n[2]};width:14px;height:14px;margin-right:8px"></i>${n[1]}</span>`).join("")}</div>
    ${days.length?`<div class="bars">${bars}</div><div class="xl">${days.map(r=>`<span>${dm(r.data)}</span>`).join("")}</div>`:`<div class="an-box" style="height:220px"><b>Sem dados</b>Adicione os dias de coleta na tabela de menções.</div>`}
    <div class="legnote"><b>Legenda.</b> Risco (define a frequência de monitoramento): Baixo · Médio · Alto. &nbsp;Status: Sinais · Fase aguda · Em desdobramento · Controlado · Encerrado. &nbsp;Protagonismo: Protagonista · Parte envolvida · Citação incidental · Sem menção.</div>
  </div>${foot(1)}</div>`;
}
function tlItems(){return S.timeline.map(t=>{const T=TL[t.tipo];const cls=t.tipo==="contexto"?"ctx":t.tipo==="proximo"?"next":"";
  let dot;if(t.tipo==="contexto")dot=`<i class="dot" style="border:1.5px solid #9AA7AA;background:#fff"></i>`;else if(t.tipo==="proximo")dot=`<i class="dot" style="border:2px solid #49479D;background:#fff"></i>`;else dot=`<i class="dot" style="background:${T?T[1]:"#C5CED0"}"></i>`;
  const tag=t.tipo==="aclass"?`<span style="color:#5D6D71">[A CLASSIFICAR]</span>`:(T&&T[2]?`<span style="color:${t.tipo==="neutra"?"#7A8A90":T[1]}">${T[0].toUpperCase()}</span>`:"");
  return`<div class="tl-it ${cls}"><div class="dt">${t.tipo==="proximo"?"Próximo":v(t.data,"[dd/mm]")}</div><span class="ln"></span><div class="dc">${dot}</div><div class="txt" style="padding-left:6px">${t.texto?rich(t.texto):P("[Descrição]")}${t.tipo==="proximo"&&t.data?` <b>[${esc(t.data)}]</b>`:""}</div><div class="tg">${tag}</div></div>`}).join("")}
function pressHtml(){const r=S.imprensa.rows;
  let h=`<div class="h2">ACIONAMENTOS DE IMPRENSA</div>`;
  if(S.imprensa.nenhum)h+=`<p style="font-size:13.5px;margin:0 0 6px"><b>Nenhum acionamento no período.</b></p>`;
  else if(!r.length)h+=`<p class="pnote">[A preencher. Sem pedidos no período, marque "Nenhum acionamento no período", que também é informação.]</p>`;
  if(!S.imprensa.nenhum)h+=`<table class="ptable"><thead><tr><th>Data</th><th>Veículo</th><th>Jornalista</th><th>Demanda</th><th>Prazo</th><th>Resposta</th><th>Status</th></tr></thead><tbody>${(r.length?r:[{}]).map(x=>`<tr><td>${x.data?dm(x.data):P("[dd/mm]")}</td><td>${v(x.veiculo,"[Veículo]")}</td><td>${v(x.jornalista,"[Nome]")}</td><td>${v(x.demanda,"[O que foi perguntado]")}</td><td>${x.prazo?dmh(x.prazo):P("[dd/mm, hh]")}</td><td>${v(x.resposta,"[Nota, entrevista ou sem resposta]")}</td><td>${v(x.status,"[Status]")}</td></tr>`).join("")}</tbody></table>`;
  h+=`<div class="leit"><b>LEITURA</b><div>${S.imprensa.leitura?rich(S.imprensa.leitura):P("[Uma ou duas frases: os veículos estão procurando o Sicoob ou só citando? Algum pedido indica mudança de enfoque?]")}</div></div>`;
  return h}
function page2parts(){
  const tl=`<div class="h2">LINHA DO TEMPO DAS MENÇÕES</div><div class="tl-leg"><b>Cita o Sicoob:</b><span><i class="dot" style="background:#B03A3A"></i>negativa</span><span><i class="dot" style="background:#7A8A90"></i>neutra</span><span><i class="dot" style="background:#5E9E1E"></i>positiva</span><span><i class="dot" style="border:1.5px solid #9AA7AA;background:#fff"></i>Sem menção ao Sicoob (contexto)</span><span><i class="dot" style="border:2px solid #49479D;background:#fff"></i>Próximo marco</span></div><div class="tl">${S.timeline.length?tlItems():`<p class="pnote">[Sem itens na linha do tempo]</p>`}</div>`;
  return{tl,press:pressHtml()};
}
function page3(n){const c=S.contexto;
  return`<div class="page">${minHdr("CONTEXTO DO CASO")}<div class="body" style="padding-top:30px">
  <div class="h2">ANÁLISE DO CASO</div><div class="ctx-ref">Texto de referência: escrito na abertura do caso e revisado só quando o papel do Sicoob mudar. &nbsp;Última revisão: ${c.revisao?dmy(c.revisao):"[dd/mm/aaaa]"}.</div>
  <div class="ctx-man">${c.manchete?rich(c.manchete):P("[Mensagem principal sobre a posição do Sicoob no caso]")}</div>
  <div class="row2"><div class="card ctx-c" style="padding:22px 24px 26px"><div class="k">PAPEL DO SICOOB</div><p>${c.papel?rich(c.papel):P("[Papel do Sicoob]")}</p></div><div class="card ctx-c" style="padding:22px 24px 26px"><div class="k">QUEM ESTÁ NO CENTRO DA PAUTA</div><p>${c.centro?rich(c.centro):P("[Atores no centro da cobertura]")}</p></div></div>
  <div class="trg"><div class="k">GATILHOS DE ESCALADA</div>${c.gatilhos.length?`<ul>${c.gatilhos.map(g=>`<li class="${g.acionado?"on":""}">${v(g.texto,"[Gatilho]")}${g.acionado?" — acionado nesta edição":""}</li>`).join("")}</ul>`:`<p class="pnote" style="margin-top:12px">[Sem gatilhos cadastrados]</p>`}</div>
  </div>${foot(n)}</div>`}
function annexPages(start){
  const out=[];const N=S.anexos.length;let pn=start;
  S.anexos.forEach((a,i)=>{const prints=a.prints||[];const parts=Math.max(1,prints.length);
    for(let k=0;k<parts;k++){const p=prints[k];
      const head=`<div class="an-top"><span class="pill">${esc((a.rede||"Imprensa").toUpperCase())}</span><span>Publicação ${i+1} de ${N} &nbsp;·&nbsp; Parte ${k+1} de ${parts}</span></div>`;
      let inner;
      if(k===0){inner=`${head}<div class="an-src">${v(a.veiculo,"[Veículo · editoria]")}</div><div class="an-t">${v(a.titulo,"[Título da publicação]")}</div>
        <div class="an-meta"><div><div class="k">PUBLICAÇÃO</div><div class="v">${a.pub?dmy(a.pub):P("[dd/mm/aaaa]")}</div></div><div><div class="k">COLETA</div><div class="v">${a.coleta?dmyh(a.coleta):P("[dd/mm/aaaa, hh]")}</div></div><div><div class="k">AUTORIA</div><div class="v">${v(a.autoria,"[Autoria]")}</div></div><div><div class="k">LINK</div><div class="v" style="font-weight:400;font-size:11.5px">${a.link?esc(a.link):`<i class="ph">[inserir link]</i>`}</div></div></div>
        <div class="an-tags"><span class="tag">PROTAGONISMO: ${a.protag?esc(a.protag).toUpperCase():"[__]"}</span><span class="tag g">TONALIDADE: ${a.tom?esc(a.tom).toUpperCase():"[__]"}</span>${a.posicao?`<span class="tag gr">SICOOB NA ${esc(a.posicao).toUpperCase()}</span>`:""}</div>
        <div class="an-sum"><div class="k">O QUE A ${a.rede&&a.rede!=="Imprensa"?"PUBLICAÇÃO":"MATÉRIA"} DIZ SOBRE O SICOOB</div><p>${a.resumo?rich(a.resumo):P("[Resumo do trecho que cita o Sicoob]")}</p></div>`;}
      else inner=`${head}<div class="an-src">${v(a.veiculo)}</div><div class="an-t" style="font-size:16px;margin-bottom:0">${v(a.titulo)}</div>`;
      const h=k===0?600:830;
      const img=p?`<div class="an-img" style="height:${h-(a.nota?20:0)}px"><img src="${esc(p.url)}" alt="" crossorigin="anonymous"></div>${a.nota?`<div style="font-size:10.5px;color:#5D6D71;margin-top:6px">${esc(a.nota)}</div>`:""}`
        :`<div class="an-box" style="height:${h}px"><b>${(a.rede||"Imprensa")==="Imprensa"?"MATÉRIA NA ÍNTEGRA":"PUBLICAÇÃO NA ÍNTEGRA"}</b>Nenhum print enviado.<br>Envie um print limpo, sem anúncios nem menus do site, com o trecho do Sicoob marcado em amarelo.${a.nota?`<br><br>${esc(a.nota)}`:""}</div>`;
      out.push(`<div class="page">${minHdr("ANEXO · REGISTRO DE PUBLICAÇÃO")}<div class="body">${inner}${img}</div>${foot(pn++)}</div>`);
    }});
  return out;
}
function buildPages(target){
  const pages=[page1()];
  const {tl,press}=page2parts();
  target.innerHTML=pages[0]+`<div class="page" id="__p2">${minHdr("EVOLUÇÃO · ACIONAMENTOS")}<div class="body" style="padding-top:30px"><div>${tl}</div><div style="margin-top:34px">${press}</div></div>${foot(2)}</div>`;
  // se a página 2 estourar, acionamentos vão para uma página própria
  const p2=target.querySelector("#__p2");const body=p2.querySelector(".body");
  let html=[pages[0]];let n=2;
  if(body.scrollHeight>1123-106-70){
    html.push(`<div class="page">${minHdr("EVOLUÇÃO · LINHA DO TEMPO")}<div class="body" style="padding-top:30px">${tl}</div>${foot(n++)}</div>`);
    html.push(`<div class="page">${minHdr("EVOLUÇÃO · ACIONAMENTOS")}<div class="body" style="padding-top:30px">${press}</div>${foot(n++)}</div>`);
  } else {html.push(`<div class="page">${minHdr("EVOLUÇÃO · ACIONAMENTOS")}<div class="body" style="padding-top:30px"><div>${tl}</div><div style="margin-top:34px">${press}</div></div>${foot(n++)}</div>`)}
  html.push(page3(n++));
  html=html.concat(annexPages(n));
  target.innerHTML=html.join("");
  return target.querySelectorAll(".page");
}
let prevT=null;
function renderPreview(){clearTimeout(prevT);prevT=setTimeout(()=>{
  const box=$("#prev");const tmp=document.createElement("div");buildPages(tmp);
  const W=box.clientWidth-32||600;const sc=Math.min(1,W/794);
  box.innerHTML="";[...tmp.children].forEach(pg=>{const w=document.createElement("div");w.className="pwrap";w.style.width=794*sc+"px";w.style.height=1123*sc+"px";pg.style.transform=`scale(${sc})`;w.appendChild(pg);box.appendChild(w)});
},120)}

/* ================= salvar / carregar (API do servidor) ================= */
let conflict=false;
function setSave(t){$("#saveSt").textContent=t}
function schedule(){dirty=true;if(conflict){setSave("Não salvo: há versão mais nova");return}setSave("Alterações não salvas");clearTimeout(saveTimer);saveTimer=setTimeout(flush,1200)}
async function api(method,url,body){
  const r=await fetch(url,{method,credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
  if(r.status===401){location.reload();const e=new Error("auth");e.code="sessão expirada";throw e}
  if(r.status===409){const e=new Error("conflict");e.code="conflict";throw e}
  if(!r.ok){const e=new Error("http");e.code="HTTP "+r.status;throw e}
  return r.status===204?null:r.json();
}
function payload(force){return{data:JSON.parse(JSON.stringify(S)),titulo:S.meta.titulo||"",singular:S.meta.singular||"",edicao:String(S.meta.edicao||""),atualizacao:S.meta.atualizacao||"",clientId:CLIENT,baseUpdatedAt:lastSaved,force:!!force}}
function showConflict(){conflict=true;setSave("Não salvo: há versão mais nova");
  banner("remote",`Outra pessoa salvou uma versão mais nova deste relatório. <button class="btn small" data-act="reload">Carregar a versão nova</button> <button class="btn small" data-act="force">Manter a minha e sobrescrever</button>`)}
async function flush(force){
  if(!curId)return;
  if(conflict&&!force)return;
  if(saving){clearTimeout(saveTimer);saveTimer=setTimeout(flush,600);return}
  saving=true;dirty=false;setSave("Salvando…");
  try{const r=await api("PUT","/api/monitor/relatorios/"+encodeURIComponent(curId),payload(force));
    lastSaved=r.updatedAt;conflict=false;banner("remote",null);banner("save",null);
    setSave("Salvo às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}));}
  catch(e){if(e.code==="conflict"){dirty=true;showConflict()}
    else{dirty=true;setSave("Não foi possível salvar");banner("save",`Não foi possível salvar (${esc(e.code||"sem conexão com o servidor")}). As alterações continuam na tela e serão enviadas na próxima tentativa.`)}}
  saving=false;if(dirty&&!conflict){saveTimer=setTimeout(flush,4000)}
}
function label(d){const x=d;return`${x.titulo||"Sem título"}${x.singular?" · "+x.singular:""}${x.edicao?" · Ed. "+x.edicao:""}${x.atualizacao?" · "+dmyh(x.atualizacao):""}`}
function renderPick(){const p=$("#pick");
  p.innerHTML=list.length?list.map(d=>`<option value="${esc(d.id)}"${d.id===curId?" selected":""}>${esc(label(d))}</option>`).join(""):`<option value="">Nenhum relatório ainda</option>`;
  p.disabled=!list.length;$("#bNext").disabled=!curId}
async function refreshList(){
  list=await api("GET","/api/monitor/relatorios");renderPick();
  const cur=list.find(x=>x.id===curId);
  if(cur&&lastSaved&&cur.updatedAt>lastSaved&&!saving&&cur.clientId!==CLIENT)showConflict();
}
async function openDoc(id){
  try{const d=await api("GET","/api/monitor/relatorios/"+encodeURIComponent(id));
    curId=id;conflict=false;dirty=false;banner("remote",null);
    S=Object.assign(blank(),d.data||{});lastSaved=d.updatedAt;
    renderForm();renderPreview();renderPick();setSave("Salvo");}
  catch(e){banner("load","Não foi possível abrir este relatório. Verifique a conexão com o servidor.")}
}
async function createDoc(data){
  const id=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,"").slice(0,20);
  S=data;curId=id;lastSaved=null;conflict=false;
  try{const r=await api("PUT","/api/monitor/relatorios/"+id,payload(false));lastSaved=r.updatedAt;await refreshList();openDoc(id)}
  catch(e){banner("save","Não foi possível criar o relatório. Verifique a conexão com o servidor.")}
}
function nextEdition(){
  const n=JSON.parse(JSON.stringify(S));
  n.meta.edicao=S.meta.edicao===""?"":String(num(S.meta.edicao)+1);
  n.meta.periodoIni=S.meta.periodoFim||"";n.meta.periodoFim="";n.meta.atualizacao="";
  n.novas.qtd="";n.gerais="";n.mudou={destaque:"",texto:""};
  n.imprensa={nenhum:false,rows:[],leitura:""};n.anexos=[];
  n.contexto.gatilhos.forEach(g=>g.acionado=false);
  createDoc(n);
}
function banner(key,html){let el=document.getElementById("bn_"+key);if(!html){if(el)el.remove();return}
  if(!el){el=document.createElement("div");el.className="banner";el.id="bn_"+key;$("#banners").appendChild(el)}el.innerHTML=html}

/* ================= PDF ================= */
async function makePdf(){
  $("#drawer").hidden=true;const b=$("#bPdf");b.disabled=true;b.textContent="Gerando PDF…";
  try{
    if(!window.html2canvas||!window.jspdf)throw new Error("libs");
    await document.fonts.ready;
    const off=$("#off");const pages=buildPages(off);
    await Promise.all([...off.querySelectorAll("img")].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));
    const pdf=new window.jspdf.jsPDF({unit:"mm",format:"a4",compress:true});
    for(let i=0;i<pages.length;i++){
      const c=await html2canvas(pages[i],{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false,width:794,height:1123,windowWidth:1200});
      if(i)pdf.addPage();pdf.addImage(c.toDataURL("image/jpeg",0.9),"JPEG",0,0,210,297);
    }
    off.innerHTML="";
    const nm=`Monitoramento_${(S.meta.titulo||"caso").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w]+/g,"_").slice(0,40)}_Ed${S.meta.edicao||"x"}_${(S.meta.atualizacao||new Date().toISOString()).slice(0,10)}.pdf`;
    const blob=pdf.output("blob");
    const url=URL.createObjectURL(blob);const lk=document.createElement("a");lk.href=url;lk.download=nm;document.body.appendChild(lk);lk.click();lk.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);banner("pdf",null);
  }catch(e){
    banner("pdf",`Não foi possível gerar o PDF${e&&e.code?" ("+esc(e.code)+")":""}. Tente de novo; se persistir, recarregue a página.`);
  }finally{b.disabled=false;b.textContent="Baixar PDF"}
}

/* ================= uploads ================= */
// A Vercel aceita no máximo ~4,5 MB por requisição. Imagens maiores são reduzidas no navegador antes do envio.
const MAX_UP=3.5*1024*1024;
function loadImg(file){return new Promise((ok,ko)=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{ok(im);setTimeout(()=>URL.revokeObjectURL(u),1000)};im.onerror=()=>{URL.revokeObjectURL(u);ko({code:"unsupported"})};im.src=u})}
async function shrink(file){
  if(file.size<=MAX_UP&&/^image\/(png|jpeg|webp|gif)$/.test(file.type))return file;
  const im=await loadImg(file);let maxW=2200,q=0.88;
  for(let k=0;k<6;k++){
    const sc=Math.min(1,maxW/im.naturalWidth);const c=document.createElement("canvas");
    c.width=Math.round(im.naturalWidth*sc);c.height=Math.round(im.naturalHeight*sc);
    const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
    const b=await new Promise(r=>c.toBlob(r,"image/jpeg",q));
    if(b&&b.size<=MAX_UP)return b;
    maxW=Math.round(maxW*0.8);q=Math.max(0.7,q-0.05);
  }
  throw{code:"too_large"};
}
async function upload(file){
  const blob=await shrink(file);
  const r=await fetch("/api/monitor/uploads",{method:"POST",credentials:"same-origin",headers:{"Content-Type":blob.type||"application/octet-stream"},body:blob});
  if(r.status===401){location.reload();throw{code:"auth"}}
  if(r.status===413)throw{code:"too_large"};
  if(r.status===415)throw{code:"unsupported"};
  if(!r.ok)throw{code:"HTTP "+r.status};
  return r.json();
}

/* ================= eventos ================= */
const form=$("#form");
form.addEventListener("input",e=>{const el=e.target;const p=el.dataset.path;if(!p)return;
  let val=el.type==="checkbox"?el.checked:el.value;setP(S,p,val);
  const m=p.match(/^diario\.(\d+)\./);if(m){const r=S.diario[m[1]];const td=form.querySelector(`[data-tot="${m[1]}"]`);if(td)td.textContent=NETS.reduce((a,n)=>a+num(r[n[0]]),0)}
  if(p==="imprensa.nenhum")renderPress();
  markMissing();renderPreview();schedule()});
form.addEventListener("change",e=>{if(e.target.matches("select"))markMissing()});
form.addEventListener("change",async e=>{const el=e.target;if(!el.dataset.up||!el.files.length)return;
  const files=[...el.files];el.value="";
  try{
    if(el.dataset.up==="logo"){S.logo=await upload(files[0])}
    else{const a=S.anexos[+el.dataset.i];a.prints=a.prints||[];for(const f of files){a.prints.push(await upload(f))}}
    banner("up",null);renderForm();renderPreview();schedule();
  }catch(err){banner("up",err&&err.code==="too_large"?"A imagem é grande demais mesmo depois de reduzida. Recorte o print e envie de novo.":err&&err.code==="unsupported"?"Formato não aceito. Envie PNG, JPG, WEBP ou GIF.":"Não foi possível enviar a imagem. Tente de novo; se persistir, avise quem administra o Drive do projeto.")}
});
document.addEventListener("click",e=>{const b=e.target.closest("[data-act],[data-go]");if(!b)return;
  if(b.dataset.go!=null){goTo($("#drawer")._p[+b.dataset.go]);return}
  const a=b.dataset.act,k=b.dataset.k,i=+b.dataset.i;
  const arr={diario:S.diario,timeline:S.timeline,press:S.imprensa.rows,gat:S.contexto.gatilhos,an:S.anexos}[k];
  if(a==="add"){
    if(k==="diario"){const last=sortedDaily().slice(-1)[0];let d="";if(last){const x=new Date(last.data+"T12:00:00");x.setDate(x.getDate()+1);d=x.toISOString().slice(0,10)}arr.push(Object.assign({data:d},Object.fromEntries(NETS.map(n=>[n[0],""]))))}
    else if(k==="timeline")arr.unshift({data:"",texto:"",tipo:""});
    else if(k==="press")arr.push({data:"",veiculo:"",jornalista:"",demanda:"",prazo:"",resposta:"",status:"Em aberto"});
    else if(k==="gat")arr.push({texto:"",acionado:false});
    else if(k==="an")arr.push({rede:"Imprensa",veiculo:"",titulo:"",pub:"",coleta:"",autoria:"",link:"",protag:"",tom:"",posicao:"",resumo:"",nota:"",prints:[]});
  } else if(a==="del"){arr.splice(i,1)}
  else if(a==="up"&&i>0){[arr[i-1],arr[i]]=[arr[i],arr[i-1]]}
  else if(a==="down"&&i<arr.length-1){[arr[i+1],arr[i]]=[arr[i],arr[i+1]]}
  else if(a==="print-rm"){S.anexos[i].prints.splice(+b.dataset.j,1)}
  else if(a==="logo-rm"){S.logo=null}
  else if(a==="drawer-x"){$("#drawer").hidden=true;return}
  else if(a==="pdf-go"){makePdf();return}
  else if(a==="reload"){openDoc(curId);return}
  else if(a==="force"){flush(true);return}
  else return;
  ({diario:renderDaily,timeline:renderTL,press:renderPress,gat:renderGat,an:renderAn}[k]||renderForm)();
  markMissing();renderPreview();schedule();
});
$("#bPend").onclick=()=>{const d=$("#drawer");if(!d.hidden&&d.dataset.mode==="list"){d.hidden=true}else openDrawer("list")};
$("#bPdf").onclick=()=>{pend().length?openDrawer("pdf"):makePdf()};
$("#bNew").onclick=()=>{if(dirty)flush();createDoc(blank())};
$("#bNext").onclick=()=>{if(dirty)flush();nextEdition()};
$("#pick").onchange=e=>{if(dirty)flush();if(e.target.value)openDoc(e.target.value)};
function setView(vw){document.body.dataset.view=vw;$("#tForm").setAttribute("aria-pressed",vw==="form");$("#tPrev").setAttribute("aria-pressed",vw==="prev");if(vw==="prev")renderPreview()}
$("#tForm").onclick=()=>setView("form");$("#tPrev").onclick=()=>setView("prev");
window.addEventListener("resize",renderPreview);
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#drawer").hidden=true});

/* ================= início ================= */
(function(){const u=window.__monitorUser||"";const box=$("#userBox");if(!box)return;
  box.innerHTML=`<span class="who">${esc(u)}</span><button class="btn small" id="bOut">Sair</button>`;
  $("#bOut").onclick=()=>{if(dirty)flush();if(window.__monitorSignOut)window.__monitorSignOut()}})();
document.body.dataset.view="form";
$("#form").innerHTML=`<div class="empty"><b>Carregando relatórios…</b>Os relatórios salvos pelo time aparecem aqui.</div>`;
renderPick();renderPreview();
(async()=>{
  try{await refreshList()}
  catch(e){$("#form").innerHTML=`<div class="empty"><b>Sem conexão com o servidor</b>Não foi possível carregar os relatórios. Recarregue a página; se persistir, confira as variáveis de ambiente do Google Drive na Vercel.</div>`;return}
  if(list.length)openDoc(list[0].id);
  else{$("#form").innerHTML=`<div class="empty"><b>Nenhum relatório ainda</b>Comece um relatório em branco. Cada edição seguinte pode ser criada a partir da anterior.<div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn primary" id="bFirst">Novo relatório</button><button class="btn" id="bModel">Começar pelo modelo da Apex</button></div></div>`;$("#bFirst").onclick=()=>createDoc(blank());$("#bModel").onclick=async()=>{try{const m=await api("GET","/api/monitor/modelo");createDoc(Object.assign(blank(),m))}catch(e){banner("load","Não foi possível carregar o modelo.")}}}
  setInterval(()=>{refreshList().catch(()=>{})},20000);
  window.addEventListener("beforeunload",e=>{if(dirty){flush();e.preventDefault();e.returnValue=""}});
})();
})();
