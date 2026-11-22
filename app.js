(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Uçuşan kalpler ---------- */
  const heartLayer = document.querySelector(".hearts");
  if (heartLayer && !reduceMotion) {
    const colors = ["#ff6aa6", "#a98bf0", "#ff9cc6", "#c4a8ff"];
    const count = window.innerWidth < 600 ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.textContent = "♥";
      h.style.left = (Math.random() * 100).toFixed(1) + "%";
      h.style.fontSize = (12 + Math.random() * 20).toFixed(0) + "px";
      h.style.color = colors[i % colors.length];
      h.style.animationDuration = (14 + Math.random() * 14).toFixed(1) + "s";
      h.style.animationDelay = (-Math.random() * 24).toFixed(1) + "s";
      heartLayer.appendChild(h);
    }
  }

  /* ---------- Parçacık patlaması ---------- */
  const partyEmoji = ["💜", "💖", "💗", "✨", "🐷", "🧸", "🐹", "💕"];

  function burst(x, y, amount, emojis) {
    if (reduceMotion) amount = Math.min(amount, 8);
    for (let i = 0; i < amount; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.fontSize = (16 + Math.random() * 18).toFixed(0) + "px";
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 170;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 60;
      const spin = (Math.random() - 0.5) * 120;
      const anim = p.animate(
        [
          { transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(.4)`, opacity: 1 },
          { transform: `translate(${x + dx}px, ${y + dy}px) translate(-50%, -50%) rotate(${spin}deg) scale(1)`, opacity: 1, offset: 0.65 },
          { transform: `translate(${x + dx * 1.1}px, ${y + dy + 90}px) translate(-50%, -50%) rotate(${spin * 1.4}deg) scale(.9)`, opacity: 0 }
        ],
        { duration: 1300 + Math.random() * 700, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }
      );
      anim.onfinish = () => p.remove();
    }
  }

  /* ---------- Resimlere dokununca ---------- */
  document.querySelectorAll(".sticker").forEach((s) => {
    s.addEventListener("click", (e) => {
      s.classList.remove("pop");
      void s.offsetWidth;
      s.classList.add("pop");
      burst(e.clientX, e.clientY, 5, ["💜", "💗", "✨"]);
    });
    s.addEventListener("animationend", (e) => {
      if (e.animationName === "pop") s.classList.remove("pop");
    });
  });

  /* ---------- Evet / Hayır ---------- */
  const yes = document.getElementById("yes");
  const no = document.getElementById("no");
  const buttons = document.getElementById("buttons");
  const question = document.getElementById("question");
  const yay = document.getElementById("yay");

  // Hayır butonu 3 kez kaçar, sonra yakalanabilir
  const MAX_ESCAPES = 3;
  const escapeLabels = ["Emin misin? 🤨", "Yakalayamazsın 😝"];

  let tries = 0;
  let placeholder = null;
  let lastFlee = 0;
  let done = false;
  let saidNo = false;

  const tired = () => tries >= MAX_ESCAPES;

  function viewport() {
    return {
      w: document.documentElement.clientWidth || window.innerWidth,
      h: window.innerHeight
    };
  }

  function overlaps(x, y, w, h, rect, pad) {
    return !(
      x + w + pad < rect.left ||
      x - pad > rect.right ||
      y + h + pad < rect.top ||
      y - pad > rect.bottom
    );
  }

  function flee(px, py, force) {
    if (done || tired()) return;
    const now = performance.now();
    if (!force && now - lastFlee < 220) return;
    lastFlee = now;

    const start = no.getBoundingClientRect();

    // İlk kaçışta: yerine görünmez bir boşluk bırak, butonu serbest bırak
    if (!placeholder) {
      placeholder = document.createElement("span");
      placeholder.className = "btn btn-placeholder";
      placeholder.style.width = start.width + "px";
      placeholder.style.height = start.height + "px";
      no.replaceWith(placeholder);
      no.classList.add("is-running");
      no.style.left = start.left + "px";
      no.style.top = start.top + "px";
      document.body.appendChild(no);
      void no.offsetWidth; // geçiş animasyonu buradan başlasın
    }

    tries++;
    // son kaçışta yine "Hayır" yazsın, artık basılabilir
    no.textContent = tired() ? "Hayır" : escapeLabels[(tries - 1) % escapeLabels.length];

    const w = no.offsetWidth;
    const h = no.offsetHeight;
    const vp = viewport();
    const m = 14;
    const yesRect = yes.getBoundingClientRect();
    const maxX = Math.max(m, vp.w - w - m);
    const maxY = Math.max(m, vp.h - h - m);

    let best = null;
    let bestScore = -Infinity;
    for (let i = 0; i < 50; i++) {
      const x = m + Math.random() * (maxX - m);
      const y = m + Math.random() * (maxY - m);
      if (overlaps(x, y, w, h, yesRect, 16)) continue;
      const dPointer = Math.hypot(x + w / 2 - px, y + h / 2 - py);
      const dSelf = Math.hypot(x - start.left, y - start.top);
      const score = Math.min(dPointer, 420) + 0.5 * Math.min(dSelf, 320);
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
      if (dPointer > 200 && dSelf > 150) {
        best = { x, y };
        break;
      }
    }
    if (best) {
      no.style.left = best.x.toFixed(1) + "px";
      no.style.top = best.y.toFixed(1) + "px";
    }

    yes.style.setProperty("--grow", Math.min(1 + tries * 0.05, 1.4).toFixed(2));
  }

  // Fare üstüne gelince kaç
  no.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "touch") flee(e.clientX, e.clientY);
  });

  // Fare ile basmaya çalışırsa da kaç (3 kaçıştan sonra artık basılabilir)
  no.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || tired()) return; // dokunmayı aşağıda yakalıyoruz
    e.preventDefault();
    flee(e.clientX, e.clientY, true);
  });

  // Telefonda dokununca: ilk 3 seferde tıklamayı engelle ve kaç
  no.addEventListener(
    "touchstart",
    (e) => {
      if (tired()) return;
      e.preventDefault();
      const t = e.touches[0];
      flee(t.clientX, t.clientY, true);
    },
    { passive: false }
  );

  // 3 kaçıştan önce tıklanamaz (klavye ile Enter/Space dahil), sonra "Haaaayıııııırrrr" çıkar
  no.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (tired()) {
      sayNo();
      return;
    }
    const r = no.getBoundingClientRect();
    flee(r.left + r.width / 2, r.top + r.height / 2, true);
  });

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function sayNo() {
    if (done || saidNo) return;
    saidNo = true;

    const r = no.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 10, ["😭", "💔", "🥺"]);

    const big = document.createElement("button");
    big.type = "button";
    big.className = "btn no-big";
    big.textContent = "Haaaayıııııırrrr 😭";

    // Butonu tekrar Evet'in yanına koy
    if (placeholder) {
      placeholder.replaceWith(big);
      placeholder = null;
    } else {
      buttons.appendChild(big);
    }
    no.remove();

    big.addEventListener("click", () => {
      const b = big.getBoundingClientRect();
      burst(b.left + b.width / 2, b.top + b.height / 2, 12, ["😭", "💔", "🥺", "😿"]);
      restart(document.body, "shake");
      restart(yes, "pulse");
      try { navigator.vibrate && navigator.vibrate(120); } catch (_) {}
    });
  }

  // Fare yaklaşınca bile kaçsın
  document.addEventListener("pointermove", (e) => {
    if (done || e.pointerType !== "mouse") return;
    const r = no.getBoundingClientRect();
    const pad = 28;
    if (
      e.clientX > r.left - pad &&
      e.clientX < r.right + pad &&
      e.clientY > r.top - pad &&
      e.clientY < r.bottom + pad
    ) {
      flee(e.clientX, e.clientY);
    }
  });

  // Ekran boyutu değişirse buton dışarıda kalmasın
  window.addEventListener("resize", () => {
    if (!placeholder || done) return;
    const vp = viewport();
    const r = no.getBoundingClientRect();
    const x = Math.min(Math.max(14, r.left), Math.max(14, vp.w - r.width - 14));
    const y = Math.min(Math.max(14, r.top), Math.max(14, vp.h - r.height - 14));
    no.style.left = x + "px";
    no.style.top = y + "px";
  });

  yes.addEventListener("click", () => {
    if (done) return;
    done = true;

    const r = yes.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    burst(cx, cy, 40, partyEmoji);
    setTimeout(() => burst(window.innerWidth * 0.25, window.innerHeight * 0.35, 18, partyEmoji), 350);
    setTimeout(() => burst(window.innerWidth * 0.75, window.innerHeight * 0.3, 18, partyEmoji), 650);

    try { navigator.vibrate && navigator.vibrate([30, 50, 30]); } catch (_) {}

    no.remove();
    buttons.classList.add("done");
    document.body.classList.add("celebrate");

    setTimeout(() => {
      buttons.hidden = true;
      question.hidden = true;
      yay.hidden = false;
      yay.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }, 380);
  });
})();
