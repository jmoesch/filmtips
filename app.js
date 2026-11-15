const GEN={J:"Jul",D:"Drama",K:"Komedi",T:"Thriller",A:"Action",V:"Äventyr",F:"Sci-fi",Y:"Fantasy",S:"Skräck",R:"Romantik",C:"Kriminal",Q:"Mysterium",N:"Animerat",B:"Familj",H:"Historiskt",W:"Krig",M:"Musik/musikal",E:"Western",O:"Dokumentär"};
const NORDIC=new Set(["sv","da","no","fi"]);
const KNOWN=new Set(["en","sv","da","no","fi","ko","ja","fr","es","de","it","hi","zh"]);
const S={typ:"f",genres:new Set(),shown:20};
const $=id=>document.getElementById(id);
let items=[];
function prepare(DATA){return DATA.map(r=>{const [t,y,type,g,by,cast,imdb,votes,lang,id,sv,original]=r;
  return {t,y,id,sv,type,g,by,cast:cast?cast.split("/"):[],imdb,votes,lang,
    hay:(original+" "+t+" "+sv+" "+y+" "+by+" "+cast).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")};});}

const gEl=$("genres");
Object.entries(GEN).forEach(([k,name])=>{const b=document.createElement("button");b.type="button";b.className="chip"+(k==="J"?" jul":"");
  b.textContent=name;b.setAttribute("aria-pressed","false");b.dataset.k=k;
  b.onclick=()=>{S.genres.has(k)?S.genres.delete(k):S.genres.add(k);b.setAttribute("aria-pressed",S.genres.has(k));S.shown=20;update();};gEl.append(b);});
$("typ").querySelectorAll("button").forEach(b=>b.onclick=()=>{S.typ=b.dataset.v;$("typ").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));S.shown=20;update();});
["q","from","to","lang","sort"].forEach(id=>$(id).addEventListener("input",()=>{S.shown=20;update();}));
$("more").onclick=()=>{S.shown+=20;update();};
$("reset").onclick=()=>{S.genres.clear();document.querySelectorAll("#genres .chip").forEach(c=>c.setAttribute("aria-pressed","false"));
  $("q").value="";$("from").value="";$("to").value="";$("lang").value="";$("sort").value="wr";
  S.typ="f";$("typ").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.v==="f"));S.shown=20;update();};

function rank(items){
  const mean=items.reduce((sum,it)=>sum+it.imdb,0)/items.length;
  for(const it of items) it.wr=(it.votes*it.imdb+25000*mean)/(it.votes+25000);
}
const fmt=n=>n>=1e6?(n/1e6).toLocaleString("sv-SE",{maximumFractionDigits:1})+" milj.":n.toLocaleString("sv-SE");
function filtered(){
  const q=$("q").value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const words=q?q.split(/\s+/):[];
  const yf=+$("from").value||0,yt=+$("to").value||9999,lang=$("lang").value,sort=$("sort").value;
  let out=items.filter(it=>{
    if(S.typ&&it.type!==S.typ)return false;
    for(const g of S.genres)if(!it.g.includes(g))return false;
    if(it.y<yf||it.y>yt)return false;
    if(!languageMatches(it.lang,lang))return false;
    for(const w of words)if(!it.hay.includes(w))return false;
    return true;});
  const key={wr:it=>it.wr,imdb:it=>it.imdb,votes:it=>it.votes,year:it=>it.y}[sort];
  out.sort((a,b)=>{const x=key(a),y=key(b);if(x==null&&y==null)return b.votes-a.votes;if(x==null)return 1;if(y==null)return -1;return y-x||b.votes-a.votes;});
  return out;
}
let QW=[];
function card(it,i){
  const li=document.createElement("li");li.className="card";
  const r=document.createElement("div");r.className="rank";r.textContent=i+1;
  const t=document.createElement("div");t.className="ttl";
  const h=document.createElement("h3"),a=document.createElement("a");
  a.href=it.id?"https://www.imdb.com/title/"+it.id+"/":"https://www.imdb.com/find/?q="+encodeURIComponent(it.t+" "+it.y);a.target="_blank";a.rel="noopener";
  a.textContent=`${it.t} (${it.y})`;h.append(a);
  const m=document.createElement("div");m.className="meta";
  const bits=[it.sv?"Svenska: "+it.sv:"",it.type==="s"?"Serie":"Film",[...it.g].sort((a,b)=>(b==="J")-(a==="J")).map(k=>GEN[k]).filter(Boolean).slice(0,3).join(", ")];
  if(it.by)bits.push(it.by);if(it.cast.length){let shown=it.cast.slice(0,3);
    if(QW.length)for(const c of it.cast.slice(3)){const cl=c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");if(QW.some(w=>cl.includes(w)))shown.push(c);}
    bits.push("Med "+shown.join(", "));}
  m.textContent=bits.filter(Boolean).join(" · ");t.append(h,m);
  const s=document.createElement("div");s.className="scores";
  const add=(cls,lab,val)=>{const e=document.createElement("span");e.className="sc "+cls;const l=document.createElement("span");l.textContent=lab;const b=document.createElement("b");b.textContent=val;e.append(l,b);s.append(e);};
  if(it.imdb!=null)add("imdb","IMDb",it.imdb.toFixed(1).replace(".",","));
  add("v","Röster",fmt(it.votes));
  t.append(s);li.append(r,t);return li;
}
function update(){
  const res=filtered(),ol=$("list");
  QW=$("q").value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/\s+/).filter(Boolean);
  ol.replaceChildren(...res.slice(0,S.shown).map(card));
  if(!res.length){const e=document.createElement("li");e.className="empty";
    e.textContent=yInvalid()?"Från-året ligger efter till-året.":"Inga titlar matchar. Prova att ändra sökningen eller rensa filtren.";ol.append(e);}
  const nf=n=>n.toLocaleString("sv-SE");

  $("count").textContent=(res.length===1?"1 titel matchar":nf(res.length)+" titlar matchar");
  $("listTitle").textContent=res.length>20?(S.shown>=res.length?"Alla "+nf(res.length):"Topp "+Math.min(S.shown,res.length)):"Topplista";
  $("more").hidden=S.shown>=res.length;
}
function yInvalid(){return $("from").value && $("to").value && +$("from").value > +$("to").value;}
function languageMatches(code, filter){
  switch(filter){
    case "": return true;
    case "unknown": return !code;
    case "foreign": return !!code && code !== "en";
    case "nordic": return NORDIC.has(code);
    case "other": return !!code && !KNOWN.has(code);
    default: return code === filter;
  }
}
const languageLabels = Array.from($("lang").options,o=>[o.value,o.textContent]);
languageLabels.push(["unknown","Okänt språk"]);
function readCatalog(data){
  if(data?.schema===1 && Array.isArray(data.rows)){
    const rows=data.rows.map(row=>{
      if(!Array.isArray(row)||row.length!==14)throw Error("Ogiltig katalograd.");
      return [...row.slice(0,7),...row.slice(9)];
    });
    data={schema:2,datum:data.datum,rows};
  }
  validate(data);
  return data;
}
function validate(data){
  if(data?.schema!==2 || typeof data.datum!=="string" || !Array.isArray(data.rows) || !data.rows.length)
    throw Error("Välj en giltig katalog.json för Filmtips.");
  const ids=new Set();
  for(const r of data.rows){
    const strings=[0,3,4,5,8,9,10,11];
    if(!Array.isArray(r)||r.length!==12||!strings.every(i=>typeof r[i]==="string")
      ||!r[0]||!Number.isInteger(r[1])||!["s","f"].includes(r[2])||!/^tt\d+$/.test(r[9])||ids.has(r[9])
      ||!Number.isFinite(r[6])||r[6]<0||r[6]>10||!Number.isInteger(r[7])||r[7]<0)
      throw Error("Katalogen innehåller en skadad titel.");
    ids.add(r[9]);
  }
}
function showCatalog(data){
  items=prepare(data.rows);
  rank(items);
  const filter=$("lang").value;
  $("lang").replaceChildren(...languageLabels.map(([key,label])=>
    new Option(label+" ("+fmt(items.filter(it=>languageMatches(it.lang,key)).length)+")",key)));
  $("lang").value=filter;
  $("info").textContent="Katalog "+data.datum+" · "+fmt(items.length)+" titlar.";
  $("panel").hidden=$("results").hidden=true;
  S.shown=20;update();
  $("panel").hidden=$("results").hidden=false;
}
function openStore(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("filmtips-"+location.pathname.replace(/index\.html$/,""),1);
    req.onupgradeneeded=()=>req.result.createObjectStore("catalog");
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function stored(data){
  const db=await openStore();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction("catalog",data?"readwrite":"readonly"),store=tx.objectStore("catalog");
      const request=data?store.put(data,"active"):store.get("active");
      tx.oncomplete=()=>resolve(request.result);
      tx.onabort=()=>reject(tx.error||Error("Lagringen avbröts."));
    });
  } finally {db.close();}
}
async function startup(){
  $("import").disabled=true;
  try{
    const prior=await stored();
    if(prior)showCatalog(readCatalog(prior));
  }catch{ /* A hosted catalogue can still be opened. */ }
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch("./katalog.json",{cache:"no-cache",signal:controller.signal});
    if(!response.ok)throw Error("Ingen katalog på webbplatsen.");
    const data=readCatalog(await response.json());
    showCatalog(data);
    try{
      await stored(data);
      $("notice").textContent="";
    }catch{
      $("notice").textContent="Katalogen är öppen. Den kunde inte sparas för offlinebruk.";
    }
  }catch{
    $("notice").textContent=items.length?"Visar den sparade katalogen.":"Välj Läs in katalog för att öppna katalog.json.";
  }finally{
    clearTimeout(timeout);
    $("import").disabled=false;
  }
}
$("import").onclick=()=>$("file").click();
$("file").onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  $("import").disabled=true;
  try{
    const data=readCatalog(JSON.parse(await file.text()));
    await stored(data);showCatalog(data);
    $("notice").textContent="Katalogen är sparad på den här enheten.";
  }catch(error){$("notice").textContent="Importen misslyckades. Kontrollera filen och ledigt lagringsutrymme.";}
  finally{$("file").value="";$("import").disabled=false;}
};
startup();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{
  const message=document.createElement("p");message.textContent="Offlineläget kunde inte aktiveras.";document.querySelector("footer").append(message);
});
