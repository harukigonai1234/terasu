import { createRoot } from 'react-dom/client'
import '@cloudscape-design/global-styles/index.css'
import { applyMode, Mode } from '@cloudscape-design/global-styles'
import { App } from './App'

applyMode(Mode.Dark)

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
