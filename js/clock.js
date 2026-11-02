export function startClock(A,T){
const{S,$}=A,F=window.DT_CLOCKS??={};let built=null;
/* Cada tema puede registrar su propia esfera: window.DT_CLOCKS.<tema>=()=>'markup SVG' (viewBox 0 0 200 200) y su CSS (.face .tk .tk5 .nm .hh .hm .hs .cap) */
let tk='';for(let i=0;i<60;i++){const b=i%5===0;tk+=`<line class="${b?'tk5':'tk'}" x1="100" y1="${b?9:11}" x2="100" y2="${b?21:16}" transform="rotate(${i*6} 100 100)"/>`}
let nm='';for(let i=1;i<=12;i++){const a=i*Math.PI/6;nm+=`<text class="nm" x="${(100+Math.sin(a)*67).toFixed(1)}" y="${(105-Math.cos(a)*67).toFixed(1)}" text-anchor="middle">${i}</text>`}
const face=(x='')=>`<circle class="face" cx="100" cy="100" r="96"/>${x}${tk}${nm}`;
F.basic??=()=>face();
F.persona5??=()=>`<defs><clipPath id="pcl"><circle cx="100" cy="100" r="93"/></clipPath></defs>${face(`<polygon clip-path="url(#pcl)" points="0,200 125,0 200,0 200,55 65,200" fill="#d10000"/>`)}`;
F.wii??=()=>face(`<ellipse cx="100" cy="55" rx="64" ry="34" fill="#fff" opacity=".6"/>`);
F.ds??=()=>face();
F.deltarune??=()=>face(`<circle cx="100" cy="100" r="88" fill="none" stroke="#2a2aa0" stroke-width="3" stroke-dasharray="6 4"/>`);
const hands='<line class="hh" id="ah" x1="100" y1="106" x2="100" y2="58"/><line class="hm" id="am" x1="100" y1="108" x2="100" y2="30"/><line class="hs" id="as" x1="100" y1="118" x2="100" y2="17"/><circle class="cap" cx="100" cy="100" r="5"/>';
const on=()=>S.analog!==0;
function apply(){const s=$('#aclock');s.style.display=on()?'':'none';document.body.classList.toggle('an',on());if(built!==S.theme){built=S.theme;s.innerHTML=(F[S.theme]||F.basic)()+hands}}
window.dtTick=d=>{apply();if(!on())return;const h=d.getHours()%12+d.getMinutes()/60,m=d.getMinutes()+d.getSeconds()/60,s=d.getSeconds(),r=(id,a)=>$('#'+id)?.setAttribute('transform',`rotate(${a} 100 100)`);r('ah',h*30);r('am',m*6);r('as',s*6)};
const old=A.R.look;A.R.look=()=>{old();$('#look h2').insertAdjacentHTML('afterend',`<label class=row>Reloj de inicio <select id=sA><option value=1>Analógico grande + digital</option><option value=0>Solo digital</option></select></label>`);$('#sA').value=on()?1:0};
document.addEventListener('change',e=>{if(e.target.id==='sA'){S.analog=+e.target.value;A.save();A.clock()}});
const ot=A.theme;A.theme=()=>{ot();apply();window.dtTick(new Date())};apply();A.clock()}
