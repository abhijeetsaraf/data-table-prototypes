import { Routes, Route } from 'react-router-dom'
import CaseStudy from './CaseStudy.jsx'
import { scenarios } from './scenarios.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CaseStudy />} />
      {scenarios.map(({ path, component: Component }) => (
        <Route key={path} path={`/${path}`} element={<Component />} />
      ))}
    </Routes>
  )
}
