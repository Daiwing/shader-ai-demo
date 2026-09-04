// Full-viewport WebGPU canvas with a CSS gradient fallback for unsupported browsers.

import { useWebGPUCanvas } from '../hooks/useWebGPUCanvas'
import styles from './ShaderBackground.module.css'

export function ShaderBackground() {
  const { canvasRef, status } = useWebGPUCanvas()
  const showFallback = status === 'unsupported' || status === 'error'

  return (
    <div className={styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" hidden={showFallback} />
      {showFallback ? (
        <div className={styles.fallback}>
          <p className={styles.message}>
            this demo needs WebGPU, which isn&apos;t available here. try a recent version of Chrome
            or Edge to see the animated shader.
          </p>
        </div>
      ) : null}
    </div>
  )
}
