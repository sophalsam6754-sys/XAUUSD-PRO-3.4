const $=id=>document.getElementById(id);
let apiKey=localStorage.getItem("xau_api_key")||"", symbol=localStorage.getItem("xau_symbol")||"XAU/USD", tf="5min";
let prices=[], candles=[];
$("apiKey").value=apiKey;$("symbol").value=symbol;

function ema(a,n){let k=2/(n+1), e=a[0]||0; return a.map((v,i)=>i?e=v*k+e*(1-k):e)}
function rsi(a,n=14){if(a.length<n+1)return 50;let g=0,l=0;for(let i=a.length-n;i<a.length;i++){let d=a[i]-a[i-1];g+=Math.max(d,0);l+=Math.max(-d,0)}return l?100-100/(1+g/l):100}
function draw(){
 const c=$("chart"),x=c.getContext("2d"),d=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;x.scale(d,d);x.fillStyle="#06162d";x.fillRect(0,0,w,h);
 if(!candles.length)return;
 let hi=Math.max(...candles.map(v=>v.h)),lo=Math.min(...candles.map(v=>v.l));let pad=18, sx=(w-pad*2)/Math.max(candles.length-1,1), sy=(h-pad*2)/(hi-lo||1);
 for(let gy=0;gy<6;gy++){let yy=pad+gy*(h-pad*2)/5;x.strokeStyle="#17314f";x.beginPath();x.moveTo(0,yy);x.lineTo(w,yy);x.stroke()}
 candles.forEach((v,i)=>{let xx=pad+i*sx,yo=pad+(hi-v.o)*sy,yc=pad+(hi-v.c)*sy,yh=pad+(hi-v.h)*sy,yl=pad+(hi-v.l)*sy;x.strokeStyle=v.c>=v.o?"#31c68a":"#ef626c";x.beginPath();x.moveTo(xx,yh);x.lineTo(xx,yl);x.stroke();x.fillStyle=v.c>=v.o?"#31c68a":"#ef626c";x.fillRect(xx-2,Math.min(yo,yc),4,Math.max(2,Math.abs(yc-yo)))});
 function line(vals,color){x.strokeStyle=color;x.lineWidth=2;x.beginPath();vals.forEach((v,i)=>{let xx=pad+i*sx,yy=pad+(hi-v)*sy;i?x.lineTo(xx,yy):x.moveTo(xx,yy)});x.stroke()}
 let cls=candles.map(v=>v.c);line(ema(cls,20),"#f3bd35");line(ema(cls,50),"#7da7ff");
}
function demo(){let p=4180;prices=[];candles=[];for(let i=0;i<90;i++){let o=p,c=o+(Math.random()-.45)*2.0,h=Math.max(o,c)+Math.random()*1.2,l=Math.min(o,c)-Math.random()*1.2;candles.push({o,c,h,l});p=c} update();draw()}
async function live(){
 if(!apiKey){demo();return}
 try{
  let u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tf}&outputsize=90&apikey=${encodeURIComponent(apiKey)}`;
  let r=await fetch(u);let j=await r.json();if(!j.values)throw Error(j.message||"API error");
  candles=j.values.reverse().map(v=>({o:+v.open,c:+v.close,h:+v.high,l:+v.low}));update();draw();
 }catch(e){$("signal").textContent="LIVE DATA ERROR — CHECK API KEY";demo()}
}
function update(){
 let cls=candles.map(v=>v.c), last=cls.at(-1), e20=ema(cls,20).at(-1),e50=ema(cls,50).at(-1),R=rsi(cls), mac=ema(cls,12).at(-1)-ema(cls,26).at(-1);
 let buy=e20>e50&&R>50&&mac>0, sell=e20<e50&&R<50&&mac<0, sig=buy?"BUY":sell?"SELL":"WAIT";
 $("signalText").textContent=sig;$("signalText").style.color=buy?"#42d49a":sell?"#ff6471":"#c4d0e2";$("signal").textContent=sig==="WAIT"?"NO CONFIRMED SIGNAL":`● ${sig}`;
 $("entry").textContent=last.toFixed(2);let atr=candles.slice(-14).reduce((s,v)=>s+v.h-v.l,0)/14;
 $("sl").textContent=(last+(buy?-1:1)*atr*1.3).toFixed(2);$("tp1").textContent=(last).toFixed(2);
 $("tp1").textContent=(last+(buy?1:-1)*atr*1.5).toFixed(2);$("tp2").textContent=(last+(buy?1:-1)*atr*2.5).toFixed(2);
 $("rsiVal").textContent=R.toFixed(1);$("rsiBar").style.width=R+"%";$("macdVal").textContent=mac.toFixed(3);$("macdLine").style.width=Math.min(100,50+mac*20)+"%";
}
document.querySelectorAll(".tf button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tf button").forEach(x=>x.classList.remove("active"));b.classList.add("active");tf=b.dataset.tf;live()});
function open(){ $("modal").style.display="block"} function close(){$("modal").style.display="none"}
$("settingsBtn").onclick=open;$("settingsNav").onclick=open;$("close").onclick=close;
$("save").onclick=()=>{apiKey=$("apiKey").value.trim();symbol=$("symbol").value.trim()||"XAU/USD";localStorage.setItem("xau_api_key",apiKey);localStorage.setItem("xau_symbol",symbol);close();live()};
setInterval(()=>{$("clock").textContent=new Date().toLocaleTimeString()},1000);
live();window.onresize=draw;