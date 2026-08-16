import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Snake from './components/Snake.jsx'

const BG_SHAPES = [
  { left: '6%', color: '#00e5ff', delay: '0s', size: 42 },
  { left: '16%', color: '#c93dff', delay: '4s', size: 30 },
  { left: '28%', color: '#00e676', delay: '9s', size: 50 },
  { left: '42%', color: '#ffd600', delay: '2s', size: 26 },
  { left: '58%', color: '#ff9100', delay: '7s', size: 38 },
  { left: '72%', color: '#ff2d55', delay: '11s', size: 32 },
  { left: '86%', color: '#3d7bff', delay: '5s', size: 46 },
  { left: '94%', color: '#00e5ff', delay: '13s', size: 24 },
]

function BgShapes() {
  return (
    <div className="bg-shapes" aria-hidden="true">
      {BG_SHAPES.map((s, i) => (
        <span
          key={i}
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.color,
            animationDelay: s.delay,
            animationDuration: `${14 + (i % 4) * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <BgShapes />
      <Header />
      <main className="app-main">
        <Snake />
      </main>
      <Footer />
    </div>
  )
}
