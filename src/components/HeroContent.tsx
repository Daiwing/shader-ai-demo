// Hero title, tagline, and links layered above the canvas; reacts via CSS custom properties.

import styles from './HeroContent.module.css'

export function HeroContent() {
  return (
    <div className={styles.hero}>
      <nav className={styles.nav}>
        <span className={styles.brand}>◈ shaded</span>
        <ul className={styles.links}>
          <li>
            <a className={styles.link} href="#overview">
              overview
            </a>
          </li>
          <li>
            <a className={styles.link} href="#how-it-works">
              how it works
            </a>
          </li>
          <li>
            <a
              className={styles.link}
              href="https://github.com/Daiwing/shader-ai-demo"
              target="_blank"
              rel="noreferrer"
            >
              source
            </a>
          </li>
        </ul>
      </nav>

      <div className={styles.center}>
        <h1 className={styles.title}>shaded</h1>
        <p className={styles.tagline}>an interactive webgpu shader, reacting to you</p>
        <div className={styles.actions}>
          <a className={styles.action} href="#how-it-works">
            learn how ↗
          </a>
          <a
            className={styles.action}
            href="https://github.com/Daiwing/shader-ai-demo"
            target="_blank"
            rel="noreferrer"
          >
            view source ↗
          </a>
        </div>
      </div>
    </div>
  )
}
