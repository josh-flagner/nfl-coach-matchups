const state={rawMatchups:[],rows:[],filtered:[],sortKey:'winPct',sortDir:'desc',names:{}};
const $=id=>document.getElementById(id);
const els={search:$('search'),pctMin:$('pct-min'),pctMax:$('pct-max'),gamesMin:$('games-min'),gamesMax:$('games-max'),weekMin:$('week-min'),opponentRecord:$('opponent-record'),playoffs:$('playoffs'),body:$('records'),empty:$('empty'),count:$('result-count'),details:$('details'),log:$('game-log')};
const fmtPct=n=>n.toFixed(3).replace(/^0/,'');
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const teamName=code=>state.names[code]||code;

function gameEligible(g){
  const weekMin=Number(els.weekMin.value);
  if(g.weekIndex<weekMin)return false;
  if(els.playoffs.value==='exclude'&&g.postseason)return false;
  if(els.playoffs.value==='only'&&!g.postseason)return false;
  const choice=els.opponentRecord.value,p=g.opponentWinPctBefore;
  if(choice==='all')return true;
  if(p===null)return false;
  return choice==='above'?p>.5:choice==='atleast'?p>=.5:choice==='below'?p<.5:choice==='atmost'?p<=.5:p===.5;
}

function rebuildRecords(){
  const coaches=new Map();
  state.rawMatchups.forEach(matchup=>{
    const games=matchup.gameLog.filter(gameEligible);
    if(!games.length)return;
    let coach=coaches.get(matchup.coach);
    if(!coach){coach={coach:matchup.coach,teams:new Set(),wins:0,losses:0,ties:0,gamesPlayed:0,opponents:[]};coaches.set(matchup.coach,coach);}
    const opponent={opponent:matchup.opponent,opponentName:matchup.opponentName,wins:0,losses:0,ties:0,gamesPlayed:games.length};
    games.forEach(g=>{coach.teams.add(g.team);coach.gamesPlayed++;if(g.result==='W'){coach.wins++;opponent.wins++;}else if(g.result==='L'){coach.losses++;opponent.losses++;}else{coach.ties++;opponent.ties++;}});
    opponent.winPct=(opponent.wins+opponent.ties*.5)/opponent.gamesPlayed;
    coach.opponents.push(opponent);
  });
  state.rows=[...coaches.values()].map(c=>{c.teams=[...c.teams].sort();c.teamSearch=c.teams.map(teamName).join(' ');c.winPct=(c.wins+c.ties*.5)/c.gamesPlayed;c.opponents.sort((a,b)=>b.gamesPlayed-a.gamesPlayed||b.winPct-a.winPct||a.opponentName.localeCompare(b.opponentName));return c;});
}

function apply(){
  rebuildRecords();
  const q=els.search.value.trim().toLowerCase();
  const pmin=els.pctMin.value===''?null:Number(els.pctMin.value)/100;
  const pmax=els.pctMax.value===''?null:Number(els.pctMax.value)/100;
  const gmin=els.gamesMin.value===''?null:Number(els.gamesMin.value);
  const gmax=els.gamesMax.value===''?null:Number(els.gamesMax.value);
  state.filtered=state.rows.filter(r=>{const hay=`${r.coach} ${r.teams.join(' ')} ${r.teams.map(teamName).join(' ')}`.toLowerCase();return (!q||hay.includes(q))&&(pmin===null||r.winPct>=pmin)&&(pmax===null||r.winPct<=pmax)&&(gmin===null||r.gamesPlayed>=gmin)&&(gmax===null||r.gamesPlayed<=gmax);});
  sortAndRender();
}

function sortAndRender(){
  const dir=state.sortDir==='asc'?1:-1,key=state.sortKey;
  state.filtered.sort((a,b)=>{const av=a[key],bv=b[key];const base=typeof av==='string'?av.localeCompare(bv):av-bv;return base*dir||b.gamesPlayed-a.gamesPlayed||a.coach.localeCompare(b.coach);});
  els.body.innerHTML=state.filtered.map((r,i)=>`<tr tabindex="0" data-index="${i}" aria-label="${safe(r.coach)}, ${r.wins} wins, ${r.losses} losses, ${r.ties} ties for the selected games"><td><span class="coach">${safe(r.coach)}</span><span class="sub">${r.opponents.length} opponents in selection</span></td><td><span class="team-list">${r.teams.map(t=>`<span class="team-chip">${safe(t)}</span>`).join('')}<span>${r.teams.map(t=>safe(teamName(t))).join(', ')}</span></span></td><td class="num">${r.gamesPlayed}</td><td class="num">${r.wins}</td><td class="num">${r.losses}</td><td class="num">${r.ties}</td><td class="num pct ${r.winPct<.5?'losing':''}">${fmtPct(r.winPct)}</td></tr>`).join('');
  els.count.textContent=state.filtered.length.toLocaleString();els.empty.hidden=state.filtered.length!==0;
  document.querySelectorAll('th button').forEach(b=>{const active=b.dataset.sort===state.sortKey;b.classList.toggle('active',active);b.querySelector('span').textContent=active?(state.sortDir==='asc'?'↑':'↓'):'';});
}

function openDetails(r){
  $('detail-title').textContent=`${r.coach} by opponent`;
  $('detail-record').textContent=`${r.wins}–${r.losses}${r.ties?`–${r.ties}`:''} · ${fmtPct(r.winPct)} in ${r.gamesPlayed} selected games`;
  els.log.innerHTML=r.opponents.map(o=>`<tr><td><span class="team-cell"><span class="team-chip">${safe(o.opponent)}</span><span>${safe(o.opponentName)}</span></span></td><td>${o.gamesPlayed}</td><td>${o.wins}–${o.losses}–${o.ties}</td><td><span class="pct ${o.winPct<.5?'losing':''}">${fmtPct(o.winPct)}</span></td></tr>`).join('');
  els.details.showModal();
}

document.querySelectorAll('.controls input,.controls select').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',apply));
$('reset').addEventListener('click',()=>{document.querySelectorAll('.controls input').forEach(i=>i.value='');document.querySelectorAll('.controls select').forEach(s=>s.selectedIndex=0);apply();els.search.focus();});
document.querySelectorAll('th button').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.sort;if(state.sortKey===k)state.sortDir=state.sortDir==='asc'?'desc':'asc';else{state.sortKey=k;state.sortDir=['coach','teamSearch'].includes(k)?'asc':'desc';}sortAndRender();}));
els.body.addEventListener('click',e=>{const tr=e.target.closest('tr');if(tr)openDetails(state.filtered[Number(tr.dataset.index)]);});
els.body.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('tr')){e.preventDefault();openDetails(state.filtered[Number(e.target.dataset.index)]);}});
$('close-dialog').addEventListener('click',()=>els.details.close());
els.details.addEventListener('click',e=>{if(e.target===els.details)els.details.close();});

fetch('data.json').then(r=>{if(!r.ok)throw new Error('Data failed to load');return r.json();}).then(data=>{state.names=data.teamNames;state.rawMatchups=data.rows;$('coverage').textContent=`NFL regular season and playoffs · ${data.meta.firstSeason}–${data.meta.lastSeason}`;$('source-note').textContent=`Results through ${new Date(data.meta.through+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}. Opponent record is measured before kickoff; ties count as half a win.`;apply();}).catch(()=>{els.empty.hidden=false;els.empty.textContent='The matchup data could not be loaded. Please refresh.';});
