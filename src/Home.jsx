import { Link } from 'react-router-dom'
import { scenarios } from './scenarios.jsx'

export default function Home() {
  return (
    <main className="home">
      <h1>Data Table Prototypes</h1>
      <ul className="scenario-list">
        {scenarios.map(({ path, title, description }) => (
          <li key={path}>
            <Link to={`/${path}`}>
              <span className="scenario-title">{title}</span>
              {description && (
                <span className="scenario-description">{description}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
