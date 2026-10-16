// Dashboard capacitaire : charge data/roadmap.json puis affiche les 3 pages
fetch('data/roadmap.json').then(r=>r.json()).then(D=>{
const W=D[0].prev.length,PAL=['#2a5bd7','#e07b00','#1a9e6e','#c2377a','#8a5cf6','#0aa4c4','#d6a400','#e5484d','#6b7585','#3d8f3d'];
const lab=Array.from({length:W},(_,i)=>'S'+(i+1)),fm=n=>Math.round(n).toLocaleString('fr-FR'),f1=n=>n.toLocaleString('fr-FR',{maximumFractionDigits:1});
const sum=a=>a.reduce((x,y)=>x+y,0),css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
let ch={},cur='Tous';
function mk(id,cfg){if(ch[id])ch[id].destroy();Chart.defaults.color=css('--mu');Chart.defaults.borderColor=css('--bd');cfg.options=Object.assign({responsive:true,maintainAspectRatio:false},cfg.options||{});ch[id]=new Chart(document.getElementById(id),cfg)}
function render1(){
 const S=D.map((d,i)=>({...d,i,col:PAL[i%10],name:d.c+' '+d.a})).filter(d=>cur=='Tous'||d.c==cur);
 const tot=sum(S.map(d=>sum(d.prev))),etp=Array.from({length:W},(_,w)=>sum(S.map(d=>d.etp[w])));
 document.getElementById('k1').innerHTML=[['Volume prévu 2026',fm(tot)+' actes'],['Activités',S.length],['ETP moyen requis',f1(sum(etp)/W)],['Pic ETP',f1(Math.max(...etp))+' ('+lab[etp.indexOf(Math.max(...etp))]+')']].map(k=>`<div class="card kpi"><span>${k[0]}</span><b>${k[1]}</b></div>`).join('');
 mk('c1',{type:'doughnut',data:{labels:S.map(d=>d.name),datasets:[{data:S.map(d=>sum(d.prev)),backgroundColor:S.map(d=>d.col),borderWidth:0}]},options:{plugins:{legend:{position:'right'},tooltip:{callbacks:{label:c=>c.label+' : '+fm(c.raw)+' ('+(c.raw/tot*100).toFixed(1)+' %)'}}}}});
 mk('c2',{type:'bar',data:{labels:lab,datasets:S.map(d=>({label:d.name,data:d.prev,backgroundColor:d.col}))},options:{scales:{x:{stacked:true,ticks:{maxTicksLimit:13}},y:{stacked:true}},plugins:{legend:{display:false}}}});
 mk('c3',{type:'line',data:{labels:lab,datasets:[{label:'ETP requis',data:etp,borderColor:css('--ac'),backgroundColor:'transparent',pointRadius:0,tension:.25}]},options:{scales:{x:{ticks:{maxTicksLimit:13}}},plugins:{legend:{display:false}}}});
 document.getElementById('t1').innerHTML='<tr><th>Activité</th><th>Channel</th><th>Volume prévu</th><th>Poids</th><th>ETP moy.</th><th>Capa (actes)</th><th>Couverture</th></tr>'+S.map(d=>{const v=sum(d.prev),c=sum(d.capa);return `<tr><td>${d.a}</td><td>${d.c}</td><td>${fm(v)}</td><td>${(v/tot*100).toFixed(1)} %<span class="bar" style="width:${v/tot*80}px"></span></td><td>${f1(sum(d.etp)/W)}</td><td>${fm(c)}</td><td>${v?(c/v*100).toFixed(0)+' %':'–'}</td></tr>`}).join('');
}
function render2(){
 const etp=Array.from({length:W},(_,w)=>sum(D.map(d=>d.etp[w])));
 document.getElementById('a1').textContent=f1(sum(etp)/W);
 mk('c4',{type:'line',data:{labels:lab,datasets:[{label:'ETP prévus (roadmap)',data:etp,borderColor:css('--ac'),backgroundColor:'transparent',pointRadius:0,tension:.25},{label:'ETP planifiés (à venir)',data:[],borderColor:'#e07b00',borderDash:[5,4]}]},options:{scales:{x:{ticks:{maxTicksLimit:13}}}}});
 document.getElementById('t2').innerHTML='<tr><th>Activité</th><th>Channel</th><th>ETP prévus</th><th>ETP planifiés</th><th>Écart</th><th>Couverture</th></tr>'+D.map(d=>`<tr><td>${d.a}</td><td>${d.c}</td><td>${f1(sum(d.etp)/W)}</td><td class="mu">—</td><td class="mu">—</td><td class="mu">—</td></tr>`).join('');
}
function render3(){
 mk('c5',{type:'line',data:{labels:lab,datasets:[{label:'Planifié (à venir)',data:[],borderColor:css('--ac')},{label:'Réalisé (à venir)',data:[],borderColor:'#1a9e6e'}]},options:{scales:{x:{ticks:{maxTicksLimit:13}}}}});
 document.getElementById('t3').innerHTML='<tr><th>Activité</th><th>Channel</th><th>H planifiées</th><th>H réalisées</th><th>Écart</th><th>Réalisation</th></tr>'+D.map(d=>`<tr><td>${d.a}</td><td>${d.c}</td><td class="mu">—</td><td class="mu">—</td><td class="mu">—</td><td class="mu">—</td></tr>`).join('');
}
const R={p1:render1,p2:render2,p3:render3};
document.getElementById('nav').onclick=e=>{const p=e.target.dataset.p;if(!p)return;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b==e.target));document.querySelectorAll('.pg').forEach(s=>s.classList.toggle('on',s.id==p));R[p]()};
document.getElementById('seg').onclick=e=>{const c=e.target.dataset.c;if(!c)return;cur=c;document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b==e.target));render1()};
render1();
}).catch(e=>{document.querySelector('main').innerHTML='<p>Erreur de chargement des données : '+e+'</p>'});

