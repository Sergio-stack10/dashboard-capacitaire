// Dashboard capacitaire : données = localStorage (import) sinon data/data.json
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],sum=a=>a.reduce((x,y)=>x+y,0);
const fm=n=>Math.round(n).toLocaleString('fr-FR'),f1=n=>n.toLocaleString('fr-FR',{maximumFractionDigits:1}),pc=n=>isFinite(n)?Math.round(n*100)+' %':'–';
const PAL=['#3b5bdb','#f08c00','#12a36b','#d6336c','#7950f2','#1098ad','#e6b800','#e5484d','#868e96','#2f9e44'];
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const kpi=a=>a.map(k=>`<div class="card kpi"><span>${k[0]}</span><b>${k[1]}</b></div>`).join('');
let DATA,ch={},cur='Tous',gran='semaine',fx='Tous',d1='',d2='',sortK=null,sortD=-1;
function mk(id,cfg){ch[id]&&ch[id].destroy();Chart.defaults.color=css('--mu');Chart.defaults.borderColor=css('--bd');Chart.defaults.font.size=13;cfg.options=Object.assign({responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false}},cfg.options||{});ch[id]=new Chart($('#'+id),cfg)}
function isoW(s){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));return d.getUTCFullYear()+'-S'+String(Math.ceil(((d-y)/864e5+1)/7)).padStart(2,'0')}
async function load(){try{const s=localStorage.getItem('capaData');if(s){DATA=JSON.parse(s);return}}catch(e){}DATA=await(await fetch('data/data.json')).json()}
function save(){try{localStorage.setItem('capaData',JSON.stringify(DATA.demo?{...DATA,plan:null,demo:false}:DATA))}catch(e){}}
function meta(){const m=DATA.meta||{};$('#meta').textContent='Roadmap : '+(m.roadmap||'–')+' · Capa : '+(m.capa||'–')+(m.plan?' · Planif : '+m.plan:'')+(DATA.demo?' · DÉMO planifié/réalisé':'')+' · mise à jour '+(m.maj||'–')}
/* ---- Page 1 : roadmap ---- */
function render1(){const R=DATA.roadmap,W=R[0].prev.length,lab=Array.from({length:W},(_,i)=>'S'+(i+1));
 let S=R.map((d,i)=>({...d,col:PAL[i%10],n:d.c+' '+d.a})).filter(d=>cur=='Tous'||d.c==cur);
 const tot=sum(S.map(d=>sum(d.prev))),etp=lab.map((_,w)=>sum(S.map(d=>d.etp[w]))),mx=Math.max(...etp);
 $('#k1').innerHTML=kpi([['Volume prévu',fm(tot)+' actes'],['Activités',S.length],['ETP moyen requis',f1(sum(etp)/W)],['Pic ETP',f1(mx)+' ('+lab[etp.indexOf(mx)]+')']]);
 mk('c1',{type:'doughnut',data:{labels:S.map(d=>d.n),datasets:[{data:S.map(d=>sum(d.prev)),backgroundColor:S.map(d=>d.col),borderWidth:2,hoverOffset:14}]},options:{cutout:'58%',interaction:{mode:'nearest'},plugins:{legend:{position:'right'},tooltip:{callbacks:{label:c=>' '+c.label+' : '+fm(c.raw)+' ('+(c.raw/tot*100).toFixed(1)+' %)'}}}}});
 mk('c2',{type:'bar',data:{labels:lab,datasets:S.map(d=>({label:d.n,data:d.prev,backgroundColor:d.col}))},options:{scales:{x:{stacked:true,ticks:{maxTicksLimit:14}},y:{stacked:true}},plugins:{legend:{position:'bottom'}}}});
 mk('c3',{type:'line',data:{labels:lab,datasets:[{label:'ETP requis',data:etp,borderColor:PAL[0],backgroundColor:PAL[0]+'33',fill:true,pointRadius:0,tension:.3}]},options:{scales:{x:{ticks:{maxTicksLimit:14}}},plugins:{legend:{display:false}}}});
 let rows=S.map(d=>({a:d.a,c:d.c,v:sum(d.prev),w:sum(d.prev)/tot,e:sum(d.etp)/W,k:sum(d.capa)}));
 if(sortK)rows.sort((x,y)=>(x[sortK]>y[sortK]?1:-1)*sortD);
 $('#t1').innerHTML='<tr>'+[['a','Activité'],['c','Channel'],['v','Volume prévu'],['w','Poids'],['e','ETP moy.'],['k','Capa (actes)']].map(h=>`<th data-s="${h[0]}">${h[1]}</th>`).join('')+'<th>Couverture</th></tr>'+rows.map(r=>`<tr><td>${r.a}</td><td>${r.c}</td><td>${fm(r.v)}</td><td>${(r.w*100).toFixed(1)} %<span class="bar" style="width:${r.w*160}px"></span></td><td>${f1(r.e)}</td><td>${fm(r.k)}</td><td>${r.v?`<span class="pill ${r.k>=r.v?'ok':'ko'}">${pc(r.k/r.v)}</span>`:'–'}</td></tr>`).join('');
 $$('#t1 th[data-s]').forEach(h=>h.onclick=()=>{sortD=sortK==h.dataset.s?-sortD:-1;sortK=h.dataset.s;render1()})}
/* ---- Page 2 : capacité jour / semaine / mois ---- */
function render2(){const C=DATA.capa,sel=C.flux.filter(f=>fx=='Tous'||fx==f.c||fx==f.k),m=new Map();
 const key=d=>gran=='jour'?d:gran=='mois'?d.slice(0,7):isoW(d);
 C.dates.forEach((d,i)=>{if(d<d1||d>d2)return;const k=key(d),o=m.get(k)||{p:0,c:0,k:0};sel.forEach(f=>{o.p+=f.prev[i];o.c+=f.contr[i];o.k+=f.capa[i]});m.set(k,o)});
 const P=[...m],lab=P.map(x=>x[0]),T=P.reduce((a,x)=>({p:a.p+x[1].p,c:a.c+x[1].c,k:a.k+x[1].k}),{p:0,c:0,k:0}),low=P.filter(x=>x[1].c&&x[1].k<x[1].c).length;
 $('#k2').innerHTML=kpi([['Prévision contractuelle',fm(T.c)],['Capacité en actes',fm(T.k)],['Couverture globale',pc(T.k/T.c)],['Périodes sous 100 %',low+' / '+P.length]]);
 $('#gl').textContent='('+gran+(gran=='semaine'?'s':gran=='jour'?'s':'')+' · '+(fx=='Tous'?'tous flux':fx)+')';
 const cov=P.map(x=>x[1].c?x[1].k/x[1].c*100:null);
 mk('c4',{data:{labels:lab,datasets:[{type:'bar',label:'Contractuel',data:P.map(x=>x[1].c),backgroundColor:PAL[0]+'cc',borderRadius:4,order:2},{type:'bar',label:'Capacité',data:P.map(x=>x[1].k),backgroundColor:PAL[2]+'cc',borderRadius:4,order:2},{type:'line',label:'Couverture %',data:cov,borderColor:PAL[1],yAxisID:'y1',pointRadius:gran=='jour'?0:3,tension:.25,order:1},{type:'line',label:'Seuil 100 %',data:cov.map(()=>100),borderColor:'#e5484d',borderDash:[6,5],pointRadius:0,yAxisID:'y1',order:0}]},options:{scales:{x:{ticks:{maxTicksLimit:16}},y:{beginAtZero:true},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{callback:v=>v+' %'}}},plugins:{legend:{position:'bottom'}}}});
 $('#t2').innerHTML='<tr><th>Période</th><th>Prévision</th><th>Contractuel</th><th>Capacité</th><th>Écart</th><th>Couverture</th></tr>'+P.map(([k,o])=>`<tr><td>${k}</td><td>${fm(o.p)}</td><td>${fm(o.c)}</td><td>${fm(o.k)}</td><td style="color:var(--${o.k>=o.c?'ok':'ko'})">${o.k-o.c>0?'+':''}${fm(o.k-o.c)}</td><td>${o.c?`<span class="pill ${o.k>=o.c?'ok':'ko'}">${pc(o.k/o.c)}</span>`:'–'}</td></tr>`).join('')}
/* ---- Pages 3 et 4 : prévu vs planifié, planifié vs réalisé ---- */
//<T
let PI=null;
const norm=x=>String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
const isoD=v=>{if(typeof v=='number')return new Date(Math.round((v-25569)*864e5)).toISOString().slice(0,10);v=String(v).trim();let m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[0];m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):''};
const hhmm=v=>{if(v===''||v==null)return '';if(typeof v=='number'){const t=Math.round((v%1)*1440);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}const m=String(v).match(/(\d{1,2})[:h](\d{2})/);return m?m[1].padStart(2,'0')+':'+m[2]:''};
function planInfo(){if(PI)return PI;const rows=(DATA.plan&&DATA.plan.rows)||[];PI={rows,dates:[...new Set(rows.map(x=>x[0]))].sort(),fl:[...new Set(rows.map(x=>x[2]))]};return PI}
const CF={pv:{a:'Prévu',b:'Planifié',ka:'p',kb:'l',tx:'Taux de planification'},pr:{a:'Planifié',b:'Réalisé',ka:'l',kb:'r',tx:'Taux de réalisation'}};
const CS={pv:{gran:'semaine',fx:'Tous',d1:'',d2:'',src:'contr'},pr:{gran:'semaine',fx:'Tous',d1:'',d2:'',src:'contr'}};
function series(k){const s=CS[k],C=DATA.capa,rows=planInfo().rows,m=new Map(),days=new Set(),ok=f=>s.fx=='Tous'||s.fx==f||s.fx==f.split(' ')[0],inr=d=>d>=s.d1&&d<=s.d2,sl=s.gran=='creneau';
 const key=(d,t)=>sl?t:s.gran=='jour'?d:s.gran=='mois'?d.slice(0,7):isoW(d),put=(q,f,v)=>{const o=m.get(q)||{p:0,l:0,r:0};o[f]+=v;m.set(q,o)};
 if(!sl)C.flux.forEach(f=>{if(ok(f.k))C.dates.forEach((d,i)=>{if(inr(d))put(key(d),'p',f[s.src][i])})});
 rows.forEach(([d,t,f,p,l,r])=>{if(!inr(d)||!ok(f)||(sl&&!t))return;const q=key(d,t);if(sl){days.add(d);put(q,'p',p)}put(q,'l',l);put(q,'r',r)});
 const n=sl?(days.size||1):1;return [...m].sort((x,y)=>x[0]<y[0]?-1:1).map(([q,o])=>[q,{p:o.p/n,l:o.l/n,r:o.r/n}])}
function demo(){const C=DATA.capa,sl=[];for(let h=7.5;h<=20.5;h+=.5)sl.push(String(Math.floor(h)).padStart(2,'0')+':'+(h%1?'30':'00'));
 const pr=sl.map((_,i)=>{const x=i/(sl.length-1);return Math.exp(-((x-.3)**2)/.02)+.8*Math.exp(-((x-.7)**2)/.03)+.15}),ps=sum(pr),s0=Math.floor(C.dates.length*.55),rows=[];let sd=7;const rnd=()=>(sd=(sd*9301+49297)%233280)/233280;
 C.flux.forEach(f=>{for(let i=s0;i<Math.min(s0+28,C.dates.length);i++){if(!f.contr[i])continue;sl.forEach((t,j)=>{const l=f.capa[i]*pr[j]/ps*(.92+.16*rnd());rows.push([C.dates[i],t,f.k,Math.round(f.contr[i]*pr[j]/ps),Math.round(l),Math.round(l*(.85+.25*rnd()))])})}});
 DATA.plan={rows};DATA.demo=true;PI=null}
//T>
function initCmp(){const C=DATA.capa,I=planInfo(),ds=[...C.dates,...I.dates].sort(),fl=[...new Set([...C.flux.map(f=>f.k),...I.fl])],ch=[...new Set(fl.map(f=>f.split(' ')[0]))];
 ['pv','pr'].forEach(k=>{const s=CS[k],r=$('#'+(k=='pv'?'p3':'p4')+' .cmp');s.d1=ds[0];s.d2=ds[ds.length-1];s.fx='Tous';buildCmp(k,r,ch,fl)})}
function buildCmp(k,r,ch,fl){const s=CS[k],c=CF[k],opt=['Tous',...ch,...fl].map(o=>`<option>${o}</option>`).join('');
 r.innerHTML=`<div class="bar2"><div class="seg">${[['mois','Mois'],['semaine','Semaine'],['jour','Jour'],['creneau','30 min']].map(g=>`<button data-g="${g[0]}" class="${g[0]==s.gran?'on':''}">${g[1]}</button>`).join('')}</div><label>Flux <select class="fxs">${opt}</select></label>${k=='pv'?'<label>Prévu = <select class="src"><option value="contr">Contractuel</option><option value="capa">Capacité</option></select></label>':''}<label><span class="l1">Du</span> <input type="date" class="e1" value="${s.d1}"></label><label class="l2">Au <input type="date" class="e2" value="${s.d2}"></label></div><div class="note nn"></div><div class="row k4 kk"></div><div class="card"><h2>${c.a} vs ${c.b} <small class="gl"></small></h2><div class="ch tall"><canvas id="cc-${k}"></canvas></div></div><div class="card tw"><h2>Détail par période</h2><div class="scr"><table class="tt"></table></div></div>`;
 const q=x=>r.querySelector(x),redo=()=>renderCmp(k);
 q('.seg').onclick=e=>{const g=e.target.dataset.g;if(!g)return;s.gran=g;r.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b==e.target));if(g=='creneau'){const L=planInfo().dates;s.d1=s.d2=L.length?L[L.length-1]:s.d1;q('.e1').value=s.d1;q('.e2').value=s.d2}redo()};
 q('.fxs').onchange=e=>{s.fx=e.target.value;redo()};if(q('.src'))q('.src').onchange=e=>{s.src=e.target.value;redo()};
 q('.e1').onchange=e=>{s.d1=e.target.value||s.d1;if(s.gran=='creneau'){s.d2=s.d1;q('.e2').value=s.d2}redo()};q('.e2').onchange=e=>{s.d2=e.target.value||s.d2;redo()}}
function renderCmp(k){const s=CS[k],c=CF[k],r=$('#'+(k=='pv'?'p3':'p4')+' .cmp'),q=x=>r.querySelector(x),P=series(k),has=planInfo().rows.length>0,sl=s.gran=='creneau';
 let A=P.map(x=>x[1][c.ka]),B=P.map(x=>x[1][c.kb]);if(!sum(A))A=null;if(!has||!sum(B))B=null;
 q('.l1').textContent=sl?'Jour':'Du';q('.l2').style.display=sl?'none':'';
 q('.nn').style.display=(!has||(!A&&sl))?'':'none';q('.nn').textContent=!has?'Aucune donnée de planification / réalisé : importez un fichier (bouton ⬆ en haut) ou chargez la démo.':'Prévu par créneau indisponible : l\'onglet PREV par H du fichier Calcul CAPA ne contient que des zéros. Ajoutez une colonne « prevu » dans le fichier importé.';
 q('.gl').textContent='('+({mois:'par mois',semaine:'par semaine',jour:'par jour',creneau:'par créneau de 30 min'+(s.d1==s.d2?' · '+s.d1:' · moyenne/jour')})[s.gran]+' · '+(s.fx=='Tous'?'tous flux':s.fx)+(DATA.demo&&has?' · DÉMO':'')+')';
 const TA=A?sum(A):null,TB=B?sum(B):null,low=A&&B?P.filter((x,i)=>A[i]>0&&B[i]<A[i]).length:null;
 q('.kk').innerHTML=kpi([[c.a,TA==null?'—':fm(TA)],[c.b,TB==null?'—':fm(TB)],[c.tx,TA&&TB!=null?pc(TB/TA):'—'],['Périodes sous 100 %',low==null?'—':low+' / '+P.length]]);
 const tx=A&&B?P.map((x,i)=>A[i]?B[i]/A[i]*100:null):[];
 mk('cc-'+k,{data:{labels:P.map(x=>x[0]),datasets:[{type:'bar',label:c.a,data:A||[],backgroundColor:PAL[0]+'cc',borderRadius:4,order:2},{type:'bar',label:c.b,data:B||[],backgroundColor:PAL[k=='pv'?1:2]+'cc',borderRadius:4,order:2},{type:'line',label:c.tx+' %',data:tx,borderColor:PAL[3],yAxisID:'y1',pointRadius:sl||s.gran=='jour'?0:3,tension:.25,order:1},{type:'line',label:'Seuil 100 %',data:tx.map(()=>100),borderColor:'#e5484d',borderDash:[6,5],pointRadius:0,yAxisID:'y1',order:0}]},options:{scales:{x:{ticks:{maxTicksLimit:sl?14:16}},y:{beginAtZero:true},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{callback:v=>v+' %'}}},plugins:{legend:{position:'bottom'}}}});
 q('.tt').innerHTML='<tr><th>Période</th><th>'+c.a+'</th><th>'+c.b+'</th><th>Écart</th><th>Taux</th></tr>'+P.map((x,i)=>{const a=A?A[i]:null,b=B?B[i]:null,e=a!=null&&b!=null?b-a:null;return `<tr><td>${x[0]}</td><td>${a==null?'—':fm(a)}</td><td>${b==null?'—':fm(b)}</td><td style="color:var(--${e>=0?'ok':'ko'})">${e==null?'—':(e>0?'+':'')+fm(e)}</td><td>${e!=null&&a?`<span class="pill ${b>=a?'ok':'ko'}">${pc(b/a)}</span>`:'—'}</td></tr>`}).join('')}
async function impPlan(f){const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),J=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:'',raw:true}),rows=[];
 J.forEach(o=>{const g={};for(const k in o)g[norm(k)]=o[k];const d=isoD(g.date),fl=String(g.flux||'').trim();if(d&&fl)rows.push([d,hhmm(g.creneau),fl,+g.prevu||0,+g.planifie||0,+g.realise||0])});
 if(!rows.length)throw new Error('aucune ligne valide (colonnes attendues : date, creneau, flux, prevu, planifie, realise)');
 DATA.plan={rows};DATA.demo=false;PI=null;DATA.meta={...DATA.meta,plan:f.name,maj:new Date().toISOString().slice(0,10)};const I=planInfo();return rows.length+' lignes · '+I.fl.length+' flux · '+I.dates[0]+' → '+I.dates[I.dates.length-1]}
function modele(){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['date','creneau','flux','prevu','planifie','realise'],['2026-09-01','09:00','Voix Hyper',120,125,118],['2026-09-01','09:30','Voix Hyper',135,140,142],['2026-09-01','09:00','Voix Drive',150,148,139]]),'Planification');XLSX.writeFile(wb,'modele_planification.xlsx')}
const RN={p1:render1,p2:render2,p3:()=>renderCmp('pv'),p4:()=>renderCmp('pr')};let page='p1';
function go(p){page=p;$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p==p));$$('.pg').forEach(s=>s.classList.toggle('on',s.id==p));RN[p]()}
function setupCapa(){const C=DATA.capa;d1=C.dates[0];d2=C.dates[C.dates.length-1];$('#d1').value=d1;$('#d2').value=d2;
 $('#fx').innerHTML='<option>Tous</option>'+[...new Set(C.flux.map(f=>f.c))].map(c=>`<option>${c}</option>`).join('')+C.flux.map(f=>`<option>${f.k}</option>`).join('');fx='Tous';$('#fx').value='Tous'}
/* ---- Import Excel (SheetJS) ---- */
const RM=[['Hyper','Voix',126,213,300],['C2E','Voix',127,214,301],['AFR','Voix',128,215,302],['Drive','Voix',130,217,304],['SAV','Voix',131,218,305],['Hyper','Mail',139,226,313],['AFR','Mail',140,227,314],['Drive','Mail',142,229,316],['Chat','Autres',149,236,323],['Borne/LSA','Autres',150,237,324]];
const cell=(ws,r,c)=>ws[XLSX.utils.encode_cell({r:r-1,c:c-1})],val=(ws,r,c)=>{const x=cell(ws,r,c);return x&&typeof x.v=='number'?x.v:0};
async function sheet(f,name){const wb=XLSX.read(await f.arrayBuffer(),{type:'array',sheets:[name]});if(!wb.Sheets[name])throw new Error('onglet « '+name+' » introuvable');return wb.Sheets[name]}
const cap=s=>s.length<=3||s=='Hyper'?s:s[0]+s.slice(1).toLowerCase();
async function impRoadmap(f){const ws=await sheet(f,'AUCHAN');let c0=72;for(let c=1;c<200;c++){const x=cell(ws,3,c);if(x&&x.v=='S1__2026'){c0=c-1;break}}
 const S=r=>Array.from({length:52},(_,i)=>Math.round(val(ws,r,c0+i+1)*10)/10);
 DATA.roadmap=RM.map(([a,c,p,e,k])=>({a,c,prev:S(p),etp:S(e),capa:S(k)}));DATA.meta={...DATA.meta,roadmap:f.name,maj:new Date().toISOString().slice(0,10)};return DATA.roadmap.length+' activités × 52 semaines'}
async function impCapa(f){const ws=await sheet(f,'DAILY VISION'),e=XLSX.utils.decode_range(ws['!ref']),cols=[];
 for(let c=5;c<=e.e.c+1;c++){const x=cell(ws,15,c);if(x&&typeof x.v=='number')cols.push([c,new Date(Math.round((x.v-25569)*864e5)).toISOString().slice(0,10)])}
 let fl=[];for(let r=1;r<=e.e.r+1;r++){const t=cell(ws,r,4);if(t&&t.v=='Capacitaire en actes'){const A=String(cell(ws,r,1).v),B=String(cell(ws,r,2).v),c=A===A.toUpperCase()?A[0]+A.slice(1).toLowerCase():A,g=o=>cols.map(([k])=>Math.round(val(ws,r+o,k)));fl.push({k:c+' '+cap(B),c,a:cap(B),prev:g(-2),contr:g(-1),capa:g(0)})}}
 fl=fl.filter(f=>sum(f.prev)||sum(f.capa));const nz=cols.map((_,i)=>i).filter(i=>fl.some(f=>f.prev[i]||f.capa[i]));if(!nz.length)throw new Error('aucune donnée trouvée');
 const lo=nz[0],hi=nz[nz.length-1]+1;DATA.capa={dates:cols.map(c=>c[1]).slice(lo,hi),flux:fl.map(f=>({...f,prev:f.prev.slice(lo,hi),contr:f.contr.slice(lo,hi),capa:f.capa.slice(lo,hi)}))};
 DATA.meta={...DATA.meta,capa:f.name,maj:new Date().toISOString().slice(0,10)};return fl.length+' flux · '+DATA.capa.dates.length+' jours ('+DATA.capa.dates[0]+' → '+DATA.capa.dates.slice(-1)[0]+')'}
function bindImport(fid,sid,fn){$('#'+fid).onchange=async e=>{const f=e.target.files[0],s=$('#'+sid);if(!f)return;s.className='st';s.textContent='Lecture en cours…';
 try{s.textContent='✓ '+await fn(f);s.className='st ok';save();meta();if(fn==impCapa)setupCapa();initCmp();RN[page]()}catch(err){s.textContent='✗ '+err.message;s.className='st ko'}}}
/* ---- Init ---- */
(async()=>{try{await load()}catch(e){$('main').innerHTML='<p>Erreur de chargement des données : '+e+'</p>';return}
 meta();setupCapa();
 $('#nav').onclick=e=>e.target.dataset.p&&go(e.target.dataset.p);
 $('#seg1').onclick=e=>{if(!e.target.dataset.v)return;cur=e.target.dataset.v;$$('#seg1 button').forEach(b=>b.classList.toggle('on',b==e.target));render1()};
 $('#seg2').onclick=e=>{if(!e.target.dataset.v)return;gran=e.target.dataset.v;$$('#seg2 button').forEach(b=>b.classList.toggle('on',b==e.target));render2()};
 $('#fx').onchange=e=>{fx=e.target.value;render2()};$('#d1').onchange=e=>{d1=e.target.value||d1;render2()};$('#d2').onchange=e=>{d2=e.target.value||d2;render2()};
 $('#bimp').onclick=()=>$('#imp').showModal();$('#bcls').onclick=()=>$('#imp').close();
 $('#bexp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DATA)],{type:'application/json'}));a.download='data.json';a.click()};
 $('#brst').onclick=()=>{try{localStorage.removeItem('capaData')}catch(e){}location.reload()};
 bindImport('f1','s1',impRoadmap);bindImport('f2','s2',impCapa);bindImport('f3','s3',impPlan);
 $('#bmod').onclick=modele;$('#bdem').onclick=()=>{demo();meta();initCmp();RN[page]();$('#s3').textContent='✓ Démo chargée (28 jours, non enregistrée)';$('#s3').className='st ok'};
 initCmp();render1()})();
