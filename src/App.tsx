import { ShaderBackground } from './components/ShaderBackground'
import styles from './App.module.css'

function App() {
  return (
    <main className={styles.app}>
      <ShaderBackground />
      <h1 className={styles.title}>shaded</h1>
    </main>
  )
}

export default App
