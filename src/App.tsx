import { ShaderBackground } from './components/ShaderBackground'
import { HeroContent } from './components/HeroContent'
import styles from './App.module.css'

function App() {
  return (
    <main className={styles.app}>
      <ShaderBackground />
      <HeroContent />
    </main>
  )
}

export default App
