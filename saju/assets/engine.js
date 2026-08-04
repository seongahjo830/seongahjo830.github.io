/* ═══ 강아지사주 공용 엔진 ═══
   만세력: 실계정 2건으로 보정 (1996-08-30=기해일 · 2026-07-26=신축일)
   이 파일은 01(앱 셸)과 향후 화면들이 공유. 수정 시 01/04 동작 모두 영향. */

const STEMS='갑을병정무기경신임계', BRANCHES='자축인묘진사오미신유술해';
const HANJA_S='甲乙丙丁戊己庚辛壬癸', HANJA_B='子丑寅卯辰巳午未申酉戌亥';
const STEM_ELEM=[0,0,1,1,2,2,3,3,4,4];           /* 목화토금수 */
const BRANCH_ELEM=[4,2,0,0,2,1,1,2,3,3,2,4];
const ELEM_COLOR=['#4c8c4a','#d9534f','#e0a832','#9a9a94','#3a3a3a'];
const ELEM_NAME=['나무(목)','불(화)','흙(토)','쇠(금)','물(수)'];
const ELEM_ICON=['🌳','🔥','⛰️','🪙','💧'];
const STEM_COLOR=['푸른','푸른','붉은','붉은','노란','노란','하얀','하얀','검은','검은'];
const ANIMALS=['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const ANIMAL_EMOJI=['🐭','🐮','🐯','🐰','🐲','🐍','🐴','🐑','🐵','🐔','🐶','🐷'];

const epochDays=(y,m,d)=>Math.floor(Date.UTC(y,m-1,d)/86400000);
const dayIdx=(y,m,d)=>((epochDays(y,m,d)+17)%60+60)%60;
function yearIdx(y,m,d){ const yy=(m<2||(m===2&&d<4))?y-1:y; return ((yy-4)%60+60)%60; }

/* 월주: 절기 근사 경계 + 五虎遁 */
const TERM=[[2,4],[3,6],[4,5],[5,6],[6,6],[7,7],[8,8],[9,8],[10,8],[11,7],[12,7],[1,6]];
function monthK(m,d){ const cur=m*100+d;
  if(cur>=106&&cur<204) return 11;
  for(let k=10;k>=0;k--){ const st=TERM[k][0]*100+TERM[k][1]; if(cur>=st) return k; }
  return 11; }
function monthPillar(y,m,d){ const k=monthK(m,d), ys=yearIdx(y,m,d)%10;
  return { s:([2,4,6,8,0][ys%5]+k)%10, b:(2+k)%12 }; }

/* 시주: 五鼠遁 · 자시 23:00~00:59 (01:00 정각은 원본 관례 따라 자시) */
function hourPillar(dI,h,min){ let mins=h*60+min; if(mins===60)mins=59;
  const bi=Math.floor(((mins+60)%1440)/120);
  return { s:([0,2,4,6,8][(dI%10)%5]+bi)%10, b:bi }; }

function fourPillars(y,m,d,h,min){
  const dI=dayIdx(y,m,d);
  return {
    hour:(h==null)?null:hourPillar(dI,h,min),
    day:{s:dI%10,b:dI%12},
    month:monthPillar(y,m,d),
    year:{s:yearIdx(y,m,d)%10,b:yearIdx(y,m,d)%12}
  };
}
const pName=p=>STEMS[p.s]+BRANCHES[p.b];
const animalOf=p=>STEM_COLOR[p.s]+' '+ANIMALS[p.b];

/* 오행 분포 — 4주(천간4+지지4=8글자)에서 목화토금수 개수 세기 (실제 사주 층) */
function elementCount(fp){
  const cnt=[0,0,0,0]; cnt[4]=0; // 목화토금수
  const cells=[fp.hour,fp.day,fp.month,fp.year].filter(Boolean);
  cells.forEach(p=>{ cnt[STEM_ELEM[p.s]]++; cnt[BRANCH_ELEM[p.b]]++; });
  const total=cells.length*2;
  const max=Math.max(...cnt), min=Math.min(...cnt);
  const strong=cnt.indexOf(max);                 // 가장 많은 오행
  const lack=cnt.map((v,i)=>[v,i]).filter(x=>x[0]===min)[0][1]; // 가장 적은 오행
  return { cnt, total, strong, lack, max, min };
}

/* 결정론 해시 (개인화 시드) */
function hashN(str,mod){ let h=0; for(const c of String(str)) h=(h*31+c.charCodeAt(0))>>>0; return h%mod; }
const pickN=(arr,seed,n)=>{ const out=[]; for(let i=0;out.length<n&&i<arr.length*3;i++){ const c=arr[(seed+i*7)%arr.length]; if(!out.includes(c)) out.push(c); } return out; };
