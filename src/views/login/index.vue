<template>
  <div class="login-shell">
    <!-- Ambient blobs in the page background -->
    <div class="bg-blob blob-1" />
    <div class="bg-blob blob-2" />
    <div class="bg-blob blob-3" />
    <div class="bg-grid" />

    <!-- ============ FLOATING CARD ============ -->
    <div class="login-card">
      <!-- Card header: brand + toolbar -->
      <header class="card-header">
        <div class="brand">
          <span class="brand-mark">
            <svg viewBox="0 0 40 40" width="36" height="36">
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#60a5fa" />
                  <stop offset="0.55" stop-color="#3b82f6" />
                  <stop offset="1" stop-color="#1d4ed8" />
                </linearGradient>
                <linearGradient id="brandTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="white" stop-opacity="0.35" />
                  <stop offset="0.6" stop-color="white" stop-opacity="0" />
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="11" fill="url(#brandGrad)" />
              <rect width="40" height="40" rx="11" fill="url(#brandTop)" />

              <!-- Rabbit ears -->
              <g fill="white">
                <path
                  d="M14.2 8 C 13 8.2, 12.2 9.6, 12.4 12.5 L 13 18 C 13.2 19.6, 14.2 20.4, 15.2 20.2 C 16.2 20, 16.8 19, 16.6 17.4 L 16 11.6 C 15.8 9, 15.4 7.8, 14.2 8 Z"
                />
                <path
                  d="M25.8 8 C 27 8.2, 27.8 9.6, 27.6 12.5 L 27 18 C 26.8 19.6, 25.8 20.4, 24.8 20.2 C 23.8 20, 23.2 19, 23.4 17.4 L 24 11.6 C 24.2 9, 24.6 7.8, 25.8 8 Z"
                />
                <!-- Round face -->
                <ellipse cx="20" cy="26.5" rx="8.2" ry="7.8" />
              </g>

              <!-- Inner ears (pink) -->
              <ellipse cx="14.5" cy="14.8" rx="0.85" ry="3.2" fill="#fbcfe8" opacity="0.95" />
              <ellipse cx="25.5" cy="14.8" rx="0.85" ry="3.2" fill="#fbcfe8" opacity="0.95" />

              <!-- Eyes -->
              <ellipse cx="17.2" cy="25.8" rx="1.2" ry="1.5" fill="#1e3a8a" />
              <ellipse cx="22.8" cy="25.8" rx="1.2" ry="1.5" fill="#1e3a8a" />
              <ellipse cx="17.5" cy="25.3" rx="0.4" ry="0.5" fill="white" />
              <ellipse cx="23.1" cy="25.3" rx="0.4" ry="0.5" fill="white" />

              <!-- Nose -->
              <path d="M19.1 28.6 L20.9 28.6 L20 29.9 Z" fill="#ec4899" />
            </svg>
          </span>
          <div class="brand-text">
            <span class="brand-name">掌学兔</span>
            <span class="brand-sub">Zhang Xue Tu · 管理后台</span>
          </div>
        </div>

        <div class="card-toolbar">
          <el-tooltip :content="t('login.themeToggle')" placement="bottom">
            <CommonWrapper><DarkModeSwitch /></CommonWrapper>
          </el-tooltip>
          <el-tooltip :content="t('login.languageToggle')" placement="bottom">
            <CommonWrapper><LangSelect size="text-20px" /></CommonWrapper>
          </el-tooltip>
        </div>
      </header>

      <!-- Card body: illustration | form -->
      <div class="card-body">
        <!-- Curved divider — white shape on top of tinted form bg -->
        <svg
          class="card-divider"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M 0 0 L 56 0 C 38 32, 60 68, 50 100 L 0 100 Z" fill="var(--card-fill)" />
        </svg>

        <!-- LEFT — Isometric data illustration -->
        <div class="card-illust">
          <svg
            class="illust"
            viewBox="0 0 600 500"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="floor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#dbeafe" stop-opacity="0.75" />
                <stop offset="1" stop-color="#bfdbfe" stop-opacity="0.2" />
              </linearGradient>
              <linearGradient id="panelL" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#eff6ff" stop-opacity="0.97" />
                <stop offset="1" stop-color="#dbeafe" stop-opacity="0.4" />
              </linearGradient>
              <linearGradient id="panelR" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ede9fe" stop-opacity="0.97" />
                <stop offset="1" stop-color="#c7d2fe" stop-opacity="0.4" />
              </linearGradient>
              <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#93c5fd" />
                <stop offset="0.5" stop-color="#3b82f6" />
                <stop offset="1" stop-color="#1d4ed8" />
              </linearGradient>
              <linearGradient id="towerTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#bfdbfe" />
                <stop offset="1" stop-color="#60a5fa" />
              </linearGradient>
              <linearGradient id="bar1" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#3b82f6" />
                <stop offset="1" stop-color="#60a5fa" />
              </linearGradient>
              <linearGradient id="bar2" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#2563eb" />
                <stop offset="1" stop-color="#3b82f6" />
              </linearGradient>
              <linearGradient id="bar3" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#7c3aed" />
                <stop offset="1" stop-color="#a78bfa" />
              </linearGradient>
              <linearGradient id="bar4" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#db2777" />
                <stop offset="1" stop-color="#f472b6" />
              </linearGradient>
              <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stop-color="#3b82f6" stop-opacity="0.5" />
                <stop offset="0.5" stop-color="#3b82f6" stop-opacity="0.18" />
                <stop offset="1" stop-color="#3b82f6" stop-opacity="0" />
              </radialGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            <!-- Center glow under tower -->
            <circle cx="300" cy="385" r="135" fill="url(#glow)" />

            <!-- Decorative scattered shapes -->
            <circle cx="80" cy="100" r="6" fill="#fbbf24" class="float float-a" />
            <circle cx="540" cy="90" r="8" fill="#f472b6" class="float float-b" />
            <circle cx="56" cy="430" r="5" fill="#34d399" class="float float-c" />
            <rect
              x="540"
              y="380"
              width="14"
              height="14"
              rx="3"
              fill="#a78bfa"
              transform="rotate(45 547 387)"
              class="float float-a"
            />
            <circle cx="430" cy="60" r="3.5" fill="#3b82f6" class="float float-c" />
            <circle cx="170" cy="64" r="3.5" fill="#60a5fa" class="float float-b" />
            <circle cx="100" cy="240" r="2.5" fill="#1d4ed8" opacity="0.6" />
            <circle cx="500" cy="240" r="2.5" fill="#1d4ed8" opacity="0.6" />
            <circle cx="510" cy="430" r="3" fill="#fbbf24" class="float float-b" />

            <!-- Floor platform shadow -->
            <ellipse cx="300" cy="475" rx="180" ry="14" fill="#1e3a8a" opacity="0.06" />

            <!-- Floor platform (isometric) -->
            <path
              d="M 120 380 L 300 290 L 480 380 L 300 470 Z"
              fill="url(#floor)"
              stroke="#60a5fa"
              stroke-width="1.2"
              stroke-opacity="0.65"
            />
            <g stroke="#93c5fd" stroke-width="0.65" stroke-opacity="0.55">
              <path d="M 165 358 L 345 448" />
              <path d="M 210 335 L 390 425" />
              <path d="M 255 313 L 435 403" />
              <path d="M 165 402 L 345 312" />
              <path d="M 210 425 L 390 335" />
              <path d="M 255 447 L 435 357" />
            </g>

            <!-- Back-left translucent panel with bar chart -->
            <g>
              <path
                d="M 100 110 L 285 30 L 285 290 L 100 360 Z"
                fill="url(#panelL)"
                stroke="#60a5fa"
                stroke-width="1.5"
              />
              <!-- Top edge highlight -->
              <path
                d="M 100 110 L 285 30"
                stroke="white"
                stroke-width="0.8"
                stroke-opacity="0.6"
                fill="none"
              />
              <g transform="matrix(0.95, 0.32, 0, 0.95, 130, 130)">
                <rect x="0" y="60" width="20" height="60" rx="3" fill="url(#bar1)" />
                <rect x="30" y="40" width="20" height="80" rx="3" fill="url(#bar2)" />
                <rect x="60" y="20" width="20" height="100" rx="3" fill="url(#bar3)" />
                <rect x="90" y="50" width="20" height="70" rx="3" fill="url(#bar4)" />
              </g>
            </g>

            <!-- Back-right translucent panel with line chart -->
            <g>
              <path
                d="M 315 30 L 500 110 L 500 360 L 315 290 Z"
                fill="url(#panelR)"
                stroke="#818cf8"
                stroke-width="1.5"
              />
              <path
                d="M 315 30 L 500 110"
                stroke="white"
                stroke-width="0.8"
                stroke-opacity="0.6"
                fill="none"
              />
              <g transform="matrix(0.95, -0.32, 0, 0.95, 340, 245)">
                <!-- Subtle area fill under main line -->
                <path
                  d="M 0 90 L 25 55 L 50 70 L 75 30 L 100 55 L 125 15 L 125 130 L 0 130 Z"
                  fill="#3b82f6"
                  fill-opacity="0.08"
                />
                <polyline
                  points="0,90 25,55 50,70 75,30 100,55 125,15"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="2.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="0,108 25,95 50,80 75,92 100,72 125,85"
                  fill="none"
                  stroke="#a78bfa"
                  stroke-width="2.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.8"
                />
                <circle cx="125" cy="15" r="3.5" fill="#2563eb" />
                <circle cx="125" cy="15" r="6" fill="#2563eb" opacity="0.18" />
                <circle cx="75" cy="30" r="3" fill="#60a5fa" />
              </g>
            </g>

            <!-- Central data tower -->
            <ellipse cx="300" cy="395" rx="42" ry="14" fill="#1e3a8a" opacity="0.32" />
            <path
              d="M 270 290 L 270 380 Q 270 395 300 395 Q 330 395 330 380 L 330 290 Z"
              fill="url(#tower)"
            />
            <!-- Glass highlight on tower -->
            <path
              d="M 273 290 L 273 380 Q 273 393 285 394 L 285 290 Z"
              fill="white"
              fill-opacity="0.2"
            />
            <ellipse cx="300" cy="290" rx="30" ry="10" fill="url(#towerTop)" />
            <ellipse
              cx="300"
              cy="290"
              rx="30"
              ry="10"
              fill="none"
              stroke="white"
              stroke-width="1.2"
              stroke-opacity="0.55"
            />
            <ellipse cx="300" cy="287" rx="20" ry="6" fill="white" opacity="0.45" />
            <ellipse
              cx="300"
              cy="320"
              rx="32"
              ry="10.5"
              fill="none"
              stroke="#bfdbfe"
              stroke-width="0.9"
              stroke-opacity="0.7"
            />
            <ellipse
              cx="300"
              cy="350"
              rx="34"
              ry="11"
              fill="none"
              stroke="#bfdbfe"
              stroke-width="0.9"
              stroke-opacity="0.55"
            />

            <!-- Floating cube above tower -->
            <g class="float float-b" transform="translate(282, 198)">
              <path d="M 18 0 L 36 9 L 36 27 L 18 36 L 0 27 L 0 9 Z" fill="#7c3aed" />
              <path d="M 18 0 L 36 9 L 18 18 L 0 9 Z" fill="#a78bfa" />
              <path d="M 18 18 L 18 36 L 36 27 L 36 9 Z" fill="#5b21b6" />
              <path d="M 18 0 L 0 9 L 18 18 Z" fill="#8b5cf6" opacity="0.85" />
            </g>

            <!-- Floating pie chart -->
            <g class="float float-c" transform="translate(450, 215)">
              <circle r="23" fill="white" stroke="#60a5fa" stroke-width="1.5" />
              <path d="M 0 0 L 0 -23 A 23 23 0 0 1 19.9 11.5 Z" fill="#3b82f6" />
              <path d="M 0 0 L 19.9 11.5 A 23 23 0 0 1 -19.9 11.5 Z" fill="#60a5fa" />
              <path d="M 0 0 L -19.9 11.5 A 23 23 0 0 1 0 -23 Z" fill="#fbbf24" />
              <circle r="6.5" fill="white" />
            </g>

            <!-- Floating mini cube near left -->
            <g class="float float-a" transform="translate(140, 235)">
              <path d="M 12 0 L 24 6 L 24 20 L 12 26 L 0 20 L 0 6 Z" fill="#f472b6" />
              <path d="M 12 0 L 24 6 L 12 12 L 0 6 Z" fill="#fbcfe8" />
              <path d="M 12 12 L 12 26 L 24 20 L 24 6 Z" fill="#db2777" />
              <path d="M 12 0 L 0 6 L 12 12 Z" fill="#ec4899" opacity="0.85" />
            </g>
          </svg>
        </div>

        <!-- RIGHT — Form area -->
        <div class="card-form-area">
          <transition name="fade-slide" mode="out-in">
            <component :is="formComponents[component]" v-model="component" class="form-shell" />
          </transition>
        </div>
      </div>

      <!-- Card foot -->
      <div class="card-foot">
        <span>© {{ new Date().getFullYear() }} 掌学兔</span>
        <span class="dot">·</span>
        <span>v {{ defaultSettings.version }}</span>
        <span class="dot">·</span>
        <span>专业认证练习平台</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defaultSettings } from "@/settings";
import CommonWrapper from "@/components/CommonWrapper/index.vue";
import DarkModeSwitch from "@/components/DarkModeSwitch/index.vue";

type LayoutMap = "login" | "register" | "resetPwd";

const t = useI18n().t;

const component = ref<LayoutMap>("login");
const formComponents = {
  login: defineAsyncComponent(() => import("./components/Login.vue")),
  register: defineAsyncComponent(() => import("./components/Register.vue")),
  resetPwd: defineAsyncComponent(() => import("./components/ResetPwd.vue")),
};

onMounted(() => {});
onBeforeUnmount(() => {});
</script>

<style lang="scss">
/* ============ Global font load ============ */
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap");
</style>

<style lang="scss" scoped>
/* ============ Tokens ============ */
$blue-50: #eff6ff;
$blue-100: #dbeafe;
$blue-300: #93c5fd;
$blue-400: #60a5fa;
$blue-500: #3b82f6;
$blue-600: #2563eb;
$blue-700: #1d4ed8;
$blue-800: #1e40af;
$blue-900: #1e3a8a;

$tinted: #f4f7fc;
$ink: #0f172a;
$ink-soft: #475569;
$ink-muted: #64748b;
$ink-faint: #94a3b8;

$display:
  "Outfit",
  "Noto Sans SC",
  "PingFang SC",
  "HarmonyOS Sans SC",
  "Microsoft YaHei",
  -apple-system,
  blinkmacsystemfont,
  sans-serif;
$body:
  "Outfit",
  "Noto Sans SC",
  "PingFang SC",
  "HarmonyOS Sans SC",
  "Microsoft YaHei",
  -apple-system,
  blinkmacsystemfont,
  sans-serif;

/* ============ Page shell ============ */
.login-shell {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  font-family: $body;
  background: linear-gradient(135deg, #5fa3ff 0%, #2563eb 55%, #1e3a8a 100%);
  isolation: isolate;
}

/* Decorative ambient blobs */
.bg-blob {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(80px);
}

.blob-1 {
  top: -12%;
  left: -8%;
  width: 52vmax;
  height: 52vmax;
  background: radial-gradient(circle, rgb(167 196 255 / 65%), transparent 70%);
}

.blob-2 {
  right: -14%;
  bottom: -18%;
  width: 60vmax;
  height: 60vmax;
  background: radial-gradient(circle, rgb(96 165 250 / 70%), transparent 70%);
}

.blob-3 {
  top: 20%;
  right: 10%;
  width: 28vmax;
  height: 28vmax;
  background: radial-gradient(circle, rgb(165 180 252 / 45%), transparent 70%);
  animation: blob-drift 22s ease-in-out infinite alternate;
}

@keyframes blob-drift {
  to {
    transform: translate(-8%, 12%) scale(1.1);
  }
}

.bg-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgb(255 255 255 / 6%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 6%) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse at center, black, transparent 75%);
}

/* ============ Card ============ */
.login-card {
  --card-fill: white;

  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: min(90vw, 960px);
  padding: 22px 30px 16px;
  margin: auto;
  background: white;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 26px;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 80%) inset,
    0 36px 90px -24px rgb(15 50 130 / 38%),
    0 18px 36px -12px rgb(15 50 130 / 22%);
  animation: card-in 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ============ Card header ============ */
.card-header {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 22px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 8px 16px rgb(29 78 216 / 32%));
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-family: $display;
  font-size: 21px;
  font-weight: 700;
  color: $ink;
  letter-spacing: 0.01em;
}

.brand-sub {
  font-family: "Outfit", sans-serif;
  font-size: 10.5px;
  font-weight: 500;
  color: $ink-faint;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.card-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;

  :deep(.common-wrapper) {
    color: $ink-soft;
  }
}

/* ============ Card body — split layout ============ */
.card-body {
  position: relative;
  display: grid;
  flex: 1;
  grid-template-columns: 1.05fr 1fr;
  min-height: 420px;
  overflow: hidden;
  background: $tinted;
  background-image:
    radial-gradient(circle at 100% 0%, rgb(167 139 250 / 8%), transparent 50%),
    radial-gradient(circle at 0% 100%, rgb(96 165 250 / 8%), transparent 50%);
  border-radius: 22px;
}

.card-divider {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.card-illust {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 18px 24px 24px;
}

.illust {
  width: 100%;
  max-width: 380px;
  height: auto;
  filter: drop-shadow(0 16px 32px rgb(15 50 130 / 12%));
}

/* Float animations on illustration accents */
.float {
  transform-origin: center;
  animation: float-y 6.5s ease-in-out infinite;
}

.float-b {
  animation-duration: 8s;
  animation-delay: -1.4s;
}

.float-c {
  animation-duration: 10s;
  animation-delay: -2.8s;
}

@keyframes float-y {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-7px);
  }
}

.card-form-area {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 44px 24px 52px;
}

/* ============ Card foot ============ */
.card-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 22px 4px 6px;
  font-family: $body;
  font-size: 12px;
  color: $ink-faint;
  letter-spacing: 0.02em;
}

.card-foot .dot {
  color: rgb(148 163 184 / 50%);
}

/* ============ Form transition ============ */
.fade-slide-leave-active,
.fade-slide-enter-active {
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ============ Responsive ============ */
@media (max-width: 960px) {
  .card-body {
    grid-template-columns: 1fr;
  }

  .card-illust,
  .card-divider {
    display: none;
  }

  .card-form-area {
    padding: 32px 28px;
  }
}

@media (max-width: 640px) {
  .login-card {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    padding: 18px 18px 14px;
    border-radius: 22px;
  }

  .card-body {
    border-radius: 14px;
  }

  .brand-name {
    font-size: 19px;
  }
}

/* ============ Dark mode ============ */
:global(html.dark) .login-shell {
  background: linear-gradient(135deg, #0a1f4a 0%, #061538 60%, #030c25 100%);
}

:global(html.dark) .login-card {
  --card-fill: #111a30;

  background: #0e1729;
  border-color: rgb(255 255 255 / 6%);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 6%) inset,
    0 36px 90px -24px rgb(0 0 0 / 60%),
    0 18px 36px -12px rgb(0 0 0 / 50%);
}

:global(html.dark) .card-body {
  background: #0a1322;
}

:global(html.dark) .brand-name {
  color: #f1f5f9;
}

:global(html.dark) .brand-sub {
  color: #64748b;
}

:global(html.dark) .card-toolbar :deep(.common-wrapper) {
  color: #cbd5e1;
}

:global(html.dark) .card-foot {
  color: #64748b;
}

:global(html.dark) .card-foot .dot {
  color: rgb(100 116 139 / 50%);
}
</style>
