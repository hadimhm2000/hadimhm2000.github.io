(function(){
  "use strict";
  var root=document.documentElement;
  var FA="۰۱۲۳۴۵۶۷۸۹";
  function fa(s){return String(s).replace(/\d/g,function(d){return FA[d]}).replace(/,/g,"٬").replace(/\./g,"٫")}
  function lang(){return root.getAttribute("lang")==="fa"?"fa":"en"}
  function loc(n){return lang()==="fa"?fa(n):String(n)}
  function group(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,",")}
  var listeners=[];
  function onLang(fn){listeners.push(fn)}

  var COMMON={
    en:{copy:"Copy",copied:"Copied",prev:"Previous step",next:"Next step"},
    fa:{copy:"کپی",copied:"کپی شد",prev:"مرحله‌ی قبل",next:"مرحله‌ی بعد"}
  };

  /* ---------- language ---------- */
  var bEn=document.getElementById("lang-en"),bFa=document.getElementById("lang-fa");
  function setLang(l,save){
    root.setAttribute("lang",l);root.setAttribute("dir",l==="fa"?"rtl":"ltr");
    if(bEn){bEn.setAttribute("aria-pressed",l==="en");bFa.setAttribute("aria-pressed",l==="fa")}
    var tm=document.querySelector('meta[name="x-titles"]'),t=tm&&tm.getAttribute("data-"+l);if(t)document.title=t;
    document.querySelectorAll("[data-copy-label]").forEach(function(el){el.textContent=COMMON[l].copy});
    var p=document.getElementById("prev"),n=document.getElementById("next");
    if(p)p.setAttribute("aria-label",COMMON[l].prev);if(n)n.setAttribute("aria-label",COMMON[l].next);
    if(save){try{localStorage.setItem("lang",l)}catch(e){}}
    listeners.forEach(function(fn){fn(l)});
  }
  if(bEn){bEn.addEventListener("click",function(){setLang("en",true)});bFa.addEventListener("click",function(){setLang("fa",true)})}

  /* ---------- nav border once scrolled ---------- */
  var top=document.querySelector(".top"),sentinel=document.getElementById("sentinel");
  if(top&&sentinel&&"IntersectionObserver" in window){
    new IntersectionObserver(function(es){top.classList.toggle("stuck",!es[0].isIntersecting)}).observe(sentinel);
  }

  /* ---------- copy email ---------- */
  document.querySelectorAll("[data-copy]").forEach(function(btn){
    var target=document.getElementById(btn.getAttribute("data-copy")),label=btn.querySelector("[data-copy-label]");
    btn.addEventListener("click",function(){
      function done(){label.textContent=COMMON[lang()].copied;setTimeout(function(){label.textContent=COMMON[lang()].copy},1800)}
      function fallback(){var r=document.createRange();r.selectNodeContents(target);var s=getSelection();s.removeAllRanges();s.addRange(r)}
      try{navigator.clipboard.writeText(target.textContent).then(done,fallback)}catch(e){fallback()}
    });
  });

  /* ---------- horizontal track arrows ---------- */
  var track=document.getElementById("track"),prev=document.getElementById("prev"),next=document.getElementById("next");
  if(track&&prev&&next){
    var step=function(){var c=track.firstElementChild;return c?c.getBoundingClientRect().width+14:300};
    var upd=function(){var max=track.scrollWidth-track.clientWidth,x=Math.abs(track.scrollLeft);prev.disabled=x<4;next.disabled=x>max-4};
    var go=function(d){var rtl=root.getAttribute("dir")==="rtl";track.scrollBy({left:(rtl?-1:1)*d*step(),behavior:"smooth"})};
    prev.addEventListener("click",function(){go(-1)});next.addEventListener("click",function(){go(1)});
    track.addEventListener("scroll",upd,{passive:true});window.addEventListener("resize",upd);onLang(function(){setTimeout(upd,50)});upd();
  }

  /* ---------- live national ID check ---------- */
  var idForm=document.getElementById("idcheck");
  if(idForm){
    var T={
      en:{check:"check",expect:"expected",got:"got",ok:"Valid. The check digit matches.",
          bad:function(e){return "Invalid. The last digit should be "+e+"."},
          len:function(n){return "Enter 10 digits ("+n+" so far)."},rep:"Invalid. Repeated digits are never a real ID."},
      fa:{check:"کنترل",expect:"expected",got:"got",ok:"معتبر است. رقم کنترل درست است.",
          bad:function(e){return "نامعتبر است. رقم آخر باید "+fa(e)+" باشد."},
          len:function(n){return "۱۰ رقم وارد کنید (تاکنون "+fa(n)+" رقم)."},rep:"نامعتبر است. کد ملی با ارقام تکراری وجود ندارد."}
    };
    var input=document.getElementById("nid"),digits=document.getElementById("digits"),math=document.getElementById("math"),verdict=document.getElementById("verdict");
    var EXAMPLE="1234567891",last="";
    var okIcon='<svg class="ico" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
    var norm=function(s){return s.replace(/[۰-۹]/g,function(c){return FA.indexOf(c)}).replace(/[٠-٩]/g,function(c){return "٠١٢٣٤٥٦٧٨٩".indexOf(c)}).replace(/\D/g,"").slice(0,10)};
    var render=function(anim){
      var t=T[lang()],v=norm(input.value);if(input.value!==v)input.value=v;
      var html="";
      for(var i=0;i<10;i++){
        var d=v[i]!==undefined?v[i]:"·",pop=anim&&v[i]!==last[i]&&v[i]!==undefined?" pop":"";
        html+='<div class="'+(i===9?"ck":"")+pop+'"><b>'+d+'</b><small>'+(i===9?t.check:"x"+(10-i))+'</small></div>';
      }
      digits.innerHTML=html;last=v;
      if(v.length<10){math.innerHTML="&nbsp;";verdict.className="verdict wait";verdict.textContent=t.len(v.length);return}
      var s=0;for(var j=0;j<9;j++)s+=(+v[j])*(10-j);
      var r=s%11,exp=r<2?r:11-r,got=+v[9];
      math.innerHTML='sum = <em>'+s+'</em> &nbsp; '+s+' mod 11 = <em>'+r+'</em> &nbsp; '+t.expect+' <em>'+exp+'</em>, '+t.got+' <em>'+got+'</em>';
      if(/^(\d)\1{9}$/.test(v)){verdict.className="verdict bad";verdict.textContent=t.rep;return}
      if(exp===got){verdict.className="verdict ok";verdict.innerHTML=okIcon+"<span>"+t.ok+"</span>"}
      else{verdict.className="verdict bad";verdict.textContent=t.bad(exp)}
    };
    input.addEventListener("input",function(){render(true)});
    idForm.addEventListener("submit",function(e){e.preventDefault()});
    document.getElementById("typo").addEventListener("click",function(){
      var v=norm(input.value);if(v.length<10)v=EXAMPLE;
      var i=Math.floor(Math.random()*9),nd=(+v[i]+1+Math.floor(Math.random()*8))%10;
      input.value=v.slice(0,i)+nd+v.slice(i+1);render(true);
    });
    document.getElementById("reset").addEventListener("click",function(){input.value=EXAMPLE;render(true)});
    onLang(function(){render(false)});
  }

  /* ---------- ownership share calculator (port of ownership_share.py) ---------- */
  var share=document.getElementById("share");
  if(share){
    var gcd=function(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){var t=a%b;a=b;b=t}return a};
    var F=function(n,d){if(d===undefined)d=1n;if(d<0n){n=-n;d=-d}var g=gcd(n,d)||1n;return{n:n/g,d:d/g}};
    var mul=function(a,b){return F(a.n*b.n,a.d*b.d)};
    var div=function(a,b){return F(a.n*b.d,a.d*b.n)};
    var parse=function(s){
      s=String(s).replace(/[۰-۹]/g,function(c){return FA.indexOf(c)}).replace(/[٫]/g,".").replace(/[٬,\s]/g,"");
      if(!/^\d+(\.\d+)?$|^\.\d+$/.test(s))return null;
      var p=s.split("."),dec=p[1]||"";
      return F(BigInt((p[0]||"0")+dec),10n**BigInt(dec.length));
    };
    var S={
      en:{all:"Whole property (6 dang)",dang:"Dang (out of 6)",sahm:"Shares out of",percent:"Percent",
          of:"of",level:"Level",add:"Add a level",remove:"Remove",
          fraction:"Exact share",dangOut:"In dang",value:"Share value",rial:"rials",
          invalid:"Each level must be a number greater than 0 and no more than the whole.",
          d_all:"the whole property",d_dang:function(n){return n+" dang"},d_pct:function(n){return n+"%"},d_sahm:function(n,d){return n+" of "+d+" shares"},
          tail:" of the whole property",join:", of "},
      fa:{all:"ششدانگ",dang:"دانگ",sahm:"سهم از",percent:"درصد",
          of:"از",level:"مرحله",add:"افزودن مرحله",remove:"حذف",
          fraction:"سهم دقیق",dangOut:"به دانگ",value:"ارزش سهم",rial:"ریال",
          invalid:"هر مرحله باید عددی بزرگ‌تر از صفر و حداکثر برابر با کل باشد.",
          d_all:"ششدانگ",d_dang:function(n){return n+" دانگ"},d_pct:function(n){return n+" درصد"},d_sahm:function(n,d){return n+" سهم از "+d+" سهم"},
          tail:" از ششدانگ",join:"، از "}
    };
    var rows=document.getElementById("share-rows"),out=document.getElementById("share-out"),valueIn=document.getElementById("share-value");
    var chain=[{k:"sahm",n:"0.5",d:"185"},{k:"dang",n:"3"}];
    var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
    var draw=function(){
      var t=S[lang()],h="";
      chain.forEach(function(l,i){
        h+='<div class="srow"><span class="sidx">'+loc(i+1)+'</span>'+
          '<select aria-label="'+t.level+' '+(i+1)+'" data-i="'+i+'" data-f="k">'+
          ["sahm","dang","percent","all"].map(function(k){return '<option value="'+k+'"'+(l.k===k?" selected":"")+'>'+t[k]+'</option>'}).join("")+'</select>'+
          (l.k==="all"?'<span></span>':'<input inputmode="decimal" aria-label="'+t.level+' '+(i+1)+'" data-i="'+i+'" data-f="n" value="'+esc(l.n||"")+'">')+
          (l.k==="sahm"?'<input inputmode="decimal" aria-label="'+t.of+'" data-i="'+i+'" data-f="d" value="'+esc(l.d||"")+'">':'<span></span>')+
          (chain.length>1?'<button type="button" class="chipbtn" data-rm="'+i+'">'+t.remove+'</button>':'<span></span>')+'</div>';
      });
      rows.innerHTML=h;
      document.getElementById("share-add").textContent=t.add;
      document.getElementById("share-add").disabled=chain.length>=4;
      compute();
    };
    var fmtDec=function(f,places){ /* fraction -> decimal string, trimmed */
      var neg=f.n<0n,n=neg?-f.n:f.n,ip=n/f.d,rem=n%f.d,s=String(ip),dec="";
      for(var i=0;i<places&&rem;i++){rem*=10n;dec+=String(rem/f.d);rem%=f.d}
      dec=dec.replace(/0+$/,"");return (neg?"-":"")+s+(dec?"."+dec:"");
    };
    var compute=function(){
      var t=S[lang()],total=F(1n),parts=[],ok=true;
      chain.forEach(function(l){
        var f;
        if(l.k==="all"){f=F(1n);parts.push(t.d_all);}
        else{
          var n=parse(l.n);if(!n){ok=false;return}
          if(l.k==="dang"){f=div(n,F(6n));parts.push(t.d_dang(loc(l.n)))}
          else if(l.k==="percent"){f=div(n,F(100n));parts.push(t.d_pct(loc(l.n)))}
          else{var d=parse(l.d);if(!d||d.n===0n){ok=false;return}f=div(n,d);parts.push(t.d_sahm(loc(l.n),loc(l.d)))}
        }
        if(!(f.n>0n&&f.n<=f.d)){ok=false;return}
        total=mul(total,f);
      });
      var v=parse(valueIn.value);
      if(!ok||!v){out.innerHTML='<p class="verdict bad">'+t.invalid+'</p>';return}
      var q=mul(v,total),rial=(2n*q.n+q.d)/(2n*q.d);
      var desc=(chain.length===1&&chain[0].k==="all")?t.d_all:parts.join(t.join)+t.tail;
      out.innerHTML=
        '<p class="sdesc">'+esc(desc)+'</p>'+
        '<dl class="sres">'+
        '<div><dt>'+t.fraction+'</dt><dd class="ltr mono">'+loc(String(total.n))+' / '+loc(String(total.d))+'</dd></div>'+
        '<div><dt>'+t.dangOut+'</dt><dd class="mono ltr">'+loc(fmtDec(mul(total,F(6n)),6))+'</dd></div>'+
        '<div class="sv"><dt>'+t.value+'</dt><dd><b class="num">'+loc(group(String(rial)))+'</b> '+t.rial+'</dd></div>'+
        '</dl>';
    };
    rows.addEventListener("input",function(e){var el=e.target,i=+el.getAttribute("data-i");if(isNaN(i))return;chain[i][el.getAttribute("data-f")]=el.value;compute()});
    rows.addEventListener("change",function(e){var el=e.target;if(el.tagName!=="SELECT")return;var i=+el.getAttribute("data-i");chain[i]={k:el.value,n:el.value==="dang"?"3":el.value==="percent"?"50":"1",d:"2"};draw()});
    rows.addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(!b)return;chain.splice(+b.getAttribute("data-rm"),1);draw()});
    document.getElementById("share-add").addEventListener("click",function(){if(chain.length<4){chain.push({k:"dang",n:"6"});draw()}});
    valueIn.addEventListener("input",compute);
    onLang(draw);
  }

  /* ---------- nearest valued block: ring search (mirrors find_nearest_valued) ---------- */
  document.querySelectorAll("canvas[data-rings]").forEach(function(cv){
    var RINGS=[50,100,175,250,350,500,700,900];
    var big=cv.hasAttribute("data-big");
    var ctx=cv.getContext("2d"),W=0,H=0,dpr=1,col={},blocks=[],state=null,raf=0,visible=true;
    var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    var css=function(n){return getComputedStyle(root).getPropertyValue(n).trim()};
    var readColors=function(){col={bg:css("--surface"),line:css("--line"),dot:css("--dot"),ink:css("--ink"),ink2:css("--ink-2"),ink3:css("--ink-3"),acc:css("--accent"),soft:css("--accent-soft"),blk:css("--block")}};
    var size=function(){
      var r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);
      W=Math.max(10,r.width);H=Math.max(10,r.height);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    var scale=function(){return Math.min(W,H)*0.47/Math.sqrt(900)};
    var layout=function(){
      blocks=[];var cell=big?30:24,gap=6,cx=W/2,cy=H/2,park=(big?70:52)+Math.random()*(big?70:50);
      var ox=((cx%(cell+gap))+(cell+gap))%(cell+gap)-cell/2-gap;
      for(var y=-cell;y<H+cell;y+=cell+gap){
        for(var x=ox-cell;x<W+cell;x+=cell+gap){
          var w=cell*(Math.random()<.18?2:1)+(Math.random()<.18?gap:0);
          var mx=x+w/2,my=y+cell/2,dist=Math.hypot(mx-cx,my-cy);
          var valued=dist>park&&Math.random()>.14;
          blocks.push({x:x,y:y,w:Math.min(w,cell),h:cell,v:valued});
        }
      }
      state={t0:performance.now(),ring:-1,probes:[],hit:null,done:false};
    };
    var inside=function(px,py){for(var i=0;i<blocks.length;i++){var b=blocks[i];if(px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h)return b}return null};
    var probesFor=function(idx){
      var m=RINGS[idx],n=m<=500?8:12,start=(idx%2)*(180/n),r=Math.sqrt(m)*scale(),pts=[];
      for(var i=0;i<n;i++){var a=(start+i*360/n-90)*Math.PI/180;pts.push({x:W/2+r*Math.cos(a),y:H/2+r*Math.sin(a)})}
      return pts;
    };
    var label=function(){
      var L=lang();
      if(state.hit)return L==="fa"?"نزدیک‌ترین بلوک دارای ارزش: "+fa(RINGS[state.hit.ring])+" متر":"Nearest valued block: "+RINGS[state.hit.ring]+" m";
      if(state.ring<0)return L==="fa"?"این نقطه ارزش منطقه‌ای ندارد":"No published value at this point";
      return L==="fa"?"جستجوی حلقه‌ی "+fa(RINGS[state.ring])+" متری":"Searching the "+RINGS[state.ring]+" m ring";
    };
    var paint=function(now){
      ctx.clearRect(0,0,W,H);
      var cx=W/2,cy=H/2,k=scale();
      blocks.forEach(function(b){
        ctx.fillStyle=b.v?col.soft:"transparent";ctx.strokeStyle=col.line;ctx.lineWidth=1;
        var hit=state.hit&&state.hit.b===b;
        if(hit)ctx.fillStyle=col.acc;
        roundRect(b.x,b.y,b.w,b.h,4);if(b.v||hit)ctx.fill();if(!b.v)ctx.stroke();
      });
      for(var i=0;i<=state.ring&&i<RINGS.length;i++){
        var r=Math.sqrt(RINGS[i])*k,grow=1;
        if(i===state.ring&&!state.done){grow=Math.max(0,Math.min(1,(now-state.ringT)/320))}
        ctx.beginPath();ctx.arc(cx,cy,r*grow,0,Math.PI*2);ctx.strokeStyle=col.ink3;ctx.globalAlpha=i===state.ring?.9:.35;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      }
      state.probes.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,p.hit?5:2.6,0,Math.PI*2);ctx.fillStyle=p.hit?col.acc:col.ink2;ctx.fill();});
      if(state.hit){
        var p=state.hit.p;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.strokeStyle=col.acc;ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.strokeStyle=col.acc;ctx.stroke();
      }
      /* pin */
      ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fillStyle=col.ink;ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy,13,0,Math.PI*2);ctx.strokeStyle=col.ink;ctx.globalAlpha=.25;ctx.lineWidth=5;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=1;
      /* caption */
      var txt=label();ctx.font=(lang()==="fa"?"500 13px Vazirmatn, Tahoma, sans-serif":"500 13px 'Geist', system-ui, sans-serif");
      var tw=ctx.measureText(txt).width+24,tx=(W-tw)/2,ty=H-44;
      ctx.fillStyle=col.bg;ctx.strokeStyle=col.line;roundRect(tx,ty,tw,30,15);ctx.fill();ctx.stroke();
      ctx.fillStyle=state.hit?col.acc:col.ink;ctx.textBaseline="middle";ctx.textAlign="center";ctx.direction=lang()==="fa"?"rtl":"ltr";ctx.fillText(txt,W/2,ty+15);
    };
    var roundRect=function(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()};
    var advance=function(now){
      state.ring++;state.ringT=now;
      if(state.ring>=RINGS.length){state.done=true;state.doneT=now;return}
      probesFor(state.ring).forEach(function(p){
        var b=inside(p.x,p.y);var pr={x:p.x,y:p.y,hit:false};
        if(b&&b.v&&!state.hit){pr.hit=true;state.hit={b:b,p:pr,ring:state.ring}}
        state.probes.push(pr);
      });
      if(state.hit){state.done=true;state.doneT=now}
    };
    var finish=function(){while(!state.done)advance(performance.now())};
    var loop=function(now){
      raf=0;if(!visible)return;
      if(!state.done&&now-state.t0>900+(state.ring+1)*620)advance(now);
      if(state.done&&now-state.doneT>2600){layout()}
      paint(now);raf=requestAnimationFrame(loop);
    };
    var start=function(){readColors();size();layout();var t=performance.now();state.t0=t-900-620*3;while(state.ring<2&&!state.done)advance(t);paint(t);state.t0=t;if(reduce){finish();paint(performance.now());return}if(!raf)raf=requestAnimationFrame(loop)};
    start();
    window.addEventListener("resize",function(){size();layout();var t=performance.now();while(state.ring<2&&!state.done)advance(t);if(reduce)finish();paint(t)});
    if(window.matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){readColors();paint(performance.now())});
    new MutationObserver(function(){readColors();if(reduce)paint(performance.now())}).observe(root,{attributes:true,attributeFilter:["data-theme","lang"]});
    if("IntersectionObserver" in window&&!reduce){
      new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(loop)}).observe(cv);
    }
  });

  /* ---------- start ---------- */
  var startLang="en";
  try{var s=localStorage.getItem("lang");if(s==="fa"||s==="en")startLang=s}catch(e){}
  if(location.hash==="#fa")startLang="fa";
  setLang(startLang,false);
})();
