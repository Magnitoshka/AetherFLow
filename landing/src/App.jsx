import { lazy, Suspense, useState } from 'react'
import {
  ArrowClockwise,
  ArrowRight,
  CaretDown,
  Check,
  Code,
  DownloadSimple,
  FilmStrip,
  FolderOpen,
  Gear,
  HighDefinition,
  LinkSimple,
  List as MenuIcon,
  ListBullets,
  LockKey,
  NavigationArrow,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  VideoCamera,
  WindowsLogo,
  X,
} from '@phosphor-icons/react'
import { useReducedMotion } from 'motion/react'
import AnimatedAuroraField from './components/AnimatedAuroraField'
import AnimatedContent from './components/react-bits/AnimatedContent/AnimatedContent'
import BlurText from './components/react-bits/BlurText/BlurText'
import GradualBlur from './components/react-bits/GradualBlur/GradualBlur'
import Galaxy from './components/react-bits/Galaxy/Galaxy'
import SpotlightCard from './components/react-bits/SpotlightCard/SpotlightCard'

const ShapeBlur = lazy(() => import('./components/react-bits/ShapeBlur/ShapeBlur'))

export const DOWNLOAD_URL =
  'https://github.com/Magnitoshka/AetherFLow/releases/latest/download/AetherFlow-Setup-latest.exe'

export const HERO_GALAXY_CONFIG = {
  mouseInteraction: true,
  mouseRepulsion: true,
  density: 2.4,
  glowIntensity: 0.6,
  saturation: 0,
  hueShift: 140,
  twinkleIntensity: 1,
  rotationSpeed: 0.05,
  repulsionStrength: 2.5,
  autoCenterRepulsion: 0,
  starSpeed: 0.8,
  speed: 0.5,
}

export const SHOWCASE_SHAPE_BLUR_CONFIG = {
  variation: 0,
  pixelRatioProp: 1.5,
  shapeSize: 1,
  roundness: 0.5,
  borderSize: 0.05,
  circleSize: 0.34,
  circleEdge: 0.82,
  frameInset: 112,
}

const navItems = [
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['FAQ', '#faq'],
]

const trustItems = [
  { icon: LockKey, title: 'Local processing', text: 'Everything happens on your PC.' },
  { icon: Code, title: 'Built-in yt-dlp', text: 'Reliable downloads with active updates.' },
  { icon: FilmStrip, title: 'Built-in FFmpeg', text: 'Fast merging and format conversion.' },
  { icon: UserCircle, title: 'No registration', text: 'Free to use. No sign-up required.' },
]

const steps = [
  { icon: LinkSimple, title: 'Paste a link', text: 'Copy a YouTube video or playlist link and paste it in AetherFlow.' },
  { icon: SlidersHorizontal, title: 'Choose a format', text: 'Pick MP4 or MP3 and select the quality you want.' },
  { icon: DownloadSimple, title: 'Save locally', text: 'Download and enjoy your files offline, anytime.' },
]

const features = [
  { icon: VideoCamera, title: 'Videos and MP3 audio', text: 'Download MP4 videos or extract MP3 audio with multiple quality options.' },
  { icon: HighDefinition, title: '360p to 1080p+', text: 'Choose the quality that fits your needs, up to 1080p and beyond when available.' },
  { icon: FolderOpen, title: 'Playlist downloads', text: 'Save entire playlists and channels into organized folders.' },
  { icon: ListBullets, title: 'Queue with progress', text: 'See real-time progress, speed, file size, and ETA for every download.' },
  { icon: ArrowClockwise, title: 'Retry and cancel', text: 'Pause, cancel, or retry any item. You stay in control.' },
]

const faqs = [
  ['Is AetherFlow free?', 'Yes. AetherFlow is free to download and use. There are no hidden fees.'],
  ['Do I need additional software?', 'No. AetherFlow includes yt-dlp, FFmpeg, and the required Windows runtime files.'],
  ['What platforms are supported?', 'AetherFlow 1.0.0 is available for Windows 10 and Windows 11 on x64 systems.'],
  ['Can I download playlists and channels?', 'Yes. Paste a playlist or channel link to download available videos into an organized folder.'],
]

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="AetherFlow home">
      <span className="brand-mark"><NavigationArrow weight="fill" /></span>
      <span>AetherFlow</span>
    </a>
  )
}

function DownloadCta({ compact = false, className = '' }) {
  return (
    <a className={`download-button ${compact ? 'download-button--compact' : ''} ${className}`} href={DOWNLOAD_URL}>
      <WindowsLogo weight="fill" />
      <span>{compact ? 'Download' : 'Download for Windows'}</span>
    </a>
  )
}

function Reveal({ children, ...props }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion || import.meta.env.MODE === 'test') return children
  return <AnimatedContent {...props}>{children}</AnimatedContent>
}

function HeroGalaxy() {
  const reduceMotion = useReducedMotion()
  return (
    <Galaxy
      {...HERO_GALAXY_CONFIG}
      className="hero-galaxy"
      interactionTarget="parent"
      aria-hidden="true"
      disableAnimation={Boolean(reduceMotion)}
      transparent
    />
  )
}

function ProductDemo({ compact = false }) {
  const progress = 62

  return (
    <div className={`product-window ${compact ? 'product-window--compact' : ''}`} aria-hidden="true" inert="">
      <div className="window-bar">
        <Brand />
        <div className="window-actions" aria-hidden="true"><Gear /><span>−</span><span>□</span><span>×</span></div>
      </div>
      <div className="product-body">
        <div className="product-main">
          <label className="field-label" htmlFor={compact ? 'url-compact' : 'url-main'}>Paste a video or playlist link</label>
          <div className="url-row">
            <input id={compact ? 'url-compact' : 'url-main'} defaultValue="https://www.youtube.com/watch?v=AetherFlow" readOnly tabIndex={-1} />
            <button type="button" disabled>Paste</button>
          </div>
          <div className="preview-row">
            <button className="video-preview" type="button" disabled aria-label="Video preview">
              <span className="preview-glow" />
              <span className="play-control"><Pause weight="fill" /></span>
              <span className="duration">4:24</span>
            </button>
            <div className="preview-copy">
              <strong>Example Video</strong>
              <span>Channel Name</span>
              <span>1,234,567 views · 2 years ago</span>
              <p>An example video preview shown inside AetherFlow.</p>
            </div>
          </div>
          <div className="format-tabs" aria-label="Download format">
            <button type="button" disabled aria-label="Video" aria-pressed="true"><VideoCamera /> Video <span>(MP4)</span></button>
            <button type="button" disabled aria-label="Audio" aria-pressed="false"><FilmStrip /> Audio <span>(MP3)</span></button>
          </div>
          <div className="download-options">
            <label>
              <span>Quality</span>
              <select defaultValue="1080p (Full HD)" disabled tabIndex={-1}>
                <option>1080p (Full HD)</option><option>720p (HD)</option><option>480p</option><option>360p</option>
              </select>
            </label>
            <div><span>File size (approx.)</span><strong>82.4 MB</strong></div>
          </div>
          <div className="save-path"><span>C:\Users\User\Videos\AetherFlow</span><button type="button" disabled>Browse</button></div>
          <button className="demo-download" type="button" disabled><DownloadSimple /> Download</button>
        </div>
        <aside className="queue-panel">
          <div className="queue-heading"><strong>Playlists</strong><button type="button" disabled aria-label="Add playlist">+</button></div>
          <button className="playlist-row" type="button" disabled><Play /> Liked Videos <span>12 videos</span></button>
          <button className="playlist-row active" type="button" disabled><FilmStrip /> Chill Mix <span>24 videos</span></button>
          <div className="queue-heading"><strong>Queue</strong><span>4 active</span></div>
          {[['Example Video', progress], ['Another Track', 37], ['Live Performance', 12], ['Documentary Clip', 0]].map(([name, value], index) => (
            <div className="queue-item" key={name}>
              <span className="queue-thumb" />
              <div><strong>{name}</strong><span>{index === 1 ? 'MP3 · 320 kbps' : '720p · MP4'}</span><i><b style={{ width: `${value}%` }} /></i></div>
              <span>{value ? `${value}%` : 'Queued'}</span>
            </div>
          ))}
        </aside>
      </div>
      <div className="overall-progress"><span>Overall progress</span><i><b style={{ width: `${progress}%` }} /></i><strong>{progress}%</strong><button type="button" disabled>Cancel All</button></div>
    </div>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header site-header--sticky">
      <Brand />
      <nav className={open ? 'nav-open' : ''} aria-label="Primary navigation">
        {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <DownloadCta compact className="mobile-download" />
      </nav>
      <DownloadCta compact className="desktop-download" />
      <button className="menu-button" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <MenuIcon />}</button>
    </header>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'is-open' : ''}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{question}</span><CaretDown aria-hidden="true" />
      </button>
      <div className="faq-answer" hidden={!open}><p>{answer}</p></div>
    </div>
  )
}

export default function App() {
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <HeroGalaxy />
          <div className="hero-content">
            <div className="hero-copy">
              <h1 id="hero-title" className="hero-title">
                <BlurText as="span" className="hero-line" text="Download" delay={105} />
                <BlurText as="span" className="hero-line" text="what matters." delay={105} />
              </h1>
              <p className="hero-subtitle">Save videos, playlists, and MP3 files locally.<br />No account. No extra tools.</p>
              <DownloadCta />
              <p className="platform-note">Windows 10/11 <span>|</span> x64 <span>|</span> Free</p>
            </div>
            <Reveal direction="horizontal" distance={42} delay={0.12}>
              <div className="hero-demo"><ProductDemo /></div>
            </Reveal>
          </div>
        </section>

        <section className="trust-strip" aria-label="Product facts">
          {trustItems.map(({ icon: Icon, title, text }) => (
            <div className="trust-item" key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></div>
          ))}
        </section>

        <section className="section how-section" id="how-it-works">
          <Reveal><h2>How it <em>works</em></h2></Reveal>
          <div className="steps">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <div className="step" key={title}>
                <span className="step-icon"><Icon /></span>
                <div><strong>{title}</strong><p>{text}</p></div>
                {index < steps.length - 1 ? <ArrowRight className="step-arrow" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section feature-content">
            <Reveal><h2>Everything you<br /><em>need</em>, nothing<br />you don’t.</h2></Reveal>
            <div className="feature-list">
              {features.map(({ icon: Icon, title, text }) => (
                <div className="feature-item" key={title}><Icon /><div><strong>{title}</strong><p>{text}</p></div></div>
              ))}
            </div>
          </div>
        </section>

        <div className="section showcase-shell">
          <Suspense fallback={null}>
            <ShapeBlur
              {...SHOWCASE_SHAPE_BLUR_CONFIG}
              className="showcase-shape-blur"
              aria-hidden="true"
            />
          </Suspense>
          <section className="showcase" aria-labelledby="showcase-title">
            <AnimatedAuroraField variant="showcase" intensity={0.78} speed={0.45} />
            <Reveal>
              <div className="showcase-heading"><h2 id="showcase-title">AetherFlow <em>in action</em></h2><p>A clean, powerful desktop experience built for everyday use.</p></div>
            </Reveal>
            <div className="showcase-demo"><ProductDemo compact /></div>
          </section>
        </div>

        <section className="section privacy-section">
          <SpotlightCard className="privacy-visual" spotlightColor="rgb(126 78 255 / 0.28)">
            <div className="monitor"><div className="monitor-screen"><ShieldCheck weight="duotone" /></div><span /></div>
          </SpotlightCard>
          <Reveal direction="horizontal" distance={44}>
            <div className="privacy-copy"><h2>Private by design.<br /><em>Local</em> by default.</h2><p>AetherFlow runs on your Windows PC. Links, downloads, and files never leave your device unless you choose to share them. No accounts, no tracking, no distractions.</p><ul><li><Check /> Local files stay local</li><li><Check /> No account or cloud upload</li></ul></div>
          </Reveal>
        </section>

        <section className="section faq-section" id="faq">
          <h2>FAQ</h2>
          <div className="faq-grid">{faqs.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}</div>
        </section>

        <section className="final-cta">
          <AnimatedAuroraField variant="cta" intensity={0.9} speed={0.58} />
          <div><h2>Ready when you are.</h2><p>One powerful app for Windows. One click to get started.</p></div>
          <div><DownloadCta /><span>Windows 10/11 <b>|</b> x64 <b>|</b> Free</span></div>
        </section>
      </main>
      <footer style={{ paddingBottom: '7rem' }}><Brand /><p>© 2026 AetherFlow. Download only content that you own or have permission to save.</p></footer>
      <GradualBlur
        target="page"
        position="bottom"
        height="7rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential
        opacity={1}
        zIndex={20}
        className="page-gradual-blur"
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgb(5 6 10 / 0.12) 48%, rgb(5 6 10 / 0.68) 100%)',
        }}
      />
    </div>
  )
}
