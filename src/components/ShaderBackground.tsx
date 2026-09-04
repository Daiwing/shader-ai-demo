// Full-viewport WebGPU canvas with a CSS gradient fallback for unsupported browsers.

import { useWebGPUCanvas } from '../hooks/useWebGPUCanvas'
import styles from './ShaderBackground.module.css'

export function ShaderBackground() {
  const { canvasRef, status } = useWebGPUCanvas()
  const showFallback = status === 'unsupported' || status === 'error'

  return (
    <div className={styles.root} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      {showFallback ? <div className={styles.fallback} /> : null}
    </div>
  )
}
