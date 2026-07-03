const canvas = document.querySelector("#ambient-canvas");
const ctx = canvas.getContext("2d");
const cursorGlow = document.querySelector(".cursor-glow");
const typedCode = document.querySelector("#typed-code");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    tx: window.innerWidth * 0.5,
    ty: window.innerHeight * 0.5
};

const colors = ["#c7ff5b", "#41ead4", "#ff4f8b", "#ff9f1c", "#9b5de5"];
let particles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const density = width < 700 ? 42 : 74;
    particles = Array.from({ length: density }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.46,
        vy: (Math.random() - 0.5) * 0.46,
        size: Math.random() * 2.4 + 0.8,
        color: colors[index % colors.length],
        orbit: Math.random() * Math.PI * 2
    }));
}

function drawCanvas() {
    ctx.clearRect(0, 0, width, height);
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    const pulse = performance.now() * 0.001;
    const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 20, pointer.x, pointer.y, Math.max(width, height) * 0.52);
    gradient.addColorStop(0, "rgba(65, 234, 212, 0.18)");
    gradient.addColorStop(0.36, "rgba(255, 79, 139, 0.06)");
    gradient.addColorStop(1, "rgba(11, 10, 8, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const particle of particles) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const push = Math.max(0, 1 - distance / 190);

        particle.orbit += 0.012;
        particle.x += particle.vx + Math.cos(particle.orbit) * 0.08 + (dx / Math.max(distance, 1)) * push * 0.88;
        particle.y += particle.vy + Math.sin(particle.orbit) * 0.08 + (dy / Math.max(distance, 1)) * push * 0.88;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size + Math.sin(pulse + particle.orbit) * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = 0.62;
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i];
            const b = particles[j];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (distance < 112) {
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(255, 250, 238, ${0.16 * (1 - distance / 112)})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    if (!prefersReducedMotion) {
        requestAnimationFrame(drawCanvas);
    }
}

function updatePointer(event) {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    if (cursorGlow) {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    }
}

const codeLines = [
    "const dev = 'Gabriel';",
    "const stack = ['Python', 'Flask', 'JS'];",
    "",
    "build({",
    "  foco: 'soluções reais',",
    "  visual: 'moderno',",
    "  entrega: 'produto'",
    "});",
    "",
    "deploy('com movimento');"
];

async function typeCode() {
    if (!typedCode) return;
    const fullText = codeLines.join("\n");
    if (prefersReducedMotion) {
        typedCode.textContent = fullText;
        return;
    }

    while (true) {
        typedCode.textContent = "";
        for (let index = 0; index < fullText.length; index += 1) {
            typedCode.textContent += fullText[index];
            await wait(fullText[index] === "\n" ? 80 : 22);
        }
        await wait(1000);
    }
}

function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });

    document.querySelectorAll("[data-reveal]").forEach((element, index) => {
        element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
        observer.observe(element);
    });
}

function setupCounters() {
    const counters = document.querySelectorAll("[data-count]");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target;
            const target = Number(element.dataset.count);
            const suffix = target === 100 ? "%" : "+";
            const start = performance.now();

            function tick(now) {
                const progress = Math.min((now - start) / 1300, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = `${Math.round(target * eased)}${suffix}`;
                if (progress < 1) requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
            observer.unobserve(element);
        });
    }, { threshold: 0.5 });

    counters.forEach((counter) => observer.observe(counter));
}

function setupTilt() {
    document.querySelectorAll(".tilt-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            if (prefersReducedMotion || window.innerWidth < 760) return;
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${y * -6}deg) rotateY(${x * 7}deg) translateY(-4px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}

function setupMagneticButtons() {
    document.querySelectorAll(".magnetic").forEach((button) => {
        button.addEventListener("pointermove", (event) => {
            if (prefersReducedMotion || window.innerWidth < 760) return;
            const rect = button.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            button.style.transform = `translate(${x * 0.13}px, ${y * 0.18}px)`;
        });

        button.addEventListener("pointerleave", () => {
            button.style.transform = "";
        });
    });
}

const skillContent = {
    backend: {
        label: "Backend",
        title: "APIs, rotas e regras de negócio",
        text: "Criação de sistemas com Flask, integrações, autenticação, bancos relacionais e rotinas que reduzem trabalho manual.",
        bars: [
            ["Python", "88%"],
            ["Flask", "82%"],
            ["SQL", "76%"]
        ]
    },
    frontend: {
        label: "Frontend",
        title: "Interfaces responsivas e vivas",
        text: "Layouts modernos com HTML, CSS e JavaScript, priorizando clareza, fluidez, responsividade e pequenos detalhes de interação.",
        bars: [
            ["HTML", "90%"],
            ["CSS", "84%"],
            ["JavaScript", "78%"]
        ]
    },
    dados: {
        label: "Dados",
        title: "Planilhas, bases e decisões",
        text: "Organização, leitura e transformação de dados para consultas, relatórios, dashboards e ferramentas internas.",
        bars: [
            ["Excel", "86%"],
            ["Pandas", "72%"],
            ["Relatórios", "80%"]
        ]
    },
    automacao: {
        label: "Automação",
        title: "Menos clique repetido, mais resultado",
        text: "Scripts e aplicações para padronizar tarefas, conectar serviços e diminuir erros em processos operacionais.",
        bars: [
            ["Python", "88%"],
            ["Web", "77%"],
            ["Desktop", "68%"]
        ]
    },
    produto: {
        label: "Produto",
        title: "Pensar fluxo antes de empilhar tela",
        text: "Estruturação de jornadas, prioridades e interfaces que ajudam pessoas a concluir tarefas com menos atrito.",
        bars: [
            ["UX", "78%"],
            ["Validação", "74%"],
            ["Entrega", "82%"]
        ]
    }
};

function setupSkillSwitcher() {
    const buttons = document.querySelectorAll("[data-skill]");
    const label = document.querySelector("#skill-label");
    const title = document.querySelector("#skill-title");
    const text = document.querySelector("#skill-text");
    const progress = document.querySelector(".progress-list");

    function activate(skill) {
        const content = skillContent[skill];
        if (!content) return;

        buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.skill === skill));
        label.textContent = content.label;
        title.textContent = content.title;
        text.textContent = content.text;
        progress.innerHTML = content.bars
            .map(([name, value]) => `<span style="--value: ${value}">${name}</span>`)
            .join("");
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => activate(button.dataset.skill));
    });

    activate("backend");
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", updatePointer);

resizeCanvas();
drawCanvas();
setupReveal();
setupCounters();
setupTilt();
setupMagneticButtons();
setupSkillSwitcher();
typeCode();
