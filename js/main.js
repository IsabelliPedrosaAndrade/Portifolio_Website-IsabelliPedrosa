document.addEventListener("click", (e) => {
  const botao = e.target.closest("[data-abrir]");
  if (botao) document.getElementById(botao.dataset.abrir)?.showModal();
});

for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}

const menuTela = document.getElementById("menu-tela");
menuTela.addEventListener("click", (e) => {
  if (e.target.closest("a")) menuTela.hidePopover();
});

const linksMenu = document.querySelectorAll(".menu a");
const observarSecao = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue;
    for (const link of linksMenu) {
      if (link.hash === `#${entrada.target.id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  }
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main > section[id]").forEach(s => observarSecao.observe(s));

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxLegenda = document.getElementById("lightbox-legenda");
let grupo = [];
let atual = 0;

function mostrarImagem(indice) {
  atual = (indice + grupo.length) % grupo.length;
  const link = grupo[atual];
  const alt = link.querySelector("img")?.alt || "";
  lightboxImg.src = link.href;
  lightboxImg.alt = alt;
  lightboxLegenda.textContent = grupo.length > 1 ? `${alt} · ${atual + 1} / ${grupo.length}` : alt;
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("a.ampliar");
  if (!link) return;
  e.preventDefault();
  grupo = [...link.closest("ul, div").querySelectorAll("a.ampliar")];
  lightbox.querySelectorAll(".lightbox-nav").forEach(b => b.hidden = grupo.length < 2);
  mostrarImagem(grupo.indexOf(link));
  lightbox.showModal();
});
lightbox.querySelector(".lightbox-ant").addEventListener("click", () => mostrarImagem(atual - 1));
lightbox.querySelector(".lightbox-prox").addEventListener("click", () => mostrarImagem(atual + 1));
lightbox.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") mostrarImagem(atual - 1);
  if (e.key === "ArrowRight") mostrarImagem(atual + 1);
});

const svgsBaixados = {};
const observarDesenho = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue;
    entrada.target.classList.add("visto");
    observarDesenho.unobserve(entrada.target);
  }
}, { rootMargin: "0px 0px -10% 0px" });

async function desenharSvg(img) {
  const caminho = img.getAttribute("src");
  svgsBaixados[caminho] ??= fetch(caminho).then(r => r.ok ? r.text() : Promise.reject());
  try {
    const caixa = document.createElement("div");
    caixa.innerHTML = await svgsBaixados[caminho];
    const svg = caixa.querySelector("svg");
    svg.setAttribute("class", img.className);
    svg.setAttribute("aria-hidden", "true");
    svg.querySelectorAll("path, circle, rect, line, ellipse, polyline, polygon")
      .forEach(forma => forma.setAttribute("pathLength", "1"));
    img.replaceWith(svg);
    observarDesenho.observe(svg);
  } catch {
    img.classList.add("visto");
  }
}
document.querySelectorAll("img.desenhar").forEach(desenharSvg);

const envelope = document.getElementById("envelope");
const selo = document.getElementById("abrir-envelope");
selo.addEventListener("click", () => {
  envelope.classList.add("aberto");
  selo.setAttribute("aria-expanded", "true");
  document.getElementById("cartao-contato").inert = false;
  setTimeout(() => document.getElementById("email").focus({ preventScroll: true }), 1200);
});

const botaoCopiar = document.getElementById("copiar-email");
const statusCopia = document.getElementById("status-copia");
botaoCopiar.addEventListener("click", async () => {
  const icone = botaoCopiar.querySelector("use");
  try {
    await navigator.clipboard.writeText(document.getElementById("email").textContent);
    statusCopia.textContent = "✦ E-mail copiado";
    icone.setAttribute("href", "#i-ok");
  } catch {
    statusCopia.textContent = "Não foi possível copiar. Selecione o e-mail acima.";
  }
  setTimeout(() => {
    statusCopia.textContent = "";
    icone.setAttribute("href", "#i-copiar");
  }, 2600);
});
