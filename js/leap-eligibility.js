/* ============================================================
   Leap Eligibility — embeddable widget
   ------------------------------------------------------------
   Add to any page:
     <link rel="stylesheet" href="leap-eligibility.css">
     <script src="leap-eligibility.js" defer></script>
   Opens on any "Check my eligibility" button/link, or any element
   with data-open-eligibility, or via LeapEligibility.open().
   Set the three CONFIG values below before deploying.
   ============================================================ */
(function(){
  "use strict";
  if(window.__leapEligibilityInit) return;   // never initialize twice, even if included twice
  window.__leapEligibilityInit = true;
  if(!document.querySelector('link[href*="Cormorant+Garamond"]')){
    var f=document.createElement("link"); f.rel="stylesheet";
    f.href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Jost:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(f);
  }
  // Turnstile loads lazily (only at the verification step) to avoid duplicating
  // any copy the host site already loads — see mountTurnstile() below.
  var MODAL_HTML = `<div class="modal" id="modal" aria-hidden="true">
  <div class="modal__backdrop" data-close></div>
  <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <button class="modal__close" id="modalClose" data-close aria-label="Close">&times;</button>
    <p class="eyebrow">Eligibility</p>
    <div class="hero-collapse" id="heroCollapse"><div class="hero-collapse__inner">
      <h1 id="modalTitle">Let's find <em>your home.</em></h1>
      <p class="lede">A few details, and we'll find your home in public records, in seconds.</p>
    </div></div>

    <!-- Step 1: name + address -->
    <div class="grid" id="stepId">
      <div class="field">
        <div class="ctrl"><input id="first_name" type="text" placeholder=" " autocomplete="given-name" required><span class="flabel">First name</span></div>
      </div>
      <div class="field">
        <div class="ctrl"><input id="last_name" type="text" placeholder=" " autocomplete="family-name" required><span class="flabel">Last name</span></div>
      </div>
      <div class="field full">
        <span class="alabel">Property address</span>
        <div id="acHost"></div>
        <p class="lede" id="acStatus" style="margin:10px 0 0; font-size:13px">Loading address search…</p>
      </div>
    </div>

    <!-- Reveal stage -->
    <div class="stage" id="stage">
      <div class="scan" id="scan"><div class="scan__grid"></div><div class="scan__sweep"></div><div class="scan__pulse"></div></div>
      <img class="sat" id="sat" alt="Satellite view of the property">
      <div class="vignette" id="vignette"></div>
      <div class="reticle" id="reticle">
        <svg viewBox="0 0 400 250" preserveAspectRatio="none">
          <path class="corner" d="M150,86 h-22 v-22"/><path class="corner" d="M250,86 h22 v-22"/>
          <path class="corner" d="M150,164 h-22 v22"/><path class="corner" d="M250,164 h22 v22"/>
        </svg>
        <svg viewBox="0 0 400 250"><circle class="ring" id="ring" cx="200" cy="125" r="30"/><circle class="lockdot" cx="200" cy="125" r="3"/></svg>
      </div>
      <div class="source"><span class="dot"></span><span id="sourceText">Locating property · county records</span></div>
      <div class="tag">Imagery · Google</div>
    </div>

    <!-- Confirm -->
    <div class="reveal-block confirm" id="confirm">
      <div class="q">Is this your home?</div>
      <div class="addr" id="confirmAddr"></div>
      <div class="btns">
        <button class="chip" id="notQuite">Not quite</button>
        <button class="leap-btn" id="yesThis">
          <span class="leap-btn__inner">
            <span class="leap-btn__left"><span class="leap-btn__label">Yes, that's it</span><span class="leap-btn__sheen"></span></span>
            <span class="leap-btn__right"><span class="leap-btn__arrow">&rarr;</span></span>
          </span>
        </button>
      </div>
    </div>

    <!-- Capture -->
    <div class="reveal-block" id="capture">
      <h2 class="cap-head">Where should we send your result?</h2>
      <p class="cap-sub">Revealed here, and sent to your inbox.</p>
      <div class="grid">
        <div class="field full">
          <div class="ctrl"><input id="email" type="email" placeholder=" " autocomplete="email" required><span class="flabel">Email address</span></div>
        </div>
        <div class="field full">
          <div class="ctrl"><input id="phone" type="tel" placeholder=" " autocomplete="tel"><span class="flabel">Phone</span></div>
        </div>
      </div>
      <!-- honeypot -->
      <div class="hp" aria-hidden="true"><label>Company<input id="company" type="text" tabindex="-1" autocomplete="off"></label></div>
      <div class="turnstile-row"><div id="leap-turnstile"></div></div>
      <p class="consent">By continuing you agree we may contact you about your inquiry, including by phone or text if you provide a number. Message/data rates may apply.</p>
      <p class="err" id="formErr"></p>
      <div class="submit-row">
        <button class="leap-btn" id="submit">
          <span class="leap-btn__inner">
            <span class="leap-btn__left"><span class="leap-btn__label">Reveal my figure</span><span class="leap-btn__sheen"></span></span>
            <span class="leap-btn__right"><span class="leap-btn__arrow">&rarr;</span></span>
          </span>
        </button>
        <span class="spinner" id="spinner"></span>
      </div>
    </div>

    <!-- Result -->
    <div class="reveal-block" id="resultWrap">
      <div class="result" id="result">
        <h2 class="result__head" id="resultHead">You're pre-qualified for up to</h2>
        <div class="result__amount"><span id="amtFigure">$0</span></div>
        <p class="result__note" id="resultNote"></p>
        <div class="result__cta">
          <a class="leap-btn" id="continueCta" href="#" target="_blank" rel="noopener">
            <span class="leap-btn__inner">
              <span class="leap-btn__left"><span class="leap-btn__label">Continue to my application</span><span class="leap-btn__sheen"></span></span>
              <span class="leap-btn__right"><span class="leap-btn__arrow">&rarr;</span></span>
            </span>
          </a>
        </div>
      </div>
      <div class="notice" id="notice">
        <h2 class="notice__head" id="noticeHead">Thanks, we've got your details.</h2>
        <p class="notice__body" id="noticeBody"></p>
      </div>
    </div>

    <p class="disclaimer">Leap is not a lender, and a Home Equity Agreement is not a loan.</p>
  </div>
</div>`;
  document.body.insertAdjacentHTML("beforeend", MODAL_HTML);

/* ============================================================
     CONFIG — the three values to check at cutover (see README).
     ============================================================ */
  const GOOGLE_MAPS_API_KEY = "AIzaSyDxrJgxuwiXWN3jzkNwD0OusXcKNqAEBHU";
  const TURNSTILE_SITE_KEY   = "0x4AAAAAADngRpURDKSLbCtJ";
  // The eligibility API base. Chosen by hostname so the same file works in all
  // three places. Set the leaphei.com value to your deployed API on Monday.
  const HOST = location.hostname;
  const API_BASE =
    (HOST === "localhost" || HOST === "127.0.0.1")
      ? "http://localhost:8000"
      : "https://leap-eligibility-api.onrender.com";  // ← digitalwillads + prod
  /* ============================================================ */

  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const selected = { ready:false };
  let formRenderedAt = Date.now();

  // ---- Google Maps loader ----
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({ key: GOOGLE_MAPS_API_KEY, v:"weekly" });
  window.gm_authFailure = () => { $("acStatus").textContent = "Address search couldn't authorize on this domain (check the Maps key's allowed referrers)."; };

  const comp = (list,type,short=false) => { const c=(list||[]).find(x=>x.types.includes(type)); return c?(short?(c.shortText||c.longText):(c.longText||c.shortText)):""; };

  let placesLib = null;
  async function initMaps(){
    try{
      placesLib = await google.maps.importLibrary("places");
      $("acStatus").style.display = "none";
      mountAutocomplete();
    }catch(err){ $("acStatus").textContent = "Couldn't load address search: " + err.message; }
  }

  function mountAutocomplete(){
    if(!placesLib) return;
    $("acHost").innerHTML = "";  // drop any previous element (and its typed text)
    const pac = new placesLib.PlaceAutocompleteElement({ includedRegionCodes:["us"] });
    $("acHost").appendChild(pac);
    pac.addEventListener("gmp-select", async ({ placePrediction }) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields:["formattedAddress","addressComponents","location"] });
      const ac = place.addressComponents;
      selected.address1 = [comp(ac,"street_number"), comp(ac,"route")].filter(Boolean).join(" ");
      selected.city  = comp(ac,"locality") || comp(ac,"postal_town") || comp(ac,"sublocality_level_1");
      selected.state = comp(ac,"administrative_area_level_1", true);
      selected.zip   = comp(ac,"postal_code");
      selected.lat   = place.location.lat();
      selected.lng   = place.location.lng();
      selected.formatted = place.formattedAddress;
      selected.ready = true;
      $("confirmAddr").textContent = place.formattedAddress;
      runReveal(selected.lat, selected.lng);
    });
  }

  // ---- Reveal ----
  async function runReveal(lat,lng){
    const scan=$("scan"), sat=$("sat"), reticle=$("reticle"), vignette=$("vignette");
    scan.classList.remove("hide"); sat.classList.remove("reveal"); reticle.classList.remove("show"); vignette.classList.remove("show");
    $("sourceText").textContent = "Locating property · county records";
    $("confirm").classList.remove("show"); $("stage").classList.add("open");

    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=640x400&scale=2&maptype=hybrid&markers=color:0xb8975a%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    let loaded=false, failed=false;
    const img=new Image(); img.onload=()=>{loaded=true; sat.src=url;}; img.onerror=()=>{failed=true;}; img.src=url;

    if(!reduce) await wait(1000);
    await waitFor(()=>loaded||failed, 4000);

    scan.classList.add("hide");
    if(!failed){ sat.classList.add("reveal"); vignette.classList.add("show"); }
    setTimeout(()=>{ $("sourceText").textContent="Property located"; reticle.classList.add("show"); lockRing(); }, reduce?40:1000);
    setTimeout(()=>$("confirm").classList.add("show"), reduce?80:1300);
  }
  function lockRing(){ if(reduce) return; $("ring").animate([{r:38,opacity:0},{r:34,opacity:1,offset:.6},{r:30,opacity:1}],{duration:520,easing:"cubic-bezier(.16,1,.3,1)",fill:"forwards"}); }
  function waitFor(ready,timeout){ return new Promise(res=>{const t0=Date.now();(function p(){ if(ready()||Date.now()-t0>timeout) return res(); setTimeout(p,60);})();}); }

  // ---- Flow ----
  $("notQuite").addEventListener("click", ()=>{ $("confirm").classList.remove("show"); $("stage").classList.remove("open"); selected.ready=false; });
  // ---- Turnstile: load lazily, reuse any existing copy, capture token via callback ----
  let tsToken = "", tsWidgetId = null;
  function tsApi(){
    // window.turnstile could be shadowed by a same-named element global; only trust the real API.
    // so only treat it as the API if it actually has render().
    var t = window.turnstile;
    return (t && typeof t.render === "function") ? t : null;
  }
  function whenTurnstileReady(cb){
    if(tsApi()){ console.log("[Leap] Turnstile already ready"); cb(); return; }
    // Inject once, keyed off the actual script tag (not the ambiguous global).
    if(!document.getElementById("cf-turnstile-script") &&
       !document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')){
      console.log("[Leap] injecting Turnstile script");
      var t=document.createElement("script");
      t.id="cf-turnstile-script";
      t.src="https://challenges.cloudflare.com/turnstile/v0/api.js";
      t.async=true; t.defer=true;
      t.onerror=function(){ console.error("[Leap] Turnstile script FAILED to load (network/blocked)"); };
      t.onload=function(){ console.log("[Leap] Turnstile script onload fired"); };
      document.head.appendChild(t);
    } else {
      console.log("[Leap] Turnstile script tag already present");
    }
    var tries=0;
    (function poll(){
      if(tsApi()){ cb(); return; }
      if(tries++ > 50){ console.warn("[Leap] Turnstile never became ready — script loaded but render never attached."); return; }
      setTimeout(poll, 200);
    })();
  }
  function mountTurnstile(){
    console.log("[Leap] mountTurnstile called — key set:", !!TURNSTILE_SITE_KEY, "already mounted:", tsWidgetId !== null);
    if(!TURNSTILE_SITE_KEY || tsWidgetId !== null) return;
    whenTurnstileReady(function(){
      if(tsWidgetId !== null) return;
      var el = $("leap-turnstile"); if(!el) return;
      el.innerHTML = "";
      try{
        tsWidgetId = tsApi().render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light",
          callback: t => { tsToken = t; $("formErr").classList.remove("show"); },
          "expired-callback": () => { tsToken = ""; },
          "error-callback": (c) => { tsToken = ""; console.warn("[Leap] Turnstile error:", c); },
        });
        console.log("[Leap] Turnstile rendered, id =", tsWidgetId);
      }catch(e){ console.error("[Leap] Turnstile render threw:", e); }
    });
  }
  function resetTurnstile(){
    tsToken = "";
    var api = tsApi();
    if(api && tsWidgetId !== null){ try{ api.reset(tsWidgetId); }catch(_){} }
  }

  $("yesThis").addEventListener("click", ()=>{
    $("confirm").classList.remove("show");
    $("capture").classList.add("show");
    setTimeout(()=>$("email").focus(), 300);
    setTimeout(mountTurnstile, 650);   // wait for the capture panel to finish expanding before rendering
  });

  // phone formatting (US)
  $("phone").addEventListener("input", e=>{
    const d=e.target.value.replace(/\D/g,"").slice(0,10);
    e.target.value = d.length>6 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : d.length>3 ? `(${d.slice(0,3)}) ${d.slice(3)}` : d;
  });

  $("submit").addEventListener("click", submitForm);

  async function submitForm(){
    const err=$("formErr"); err.classList.remove("show");
    const first=$("first_name").value.trim(), last=$("last_name").value.trim(), email=$("email").value.trim();
    // basic client validation
    if(!first || !last){ showErr("Please enter your first and last name."); document.body.classList.add("engaged"); $("first_name").focus(); return; }
    if(!selected.ready){ showErr("Please choose your address from the suggestions."); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ showErr("Please enter a valid email address."); $("email").focus(); return; }
    const phoneDigits = $("phone").value.replace(/\D/g,"");
    if(phoneDigits.length !== 10){ showErr("Please enter a valid 10-digit phone number."); $("phone").focus(); return; }
    // bot guards (client side; server is authoritative)
    if($("company").value){ return; }
    if(Date.now()-formRenderedAt < 2000){ /* too fast — let server/turnstile catch, no hard block */ }

    // require a solved Turnstile before sending (an empty token is a guaranteed 400)
    if(TURNSTILE_SITE_KEY && !tsToken){
      showErr("Please complete the verification below.");
      mountTurnstile();
      return;
    }
    const token = tsToken;

    setBusy(true);
    const payload = {
      first_name:first, last_name:last, email,
      phone:$("phone").value.trim(),
      address1:selected.address1, city:selected.city, state:selected.state, zip_code:selected.zip,
      turnstile_token:token,
    };
    try{
      const res = await fetch(API_BASE + "/api/check-eligibility", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload),
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok){ throw new Error(data.error || "We couldn't complete your check. Please try again."); }
      render(data);
    }catch(e){
      setBusy(false);
      showErr(e.message + "  (If you're testing on a static host, the API must be reachable over https.)");
      resetTurnstile();
    }
  }

  function render(data){
    setBusy(false);
    $("capture").classList.remove("show");
    $("resultWrap").classList.add("show");
    if(data.decision === "approved"){
      $("notice").classList.remove("show");
      $("result").classList.add("show");
      $("resultNote").innerHTML = "An estimate from your home's equity, subject to verification. Full details sent to your inbox.";
      if(data.apply_url) $("continueCta").href = data.apply_url;
      revealAmount(Number(data.amount)||0);
    } else if(data.decision === "state_not_eligible"){
      $("result").classList.remove("show");
      $("noticeHead").innerHTML = "We're not in your state <span>yet.</span>";
      $("noticeBody").textContent = data.message || "We've saved your details and will reach out the moment we can serve homeowners there.";
      $("notice").classList.add("show");
    } else {
      // insufficient_equity, home_value_*, address_not_found, service_error
      $("result").classList.remove("show");
      const HEADS = {
        home_value_too_high: "Above our range, for now.",
        home_value_too_low: "Just shy of our range, for now.",
        insufficient_equity: "Not quite yet.",
        address_not_found: "Let's try that once more.",
        service_error: "A brief pause on our end.",
      };
      $("noticeHead").textContent = HEADS[data.decision] || "Thank you.";
      $("noticeBody").textContent = data.message || "We've emailed you the details.";
      $("notice").classList.add("show");
    }
  }

  function revealAmount(target){
    const el=$("amtFigure");
    if(reduce || target<=0){ el.textContent = "$"+target.toLocaleString(); return; }
    const start=performance.now(), dur=1400;
    (function tick(now){
      const t=Math.min((now-start)/dur,1), e=1-Math.pow(1-t,3);
      el.textContent = "$"+(Math.round(target*e/1000)*1000).toLocaleString();
      if(t<1) requestAnimationFrame(tick); else el.textContent="$"+target.toLocaleString();
    })(start);
  }

  function showErr(msg){ const e=$("formErr"); e.textContent=msg; e.classList.add("show"); }
  function setBusy(on){ $("submit").disabled=on; $("spinner").classList.toggle("show",on); }

  // ---- Modal open/close ----
  const modal=$("modal"); let lastFocus=null;
  function onEngage(){ document.body.classList.add("engaged"); }
  function armEngage(){ const p=document.querySelector(".modal__panel"); p.removeEventListener("focusin",onEngage); p.addEventListener("focusin",onEngage,{once:true}); }
  function openModal(){ lastFocus=document.activeElement; modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); document.body.classList.add("modal-lock"); formRenderedAt=Date.now(); setTimeout(()=>$("first_name").focus(),420); }
  function closeModal(){ modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); document.body.classList.remove("modal-lock"); if(lastFocus) lastFocus.focus(); setTimeout(resetForm,450); }
  document.querySelectorAll("[data-open-eligibility]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openModal();}));
  modal.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeModal));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape" && modal.classList.contains("open")) closeModal(); });
  modal.addEventListener("keydown",e=>{
    if(e.key!=="Tab") return;
    const list=[...modal.querySelectorAll('a[href],button,input,select,textarea')].filter(el=>el.offsetParent!==null && el.tabIndex!==-1 && !el.disabled);
    if(!list.length) return; const f=list[0], l=list[list.length-1];
    if(e.shiftKey && document.activeElement===f){e.preventDefault(); l.focus();}
    else if(!e.shiftKey && document.activeElement===l){e.preventDefault(); f.focus();}
  });

  function resetForm(){
    ["first_name","last_name","email","phone","company"].forEach(id=>$(id).value="");
    selected.ready=false;
    $("stage").classList.remove("open"); $("scan").classList.remove("hide");
    $("sat").classList.remove("reveal"); $("reticle").classList.remove("show"); $("vignette").classList.remove("show");
    $("confirm").classList.remove("show"); $("capture").classList.remove("show"); $("resultWrap").classList.remove("show");
    $("result").classList.remove("show"); $("notice").classList.remove("show");
    $("amtFigure").textContent="$0"; $("formErr").classList.remove("show");
    document.body.classList.remove("engaged"); armEngage();
    mountAutocomplete();  // fresh, empty address field
    resetTurnstile();
  }

  armEngage();
  initMaps();
  console.log("%cLeap eligibility — build 2026-06-19-elegant","color:#b8975a;font-weight:600");

  // Universal trigger: intercept ANY "Check my eligibility" link/button anywhere
  // on the page — including ones added later (e.g. the step-process CTA) and ones
  // that point at apply.html — and open the modal instead of navigating.
  // Capture phase + stopImmediatePropagation runs before other click handlers
  // (like the stepper's own), so their navigation never fires.
  document.addEventListener("click", function(e){
    var t = e.target;
    var el = t && t.closest ? t.closest("a,button") : null;
    if(!el || el.hasAttribute("data-open-eligibility")) return;  // data-attr handled above
    if(el.closest("#modal")) return;                             // ignore clicks inside our modal
    var txt = (el.textContent || "").toLowerCase().replace(/[^a-z]/g, "");
    if(txt.indexOf("checkmyeligibility") !== -1){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      openModal();
    }
  }, true);
  window.LeapEligibility = { open: openModal, close: closeModal };
})();
