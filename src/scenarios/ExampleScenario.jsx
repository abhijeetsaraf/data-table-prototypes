import { Link } from 'react-router-dom'

export default function ExampleScenario() {
  return (
    <main className="scenario">
      <Link to="/" className="back-link">← Back</Link>
      <h1>Example Scenario</h1>
      <p>Replace this with your prototype content.</p>
    </main>
  )
}
