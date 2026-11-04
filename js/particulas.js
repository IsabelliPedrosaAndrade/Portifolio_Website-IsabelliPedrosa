const parado = matchMedia("(prefers-reduced-motion: reduce)").matches;
const celular = matchMedia("(max-width: 768px)").matches;
const COR = { violeta: "#4D5BD8", claro: "#7C88EE", fundo: "#2A3285", roxo: "#7A55C7", mostarda: "#D4A23A", osso: "#ECE8E1" };

function medir(canvas, maxDpr = 2) {
  const dpr = celular ? 1 : Math.min(devicePixelRatio || 1, maxDpr);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.max(1, w * dpr);
  canvas.height = Math.max(1, h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function seguirMouse(canvas) {
  const m = { x: 0, y: 0, ativo: false };
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    m.x = e.clientX - r.left;
    m.y = e.clientY - r.top;
    m.ativo = m.x > -60 && m.y > -60 && m.x < r.width + 60 && m.y < r.height + 60;
  }, { passive: true });
  return m;
}

function animar(canvas, desenhar, fps = 60) {
  let visivel = false, ultimo = 0;
  new IntersectionObserver(([e]) => visivel = e.isIntersecting).observe(canvas);
  if (parado) return desenhar(0, 0);
  const quadro = (t) => {
    requestAnimationFrame(quadro);
    if (!visivel || document.hidden || t - ultimo < 1000 / fps - 2) return;
    desenhar(t, Math.min(64, t - ultimo));
    ultimo = t;
  };
  requestAnimationFrame(quadro);
}

function estrela(ctx, x, y, r, cor, brilho = 0) {
  const c = r * .18;
  ctx.save();
  if (brilho) { ctx.shadowColor = cor; ctx.shadowBlur = brilho; }
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + c, y - c, x + r, y);
  ctx.quadraticCurveTo(x + c, y + c, x, y + r);
  ctx.quadraticCurveTo(x - c, y + c, x - r, y);
  ctx.quadraticCurveTo(x - c, y - c, x, y - r);
  ctx.fill();
  ctx.restore();
}

function iniciarCeu(canvas) {
  const cores = [COR.claro, COR.violeta, COR.osso];
  let ctx, w, h, estrelas = [], cadentes = [], proxima = 0;

  function montar() {
    ({ ctx, w, h } = medir(canvas, 1.5));
    estrelas = Array.from({ length: celular ? 60 : 120 }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h,
      r: .5 + Math.random() * 1.2,
      fase: Math.random() * 6.28,
      vel: .0006 + Math.random() * .0016,
      cor: cores[i % cores.length]
    }));
  }

  function novaCadente() {
    const angulo = Math.PI * (.12 + Math.random() * .14);
    const vel = .35 + Math.random() * .35;
    cadentes.push({
      x: Math.random() * w * 1.1, y: Math.random() * h * .55,
      vx: -Math.cos(angulo) * vel, vy: Math.sin(angulo) * vel,
      cauda: 50 + Math.random() * 70,
      vida: 0, duracao: 900 + Math.random() * 700
    });
  }

  function desenhar(t, dt) {
    ctx.clearRect(0, 0, w, h);
    for (const e of estrelas) {
      ctx.globalAlpha = .15 + .6 * (.5 + .5 * Math.sin(t * e.vel + e.fase));
      ctx.fillStyle = e.cor;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (t > proxima) {
      novaCadente();
      proxima = t + 1200 + Math.random() * 2600;
    }
    ctx.lineCap = "round";
    for (const c of cadentes) {
      c.vida += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      const p = c.vida / c.duracao;
      const alfa = Math.sin(Math.PI * Math.min(1, p)) * .55;
      const fim = Math.hypot(c.vx, c.vy);
      const g = ctx.createLinearGradient(c.x, c.y, c.x - c.vx / fim * c.cauda, c.y - c.vy / fim * c.cauda);
      g.addColorStop(0, `rgba(236, 232, 225, ${alfa})`);
      g.addColorStop(1, "rgba(124, 136, 238, 0)");
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - c.vx / fim * c.cauda, c.y - c.vy / fim * c.cauda);
      ctx.stroke();
    }
    cadentes = cadentes.filter(c => c.vida < c.duracao);
    ctx.globalAlpha = 1;
  }

  montar();
  addEventListener("resize", montar);
  animar(canvas, desenhar, celular ? 30 : 45);
}

function iniciarBuracoNegro(canvas) {
  const mouse = seguirMouse(canvas);
  const cores = [COR.violeta, COR.claro, COR.fundo, COR.roxo, COR.osso];
  const inclinacao = .3, giro = -.22, cg = Math.cos(giro), sg = Math.sin(giro);
  let ctx, w, h, cx, cy, R, particulas = [], poeira = [], especial, primeiro = true;

  function montar() {
    ({ ctx, w, h } = medir(canvas));
    cx = w * .5; cy = h * .6;
    R = Math.min(w, h) * .085;
    particulas = [];
    for (let i = 0; i < 1400; i++) {
      const anel = i > 1400 * .84;
      const r = anel ? R * (1.12 + Math.random() * .32) : R * (1.55 + Math.pow(Math.random(), 1.7) * 7);
      const sorte = Math.random();
      let cor;
      if (sorte < .05) cor = 3;
      else if (anel || r < R * 2.6) cor = sorte < .72 ? 1 : (sorte < .82 ? 4 : 0);
      else cor = sorte < .55 ? 0 : (sorte < .82 ? 2 : 1);
      particulas.push({
        r, a: Math.random() * Math.PI * 2,
        v: (anel ? 1.6 : 1) * .00062 * Math.pow((R * 1.6) / r, 1.5),
        anel, cor, t: Math.random() < .1 ? 1.8 : 1.1, ox: 0, oy: 0
      });
    }
    poeira = Array.from({ length: 110 }, () => ({ x: Math.random() * w, y: Math.random() * h, f: Math.random() * 6.28, t: Math.random() * 1.1 + .4 }));
    especial = { r: R * 5.3, a: -2.3, v: .00007 };
    primeiro = true;
  }

  function posicao(p) {
    const lx = Math.cos(p.a) * p.r;
    const ly = Math.sin(p.a) * p.r * (p.anel ? .93 : inclinacao);
    return [cx + lx * cg - ly * sg, cy + lx * sg + ly * cg];
  }

  function desenhar(t, dt) {
    ctx.fillStyle = primeiro ? "#090A12" : "rgba(9, 10, 18, .34)";
    ctx.fillRect(0, 0, w, h);
    primeiro = false;

    for (const d of poeira) {
      ctx.globalAlpha = .25 + .35 * (.5 + .5 * Math.sin(t * .0012 + d.f));
      ctx.fillStyle = COR.claro;
      ctx.fillRect(d.x, d.y, d.t, d.t);
    }
    ctx.globalAlpha = 1;

    const g = ctx.createRadialGradient(cx, cy, R * .8, cx, cy, R * 6);
    g.addColorStop(0, "rgba(77, 91, 216, .22)");
    g.addColorStop(.4, "rgba(42, 50, 133, .10)");
    g.addColorStop(1, "rgba(42, 50, 133, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const atras = cores.map(() => []), frente = cores.map(() => []);
    for (const p of particulas) {
      p.a += p.v * dt;
      let [x, y] = posicao(p);
      if (mouse.ativo) {
        const dx = x + p.ox - mouse.x, dy = y + p.oy - mouse.y, d = Math.hypot(dx, dy) || 1;
        if (d < 110) {
          const f = (1 - d / 110) * 2.4;
          p.ox += dx / d * f;
          p.oy += dy / d * f;
        }
      }
      p.ox *= .94; p.oy *= .94;
      x += p.ox; y += p.oy;
      const fundo = !p.anel && Math.sin(p.a) < 0;
      (fundo ? atras : frente)[p.cor].push(x, y, p.t);
    }
    const pintar = (grupos) => grupos.forEach((lista, i) => {
      ctx.fillStyle = cores[i];
      ctx.beginPath();
      for (let k = 0; k < lista.length; k += 3) ctx.rect(lista[k], lista[k + 1], lista[k + 2], lista[k + 2]);
      ctx.fill();
    });

    pintar(atras);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "#040409";
    ctx.fill();
    ctx.strokeStyle = "rgba(124, 136, 238, .55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.03, 0, Math.PI * 2);
    ctx.stroke();
    pintar(frente);

    especial.a += especial.v * dt;
    const [ex, ey] = posicao({ r: especial.r, a: especial.a, anel: false });
    estrela(ctx, ex, ey, 7 * (.85 + .15 * Math.sin(t * .002)), COR.mostarda, 14);
  }

  montar();
  addEventListener("resize", montar);
  animar(canvas, desenhar);
}

function iniciarPalavraEmPontos(canvas) {
  const mouse = seguirMouse(canvas);
  let ctx, w, h, pontos = [], formas = [], forma = 0, troca = 0;

  function amostrar(desenho) {
    const molde = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    molde.canvas.width = w;
    molde.canvas.height = h;
    molde.fillStyle = "#fff";
    desenho(molde);
    const dados = molde.getImageData(0, 0, w, h).data;
    const lista = [];
    for (let y = 0; y < h; y += 5) {
      for (let x = 0; x < w; x += 5) {
        if (dados[(y * w + x) * 4 + 3] > 128) lista.push([x, y]);
      }
    }
    return lista;
  }

  function montar() {
    ({ ctx, w, h } = medir(canvas, 1));
    formas = [
      amostrar((m) => {
        m.font = `${h * .82}px "Lavishly Yours", "Pinyon Script", cursive`;
        m.textAlign = "center";
        m.textBaseline = "middle";
        m.fillText("Olá!", w / 2, h / 2);
      }),
      amostrar((m) => estrela(m, w / 2, h / 2, h * .45, "#fff"))
    ];
    const total = Math.max(...formas.map(f => f.length));
    pontos = Array.from({ length: total }, () => ({ x: Math.random() * w, y: Math.random() * h, ax: 0, ay: 0, vx: 0, vy: 0, cor: Math.random() < .12 ? COR.osso : COR.claro }));
    definirForma(0);
  }

  function definirForma(i) {
    forma = i;
    const alvos = formas[i];
    pontos.forEach((p, k) => {
      const [x, y] = alvos[k % alvos.length];
      p.ax = x; p.ay = y;
    });
  }

  function desenhar(t) {
    if (t > troca) {
      if (troca) definirForma(1 - forma);
      troca = t + 4600;
    }
    ctx.clearRect(0, 0, w, h);
    for (const p of pontos) {
      if (mouse.ativo) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy) || 1;
        if (d < 70) { p.vx += dx / d * 1.6; p.vy += dy / d * 1.6; }
      }
      p.vx = (p.vx + (p.ax - p.x) * .03) * .82;
      p.vy = (p.vy + (p.ay - p.y) * .03) * .82;
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.cor;
      ctx.fillRect(p.x, p.y, 2, 2);
    }
  }

  montar();
  if (parado) pontos.forEach(p => { p.x = p.ax; p.y = p.ay; });
  addEventListener("resize", montar);
  animar(canvas, desenhar, 50);
}

iniciarCeu(document.getElementById("ceu"));
if (!celular) {
  iniciarBuracoNegro(document.getElementById("buraco-negro"));
  document.fonts.ready.then(() => iniciarPalavraEmPontos(document.getElementById("figura-pontos")));
}
