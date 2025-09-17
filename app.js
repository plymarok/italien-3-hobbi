/* ========= Thème (clair/sombre) ========= */
const THEME_KEY = "it_memo_theme";
const themeBtn = () => document.getElementById("themeToggle");

function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const html = document.documentElement;
  if (saved === "dark") html.setAttribute("data-theme", "dark");
  else if (saved === "light") html.setAttribute("data-theme", "light");
  else html.removeAttribute("data-theme");
  updateThemeButton();
}
function toggleTheme() {
  const html = document.documentElement;
  const cur = html.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeButton();
}
function updateThemeButton(){
  const cur = document.documentElement.getAttribute("data-theme");
  if (!themeBtn()) return;
  themeBtn().textContent = (cur==="dark") ? "☀️ Mode clair" : "🌙 Mode sombre";
}
document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();
  if (themeBtn()) themeBtn().addEventListener("click", toggleTheme);
});

/* ========= Données ========= */
const DATA = [
  {emoji:"🧘", it:"Fare yoga", fr:"faire du yoga", cat:"sport"},
  {emoji:"🎣", it:"Pescare", fr:"pêcher", cat:"sport"},
  {emoji:"⚽", it:"Giocare a calcio", fr:"jouer au foot", cat:"sport"},
  {emoji:"🚲", it:"Andare in bici", fr:"aller à vélo", cat:"sport"},
  {emoji:"🏀", it:"Giocare a basket", fr:"jouer au basket", cat:"sport"},
  {emoji:"🏐", it:"Giocare a pallavolo", fr:"jouer au volley", cat:"sport"},
  {emoji:"🏏", it:"Giocare a cricket", fr:"jouer au cricket", cat:"sport"},
  {emoji:"🎸", it:"Suonare la chitarra", fr:"jouer de la guitare", cat:"art"},
  {emoji:"🎤", it:"Cantare", fr:"chanter", cat:"art"},
  {emoji:"🎨", it:"Dipingere", fr:"peindre", cat:"art"},
  {emoji:"🎧", it:"Ascoltare la musica", fr:"écouter de la musique", cat:"art"},
  {emoji:"🎭", it:"Andare a teatro", fr:"aller au théâtre", cat:"culture"},
  {emoji:"🎬", it:"Andare al cinema", fr:"aller au cinéma", cat:"culture"},
  {emoji:"📖", it:"Leggere", fr:"lire", cat:"culture"},
  {emoji:"🎮", it:"Giocare ai videogiochi", fr:"jouer aux jeux vidéo", cat:"culture"},
  {emoji:"✈️", it:"Viaggiare", fr:"voyager", cat:"autre"}
];

/* ========= Utilitaires ========= */
const $ = sel => document.querySelector(sel);
const setHTML = (el, html) => { if(el) el.innerHTML = html; };
const shuffle = arr => arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const pick = (arr,n=1)=>shuffle([...arr]).slice(0,n);
const norm = s => s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');

/* ✅ Helper options QCM — garantit la présence du bon choix */
function makeOptions(correct, count = 3) {
  const pool = DATA.map(x => x.fr);
  const distractors = shuffle(pool.filter(x => x !== correct));
  const take = Math.max(0, Math.min(count - 1, distractors.length));
  const opts = [correct, ...distractors.slice(0, take)];
  return shuffle(opts);
}

/* ==== Toast local au jeu ==== */
function notify(message, type="ok", ms=900){
  const parent = document.getElementById("content");
  if(!parent) return Promise.resolve();

  const box = document.createElement("div");
  box.className = `toast ${type}`;
  const icon = type === "ok" ? "✅" : "❌";
  box.innerHTML = `<span class="icon">${icon}</span><span>${message}</span>`;

  parent.appendChild(box);
  requestAnimationFrame(()=> box.classList.add("show"));

  return new Promise(resolve=>{
    const close = () => { box.classList.remove("show"); setTimeout(()=>{ box.remove(); resolve(); }, 180); };
    const t = setTimeout(close, ms);
    box.addEventListener("click", ()=>{ clearTimeout(t); close(); });
  });
}

/* ========= Progression (localStorage) ========= */
const KEY_STATS="it_memo_stats_v1";
let STATS = loadStats();

function loadStats(){
  const raw = localStorage.getItem(KEY_STATS);
  if(raw){ try{ return JSON.parse(raw);}catch(e){} }
  const s={points:0, streak:0, best:0, items:{}, lastDaily:null};
  DATA.forEach(d=>s.items[d.it]={ok:0, ko:0, streak:0, best:0});
  return s;
}
function saveStats(){ localStorage.setItem(KEY_STATS, JSON.stringify(STATS)); renderHUD(); }
function recordResult(it, ok){
  const item = STATS.items[it]; if(!item) return;
  if(ok){ item.ok++; item.streak++; item.best=Math.max(item.best,item.streak); STATS.points++; STATS.streak++; STATS.best=Math.max(STATS.best, STATS.points); }
  else { item.ko++; item.streak=0; STATS.streak=0; }
  saveStats();
}
function renderHUD(){
  const pts=$("#points"), bst=$("#best"), str=$("#streak");
  if(pts) pts.textContent = "Points : " + STATS.points;
  if(bst) bst.textContent = "Best : " + STATS.best;
  if(str){
    const stars = Math.min(5, Math.floor(STATS.streak/5)+1);
    str.textContent = "Streak " + "★".repeat(stars) + "☆".repeat(5-stars);
  }
}
function resetProgress(){
  if(!confirm("Réinitialiser tous les points, streaks et statistiques ?")) return;
  localStorage.removeItem(KEY_STATS);
  STATS = loadStats(); saveStats();
}

/* ========= Jeux ========= */

/* 1) Leçon */
function showLesson(){
  const list = DATA.map(d=>`<li>${d.emoji} <b>${d.it}</b> = ${d.fr} <span class="pill">${d.cat}</span></li>`).join("");
  setHTML($("#content"), `<h2>📖 Leçon</h2><ul class="list">${list}</ul>`);
}

/* 2) Quiz (QCM) */
function startQuiz(){
  const q = pick(DATA)[0];
  const opts = makeOptions(q.fr, 3);
  setHTML($("#content"), `
    <h2>📝 Quiz</h2>
    <p>Que veut dire <b>${q.it}</b> ${q.emoji} ?</p>
    ${opts.map(o=>`<button class="btn opt" data-it="${q.it}" data-ans="${o}" data-correct="${q.fr}">${o}</button>`).join(" ")}
  `);
  document.querySelectorAll("#content .opt").forEach(btn=>{
    btn.addEventListener("click", () => {
      const {it, ans, correct} = btn.dataset;
      const ok = (ans===correct);
      recordResult(it, ok);
      notify(ok ? "Bravo !" : "Mauvaise réponse. → " + correct, ok ? "ok" : "bad")
        .then(startQuiz);
    });
  });
}

/* 3) Flashcards */
function startFlashcards(){
  setHTML($("#content"), `<h2>🎴 Flashcards</h2>
    <div class="grid">${DATA.map(d=>`
      <div class="card center" onclick="this.dataset.flip^=1; this.innerHTML = (this.dataset.flip%2==1)?'${d.emoji} <b>${d.it}</b><br><span class=muted>cliquer</span>':'${d.emoji} <b>${d.it}</b><br>${d.fr}'">
        ${d.emoji} <b>${d.it}</b><br><span class="muted">cliquer</span>
      </div>`).join("")}
    </div>`);
}

/* 4) Audio */
function startAudio(){
  setHTML($("#content"), `<h2>🔊 Écoute et répète</h2>
  <p class="muted small">Cliquer pour entendre l’italien (voix du navigateur).</p>
  ${DATA.map(d=>`<button class="btn" onclick="speak('${d.it.replace(/'/g,"\\'")}')">${d.emoji} ${d.it}</button>`).join(" ")}`);
}
function speak(text){
  const u = new SpeechSynthesisUtterance(text);
  u.lang="it-IT"; speechSynthesis.cancel(); speechSynthesis.speak(u);
}

/* 5) Vrai/Faux */
function startVF(){
  const q = pick(DATA)[0], r = pick(DATA)[0];
  const isTrue = (q.fr===r.fr);
  setHTML($("#content"), `<h2>🎲 Vrai ou Faux</h2>
    <p>${q.it} ${q.emoji} = ${r.fr}</p>
    <button class="btn ok" onclick="vfCheck('${q.it.replace(/'/g,"\\'")}',${isTrue},true)">Vrai</button>
    <button class="btn bad" onclick="vfCheck('${q.it.replace(/'/g,"\\'")}',${isTrue},false)">Faux</button>`);
}
function vfCheck(it,truth,answer){
  const ok = (truth===answer);
  recordResult(it, ok);
  notify(ok ? "Bravo !" : "Mauvais choix.", ok ? "ok" : "bad")
    .then(startVF);
}

/* 6) Drag & Drop */
function startDragDrop(){
  const left = shuffle([...DATA]);
  const right = shuffle([...DATA]);
  setHTML($("#content"), `<h2>🧩 Associer</h2>
  <div class="grid">
    <div class="card"><h3>Italien</h3>${left.map(d=>`<span class="drag" draggable="true" ondragstart="drag(event,'${d.fr.replace(/'/g,"\\'")}','${d.it.replace(/'/g,"\\'")}')">${d.emoji} ${d.it}</span>`).join("")}</div>
    <div class="card"><h3>Français</h3>${right.map(d=>`<div class="dropzone" ondragover="allowDrop(event)" ondrop="drop(event,'${d.fr.replace(/'/g,"\\'")}')">${d.fr}</div>`).join("")}</div>
  </div>`);
}
function allowDrop(e){ e.preventDefault(); }
function drag(e, fr, it){ e.dataTransfer.setData("text/plain", JSON.stringify({fr,it})); }
function drop(e, fr){
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData("text/plain"));
  const ok = (data.fr===fr);
  e.target.style.background = ok ? "var(--ok-bg)" : "var(--bad-bg)";
  recordResult(data.it, ok);
}

/* 7) Révision minute */
let autoTimer=null, autoIndex=0;
function startAuto(){
  clearInterval(autoTimer); autoIndex=0;
  setHTML($("#content"), `<h2>⏱️ Révision minute</h2><div id="autoBox" class="center auto-box"></div>`);
  autoTimer = setInterval(()=>{
    const d = DATA[autoIndex];
    $("#autoBox").innerHTML = `${d.emoji} <b>${d.it}</b><br>${d.fr}`;
    autoIndex = (autoIndex+1)%DATA.length;
  }, 3000);
}

/* 8) Challenge chrono */
let chronoScore=0, chronoCount=0;
function startChrono(){ chronoScore=0; chronoCount=0; chronoNext(); }
function chronoNext(){
  if(chronoCount>=10){
    notify("Score final : "+chronoScore+"/10", "ok");
    return;
  }
  chronoCount++;
  const q = pick(DATA)[0];
  const opts = makeOptions(q.fr, 3);
  setHTML($("#content"), `<h2>🏆 Challenge chrono</h2>
  <p>${chronoCount}/10 — Que veut dire <b>${q.it}</b> ${q.emoji} ?</p>
  ${opts.map(o=>`<button class="btn opt" data-it="${q.it}" data-ans="${o}" data-correct="${q.fr}">${o}</button>`).join(" ")}`);
  document.querySelectorAll("#content .opt").forEach(btn=>{
    btn.addEventListener("click", () => {
      const {it, ans, correct} = btn.dataset;
      const ok = (ans===correct);
      if(ok) chronoScore++;
      recordResult(it, ok);
      chronoNext();
    });
  });
}

/* 9) Memory */
let mem=[], memFlipped=[], memFound=0;
function startMemory(){
  mem=[]; memFlipped=[]; memFound=0;
  DATA.forEach(d=>{ mem.push({text:d.it, pair:d.fr}); mem.push({text:d.fr, pair:d.it}); });
  mem = shuffle(mem);
  setHTML($("#content"), `<h2>🎮 Memory</h2><div class="memory-grid">${mem.map((c,i)=>`<div class="memory-card" id="m${i}" onclick="flip(${i})">?</div>`).join("")}</div>`);
}
function flip(i){
  const card = mem[i], div = $("#m"+i);
  if(memFlipped.length<2 && div.textContent==='?'){
    div.textContent = card.text; memFlipped.push({i, ...card});
    if(memFlipped.length===2){
      setTimeout(()=>{
        const [a,b]=memFlipped;
        if(a.text===b.pair){
          $("#m"+a.i).classList.add("ok"); $("#m"+b.i).classList.add("ok"); memFound++;
          const it = (DATA.find(d=>d.it===a.text)||DATA.find(d=>d.it===b.text))?.it;
          if(it) recordResult(it,true);
          if(memFound===DATA.length) notify("Bravo ! Memory terminé.", "ok");
        } else {
          $("#m"+a.i).textContent='?'; $("#m"+b.i).textContent='?';
          const it = (DATA.find(d=>d.it===a.text)||DATA.find(d=>d.it===b.text))?.it;
          if(it) recordResult(it,false);
        }
        memFlipped=[];
      }, 650);
    }
  }
}

/* 10) Dictée inversée */
function startDictee(){
  const q = pick(DATA)[0];
  setHTML($("#content"), `<h2>⌨️ Dictée inversée</h2>
    <p>Écris en italien : <b>${q.fr}</b> ${q.emoji}</p>
    <input id="dicteeIn" type="text" placeholder="Tape l’italien ici" onkeydown="if(event.key==='Enter') dicteeCheck('${q.it.replace(/'/g,"\\'")}')" />
    <div class="row">
      <button class="btn primary" onclick="dicteeCheck('${q.it.replace(/'/g,"\\'")}')">Vérifier</button>
      <button class="btn" onclick="startDictee()">Nouveau</button>
    </div>`);
  $("#dicteeIn").focus();
}
function dicteeCheck(it){
  const ok = (norm($("#dicteeIn").value) === norm(it));
  recordResult(it, ok);
  notify(ok ? "Juste !" : "Attendu : " + it, ok ? "ok" : "bad")
    .then(startDictee);
}

/* 11) Bingo 4×4 */
let bingoCall=null;
function startBingo(){
  const gridItems = shuffle([...DATA]);
  bingoCall = pick(DATA)[0];
  setHTML($("#content"), `<h2>🔢 Bingo 4×4</h2>
    <p>Appel : <b id="bingoCall">${bingoCall.fr}</b></p>
    <div class="bingo-grid">
      ${gridItems.map(d=>`<div class="bingo-cell" onclick="bingoClick(this,'${d.it.replace(/'/g,"\\'")}','${d.fr.replace(/'/g,"\\'")}')">${d.emoji} ${d.it}</div>`).join("")}
    </div>
    <div class="row"><button class="btn" onclick="bingoNext()">🔔 Nouvel appel</button></div>
  `);
}
function bingoClick(cell,it,fr){
  if(fr===$("#bingoCall").textContent){ cell.classList.add("mark"); recordResult(it,true); bingoNext(); checkBingoWin(); }
  else { cell.classList.add("call"); setTimeout(()=>cell.classList.remove("call"),500); recordResult(it,false); }
}
function bingoNext(){ bingoCall = pick(DATA)[0]; $("#bingoCall").textContent = bingoCall.fr; }
function checkBingoWin(){
  const cells=[...document.querySelectorAll(".bingo-cell")];
  const marked = i=>cells[i].classList.contains("mark")?1:0;
  const lines=[
    [0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],
    [0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],
    [0,5,10,15],[3,6,9,12]
  ];
  for(const l of lines){ if(l.map(marked).reduce((a,b)=>a+b,0)===4){ notify("BINGO !", "ok"); break; } }
}

/* 12) Intrus */
function startIntrus(){
  const cats = ["sport","art","culture","autre"];
  const baseCat = pick(cats)[0];
  const same = pick(DATA.filter(d=>d.cat===baseCat),3);
  const diff = pick(DATA.filter(d=>d.cat!==baseCat),1);
  const set = shuffle([...same, ...diff]);
  setHTML($("#content"), `<h2>🧠 Trouve l’intrus</h2>
    <p>Parmi ces 4, un seul n’est pas de la même catégorie.</p>
    ${set.map(d=>`<button class="btn" onclick="intrusCheck('${d.it.replace(/'/g,"\\'")}','${d.cat}','${baseCat}')">${d.emoji} ${d.it}</button>`).join(" ")}`);
}
function intrusCheck(it,cat,base){
  const ok = (cat!==base);
  recordResult(it, ok);
  notify(ok?"Intrus trouvé !":"Non, même catégorie.", ok?"ok":"bad")
    .then(startIntrus);
}

/* 13) Peek & Hide */
function startPeek(){
  const q = pick(DATA)[0];
  setHTML($("#content"), `<h2>👀 Peek & Hide</h2>
    <p>Regarde vite, puis traduis en français.</p>
    <div id="peekWord" class="peek">${q.emoji} <b>${q.it}</b></div>
    <input id="peekIn" type="text" placeholder="Traduction FR" onkeydown="if(event.key==='Enter') peekCheck('${q.it.replace(/'/g,"\\'")}','${q.fr.replace(/'/g,"\\'")}')" />
    <div class="row"><button class="btn primary" onclick="peekCheck('${q.it.replace(/'/g,"\\'")}','${q.fr.replace(/'/g,"\\'")}')">Vérifier</button></div>
  `);
  setTimeout(()=>$("#peekWord").innerHTML = "••••••••••••", 1200);
  $("#peekIn").focus();
}
function peekCheck(it,fr){
  const ok = norm($("#peekIn").value)===norm(fr);
  recordResult(it, ok);
  notify(ok?"Bravo !":"Réponse : "+fr, ok?"ok":"bad")
    .then(startPeek);
}

/* 14) Phrase Builder */
function startPhrases(){
  const bank = shuffle([...DATA]).slice(6);
  const slots = shuffle(pick(DATA,3));
  setHTML($("#content"), `<h2>🧱 Phrase Builder</h2>
    <p>Complète les phrases (menu déroulant).</p>
    <div class="card">
      <p>Mi piace <select id="p1">${bank.map(d=>`<option value="${d.it}">${d.it}</option>`).join("")}</select>.</p>
      <p>La sera, <select id="p2">${bank.map(d=>`<option value="${d.it}">${d.it}</option>`).join("")}</select>.</p>
      <p>Domani voglio <select id="p3">${bank.map(d=>`<option value="${d.it}">${d.it}</option>`).join("")}</select>.</p>
      <div class="row">
        <button class="btn primary" onclick="phrasesCheck(['${slots[0].it.replace(/'/g,"\\'")}','${slots[1].it.replace(/'/g,"\\'")}','${slots[2].it.replace(/'/g,"\\'")}'])">Vérifier</button>
      </div>
      <p class="muted small">Astuce: point accordé si 2/3 sont plausibles.</p>
    </div>`);
}
function phrasesCheck(targets){
  const vals = [$("#p1").value,$("#p2").value,$("#p3").value];
  let okCount = 0; vals.forEach(v=>{ if(targets.includes(v)) okCount++; });
  const ok = okCount>=2;
  recordResult(vals[0], ok);
  notify(ok ? `Bien joué (${okCount}/3)` : `Seulement ${okCount}/3`, ok ? "ok" : "bad");
}

/* 15) Cible rapide */
let targetTimer=null, targetTime=3000;
function startTarget(){
  const q = pick(DATA)[0];
  const opts = makeOptions(q.fr, 3);
  setHTML($("#content"), `<h2>🎯 Cible rapide</h2>
  <div class="progress"><div id="bar" class="bar"></div></div>
  <p>Vite ! <b>${q.it}</b> ${q.emoji}</p>
  ${opts.map(o=>`<button class="btn opt" data-it="${q.it}" data-ans="${o}" data-correct="${q.fr}">${o}</button>`).join(" ")}`);
  clearInterval(targetTimer);
  let t=0; targetTimer=setInterval(()=>{ t+=50; $("#bar").style.width = (t/targetTime*100)+"%";
    if(t>=targetTime){
      clearInterval(targetTimer);
      recordResult(q.it,false);
      notify("Trop tard ! → " + q.fr, "bad").then(startTarget);
    }
  },50);

  document.querySelectorAll("#content .opt").forEach(btn=>{
    btn.addEventListener("click", () => {
      clearInterval(targetTimer);
      const {it, ans, correct} = btn.dataset;
      const ok = (ans===correct);
      recordResult(it,ok);
      targetTime = Math.max(1200, targetTime-120);
      notify(ok ? "Bravo !" : "Réponse : " + correct, ok ? "ok" : "bad")
        .then(startTarget);
    });
  });
}

/* 16) Anagrammes */
function startAnagrammes(){
  const single = DATA.filter(d=>!/\s/.test(d.it));
  const q = (single.length? pick(single)[0] : pick(DATA)[0]);
  const letters = shuffle(q.it.replace(/\s+/g,'').split(''));
  setHTML($("#content"), `<h2>🔤 Anagrammes</h2>
    <p>Recompose : <b>${q.it.length}</b> lettres (${q.emoji})</p>
    <div id="anaOut" class="pill" style="min-height:38px;display:inline-block;padding:8px 12px"></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(42px,1fr));max-width:480px">
      ${letters.map((c,i)=>`<button class="btn key" id="l${i}" onclick="anaPick('${c}','l${i}')">${c}</button>`).join("")}
    </div>
    <div class="row">
      <button class="btn primary" onclick="anaCheck('${q.it.replace(/'/g,"\\'")}')">Vérifier</button>
      <button class="btn" onclick="startAnagrammes()">Recommencer</button>
    </div>`);
}
function anaPick(c,id){
  const out = $("#anaOut"); out.textContent += c; $("#"+id).disabled=true;
}
function anaCheck(target){
  const val = $("#anaOut").textContent;
  const ok = (norm(val)===norm(target.replace(/\s+/g,'')));
  recordResult(target, ok);
  notify(ok?"Bravo !":"Réponse : "+target, ok?"ok":"bad")
    .then(startAnagrammes);
}

/* 17) Shadowing */
function startShadow(){
  const q = pick(DATA)[0];
  setHTML($("#content"), `<h2>🎤 Shadowing</h2>
    <p class="muted small">Lis à voix haute en même temps que la voix.</p>
    <div id="kara" class="ghost-karaoke">${q.emoji} ${q.it}</div>
    <div class="row"><button class="btn primary" onclick="shadowPlay('${q.it.replace(/'/g,"\\'")}')">▶️ Écouter</button></div>`);
}
function shadowPlay(text){
  speak(text);
  const el = $("#kara"); el.innerHTML = "";
  let i=0; const id=setInterval(()=>{ el.innerHTML = `<span class="hl">${text.slice(0,i)}</span>${text.slice(i)}`; i++; if(i>text.length){ clearInterval(id);} }, 80);
}

/* 18) Pièges */
function startPieges(){
  const sports = DATA.filter(d=>d.cat==="sport");
  const q = (sports.length? pick(sports)[0] : pick(DATA)[0]);
  const trap = pick(DATA.filter(d=>d.cat===q.cat && d.fr!==q.fr))[0]?.fr || pick(DATA)[0].fr;
  const opts = shuffle([q.fr, trap]);
  setHTML($("#content"), `<h2>⚠️ Pièges</h2>
    <p>Choisis la traduction EXACTE de <b>${q.it}</b> ${q.emoji}</p>
    ${opts.map(o=>`<button class="btn" onclick="piegesCheck('${q.it.replace(/'/g,"\\'")}','${o.replace(/'/g,"\\'")}','${q.fr.replace(/'/g,"\\'")}')">${o}</button>`).join(" ")}`);
}
function piegesCheck(it,ans,correct){
  const ok = (ans===correct);
  recordResult(it, ok);
  notify(ok?"Précision !":"C’était : "+correct, ok?"ok":"bad")
    .then(startPieges);
}

/* 19) Roue des jeux */
function startWheel(){
  const list = ["quiz","vf","flash","drag","dictee","bingo","intrus","peek","phrases","target","anag","shadow","memory","chrono"];
  setHTML($("#content"), `<h2>🎡 Roue des jeux</h2><div class="wheel" id="wheel"></div><div class="wheel-pointer"></div>
    <button class="btn primary" onclick="spinWheel()">Spinner</button>`);
  const wheel = $("#wheel");
  const n=list.length;
  list.forEach((id,idx)=>{
    const slice = document.createElement("div");
    const angle = 360/n;
    slice.className="wheel-slice";
    slice.style.transform = `rotate(${idx*angle}deg)`;
    slice.style.background = `hsl(${(idx*360/n)|0} 80% 55%)`;
    slice.innerHTML = `<div style="transform:rotate(${-idx*angle}deg)">${GAMES.find(g=>g.id===id).label}</div>`;
    wheel.appendChild(slice);
  });
  wheel.dataset.games = JSON.stringify(list);
}
function spinWheel(){
  const wheel = $("#wheel"); if(!wheel) return;
  const list = JSON.parse(wheel.dataset.games);
  const n=list.length;
  const turns = 6*360;
  const stopAt = Math.floor(Math.random()*n);
  const angle = 360/n;
  const final = turns + stopAt*angle + angle/2;
  wheel.style.transition="transform 3s cubic-bezier(.25,.9,.25,1)";
  wheel.style.transform=`rotate(${final}deg)`;
  setTimeout(()=>{
    const id=list[stopAt]; const game = GAMES.find(g=>g.id===id);
    notify("→ " + game.label, "ok", 800).then(()=> game.run());
  }, 3200);
}

/* 20) Révision du jour */
function startDaily(){
  const items = [...DATA].sort((a,b)=>{
    const sa=STATS.items[a.it], sb=STATS.items[b.it];
    const aa = (sa.ko - sa.ok), bb = (sb.ko - sb.ok);
    return bb-aa;
  }).slice(0,5);
  let i=0, score=0;
  function step(){
    if(i>=items.length){ notify("Terminé : "+score+"/"+items.length, "ok"); return; }
    const q=items[i];
    const opts = makeOptions(q.fr, 3);
    setHTML($("#content"), `<h2>🗓️ Révision du jour</h2>
      <p>${i+1}/5 — <b>${q.it}</b> ${q.emoji}</p>
      ${opts.map(o=>`<button class="btn opt" data-it="${q.it}" data-ans="${o}" data-correct="${q.fr}">${o}</button>`).join(" ")}`);
    document.querySelectorAll("#content .opt").forEach(btn=>{
      btn.addEventListener("click", () => {
        const {it, ans, correct} = btn.dataset;
        const ok = (ans===correct);
        if(ok) score++;
        recordResult(it, ok);
        i++; step();
      });
    });
  }
  step();
}

/* 21) Duel local */
function startDuel(){
  let turn=0, score=[0,0], total=10, count=0;
  function next(){
    if(count>=total){
      notify(`Fin du duel — J1: ${score[0]} | J2: ${score[1]}`, "ok");
      return;
    }
    const p = (turn%2);
    const q = pick(DATA)[0];
    const opts = makeOptions(q.fr, 3);
    setHTML($("#content"), `<h2>👥 Duel local</h2>
      <p>Tour du <b>Joueur ${p+1}</b> — ${count+1}/${total}</p>
      <p>Traduire : <b>${q.it}</b> ${q.emoji}</p>
      <div>${opts.map(o=>`<button class="btn opt" data-it="${q.it}" data-ans="${o}" data-correct="${q.fr}">${o}</button>`).join(" ")}</div>
      <p class="muted small">Scores — J1: ${score[0]} | J2: ${score[1]}</p>`);
    document.querySelectorAll("#content .opt").forEach(btn=>{
      btn.addEventListener("click", () => {
        const {it, ans, correct} = btn.dataset;
        const ok = (ans===correct);
        if(ok) score[p]++;
        recordResult(it, ok);
        turn++; count++; next();
      });
    });
  }
  next();
}

/* ========= Barre d’outils ========= */
const GAMES = [
  {id:"lesson", label:"📖 Leçon", run:showLesson},
  {id:"quiz", label:"📝 Quiz", run:startQuiz},
  {id:"flash", label:"🎴 Flashcards", run:startFlashcards},
  {id:"audio", label:"🔊 Audio", run:startAudio},
  {id:"vf", label:"🎲 Vrai/Faux", run:startVF},
  {id:"drag", label:"🧩 Associer", run:startDragDrop},
  {id:"auto", label:"⏱️ Révision minute", run:startAuto},
  {id:"chrono", label:"🏆 Challenge chrono", run:startChrono},
  {id:"memory", label:"🎮 Memory", run:startMemory},
  {id:"dictee", label:"⌨️ Dictée inversée", run:startDictee},
  {id:"bingo", label:"🔢 Bingo 4×4", run:startBingo},
  {id:"intrus", label:"🧠 Intrus", run:startIntrus},
  {id:"peek", label:"👀 Peek & Hide", run:startPeek},
  {id:"phrases", label:"🧱 Phrase Builder", run:startPhrases},
  {id:"target", label:"🎯 Cible rapide", run:startTarget},
  {id:"anag", label:"🔤 Anagrammes", run:startAnagrammes},
  {id:"shadow", label:"🎤 Shadowing", run:startShadow},
  {id:"pieges", label:"⚠️ Pièges", run:startPieges},
  {id:"wheel", label:"🎡 Roue", run:startWheel},
  {id:"daily", label:"🗓️ Révision du jour", run:startDaily},
  {id:"duel", label:"👥 Duel local", run:startDuel}
];

function renderToolbar(){
  const bar = document.getElementById("toolbar");
  if(!bar) return;
  bar.innerHTML = GAMES.map(g=>`<button class="btn" onclick="${g.run.name}()">${g.label}</button>`).join("");
}

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", () => {
  renderToolbar();
  renderHUD();
  showLesson();
});
