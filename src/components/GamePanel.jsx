import { speedLabel } from '../game/snake.js'

const MODE_NAMES = { conquer: 'Проценты', survive: 'Выживи' }

export default function GamePanel({ state, dispatch, record }) {
  const { status, score, snake, elapsed, mode } = state
  const canPause = status === 'playing' || status === 'paused'

  return (
    <div className="panels d-flex flex-column gap-3">
      <div className="panel">
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Счёт</span>
          <span key={score} className="stat-value score-value">
            {score}
          </span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Длина</span>
          <span className="stat-value">{snake.length}</span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Скорость</span>
          <span className="stat-value">{speedLabel(elapsed)}</span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Режим</span>
          <span className="stat-value">{MODE_NAMES[mode] ?? '—'}</span>
        </div>
      </div>

      <div className="panel">
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Рекорд</span>
          <span className="stat-value">{record.score}</span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Рекорд длины</span>
          <span className="stat-value">{record.length}</span>
        </div>
      </div>

      <div className="panel">
        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            disabled={!canPause}
          >
            {status === 'paused' ? 'Продолжить' : 'Пауза'}
          </button>
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => dispatch({ type: 'START' })}
          >
            Новая игра
          </button>
        </div>
        <ul className="controls-hint list-unstyled mb-0 mt-3">
          <li>
            <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> / <kbd>WASD</kbd> — направление
          </li>
          <li>
            <kbd>Space</kbd> — пауза
          </li>
          <li>
            <kbd>R</kbd> — рестарт
          </li>
        </ul>
      </div>
    </div>
  )
}
