import { readFileSync } from 'node:fs'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App, { DOWNLOAD_URL } from './App'
import * as appModule from './App'

const styles = readFileSync('src/styles.css', 'utf8')
const shapeBlurSource = readFileSync('src/components/react-bits/ShapeBlur/ShapeBlur.jsx', 'utf8')

describe('AetherFlow landing page', () => {
  it('uses the stable installer path produced by landing:copy', () => {
    expect(DOWNLOAD_URL).toBe(
      'https://github.com/Magnitoshka/AetherFLow/releases/latest/download/AetherFlow-Setup-latest.exe',
    )
  })

  it('marks the primary header as sticky page chrome', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toHaveClass('site-header', 'site-header--sticky')
  })

  it('routes every download call to action to the packaged installer', () => {
    render(<App />)

    const links = screen.getAllByRole('link', { name: /download/i })
    expect(links.length).toBeGreaterThanOrEqual(3)
    links.forEach((link) => expect(link).toHaveAttribute('href', DOWNLOAD_URL))
  })

  it('connects primary navigation to page sections', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features')
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how-it-works')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq')
  })

  it('keeps every product preview completely decorative', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const previews = container.querySelectorAll('.product-window')

    expect(previews).toHaveLength(2)
    previews.forEach((preview) => {
      expect(preview).toHaveAttribute('inert')
      preview.querySelectorAll('button').forEach((button) => expect(button).toBeDisabled())
    })

    await user.click(previews[0].querySelector('button[aria-label="Audio"]'))
    expect(previews[0].querySelector('button[aria-label="Audio"]')).toHaveAttribute('aria-pressed', 'false')
  })

  it('reserves a blur-height safe area below the footer content', () => {
    const { container } = render(<App />)
    expect(container.querySelector('footer')).toHaveStyle({ paddingBottom: '7rem' })
  })

  it('exposes an accessible FAQ disclosure', async () => {
    const user = userEvent.setup()
    render(<App />)

    const trigger = screen.getByRole('button', { name: 'Is AetherFlow free?' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/free to download/i)).toBeVisible()
  })

  it('keeps Aurora only inside the showcase and final CTA', () => {
    const { container } = render(<App />)

    expect(screen.getAllByTestId('aurora-field')).toHaveLength(2)
    expect(container.querySelector('.hero .aurora-field')).not.toBeInTheDocument()
    expect(container.querySelector('.features-section .aurora-field')).not.toBeInTheDocument()
    expect(container.querySelector('.showcase .aurora-field')).toBeInTheDocument()
    expect(container.querySelector('.final-cta .aurora-field')).toBeInTheDocument()
  })

  it('adds a decorative ShapeBlur layer to the AetherFlow in action boundary', async () => {
    const { container } = render(<App />)
    await waitFor(() => expect(container.querySelector('.showcase-shell > .showcase-shape-blur')).toBeInTheDocument())
    const shapeBlur = container.querySelector('.showcase-shell > .showcase-shape-blur')

    expect(shapeBlur).toBeInTheDocument()
    expect(shapeBlur).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.showcase-shell > .showcase')).toBeInTheDocument()
    expect(styles).toContain('.showcase-shell { position: relative; overflow: visible;')
    expect(appModule.SHOWCASE_SHAPE_BLUR_CONFIG).toEqual({
      variation: 0,
      pixelRatioProp: 1.5,
      shapeSize: 1,
      roundness: 0.5,
      borderSize: 0.05,
      circleSize: 0.34,
      circleEdge: 0.82,
      frameInset: 112,
    })
    expect(shapeBlur).toHaveStyle({ '--shape-blur-frame-inset-default': '112px' })
    expect(styles).toContain('inset: calc(-1 * var(--shape-blur-frame-inset))')
    expect(styles).toContain('margin-bottom: 96px')
    expect(styles).toContain('--shape-blur-frame-inset: 80px')
    expect(styles).toContain('margin-bottom: 72px')
    expect(shapeBlurSource).toContain('uniform float u_frameInset')
    expect(shapeBlurSource).toContain('frameResolution')
    expect(shapeBlurSource).toContain("getPropertyValue('--shape-blur-frame-inset')")
  })

  it('does not render decorative landscape imagery behind page sections', () => {
    const { container } = render(<App />)

    expect(container.querySelector('.mountain-layer')).not.toBeInTheDocument()
    expect(container.querySelector('.feature-landscape')).not.toBeInTheDocument()
  })

  it('uses compact responsive spacing without removed-background compensation', () => {
    expect(styles).toContain('min-height: clamp(680px, 82dvh, 800px)')
    expect(styles).toContain('scroll-margin-top: 112px')
    expect(styles).not.toContain('padding-block: 72px 300px')
    expect(styles).not.toContain('width: 132%')
    expect(styles).not.toContain('width: 140%')
    expect(styles).not.toContain('margin-bottom: -28%')
    expect(styles).not.toContain('margin-bottom: -21%')
  })

  it('renders a decorative React Bits galaxy behind the hero content', () => {
    const { container } = render(<App />)
    const galaxy = container.querySelector('.hero > .hero-galaxy.galaxy-container')

    expect(galaxy).toBeInTheDocument()
    expect(galaxy).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the approved interactive Galaxy settings in the hero', () => {
    expect(appModule.HERO_GALAXY_CONFIG).toEqual({
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
    })

    const { container } = render(<App />)
    expect(container.querySelector('.hero-galaxy')).toHaveAttribute('data-interaction-target', 'parent')
  })

  it('extends the Galaxy through both hero edges without dark seams', () => {
    expect(styles).toContain('margin-top: calc(-1 * var(--hero-top-bleed))')
    expect(styles).toContain('padding-top: var(--hero-top-bleed)')
    expect(styles).not.toContain('border-bottom: 1px solid rgb(143 104 221 / 0.14)')
    expect(styles).not.toContain('mask-image: linear-gradient')
  })

  it('keeps a visible gradual blur attached to the page viewport', () => {
    const { container } = render(<App />)
    const blur = container.querySelector('.site-shell > .page-gradual-blur')

    expect(blur).toBeInTheDocument()
    expect(container.querySelector('main .page-gradual-blur')).not.toBeInTheDocument()
    expect(blur).toHaveClass('gradual-blur-page', 'gradual-blur-fixed')
    expect(blur).toHaveStyle({ position: 'fixed', height: '7rem' })
    expect(blur.style.backgroundImage).toContain('linear-gradient')
    expect(blur.querySelectorAll('.gradual-blur-inner > div')).toHaveLength(5)
  })
})
