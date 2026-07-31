import { Routes, Route } from 'react-router-dom'
import Home from './Home.jsx'
import { scenarios } from './scenarios.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {scenarios.map(({ path, component: Component }) => (
        <Route key={path} path={`/${path}`} element={<Component />} />
      ))}
    </Routes>
  )
}
