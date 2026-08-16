import { useSnake } from '../hooks/useSnake.js'
import Board from './Board.jsx'
import GamePanel from './GamePanel.jsx'

const MODES = [
  { id: 'conquer', name: 'Проценты', desc: 'Заполни собой всё поле' },
  { id: 'survive', name: 'Выживи', desc: 'Продержись 3 минуты' },
]

export default function Snake() {
  const { state, dispatch, record } = useSnake()
  const { status } = state

  return (
    <div className="game-layout">
      <div className="board-wrap">
        <Board
          snake={state.snake}
          dir={state.dir}
          food={state.food}
          bonus={state.bonus}
          bonusLeft={state.bonusLeft}
        />

        {state.speedUp && status === 'playing' && (
          <div key={state.speedUp.key} className="clear-banner banner--speed">
            СКОРОСТЬ {state.speedUp.label}
          </div>
        )}

        {status === 'playing' && (state.doubleLeft > 0 || state.slowLeft > 0) && (
          <div className="effect-chips" aria-hidden="true">
            {state.doubleLeft > 0 && <span className="chip chip--double">×2 ОЧКИ</span>}
            {state.slowLeft > 0 && <span className="chip chip--slow">ЗАМЕДЛЕНИЕ</span>}
          </div>
        )}

        {status === 'ready' && (
          <div className="overlay">
            <h1 className="overlay-title">SNAKE</h1>
            <p className="text-secondary mb-0">
              Ешь яблоки, расти и не врезайся в стены и себя.
            </p>
            <div className="mode-picker" role="radiogroup" aria-label="Режим игры">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={state.mode === m.id}
                  className={`mode-option${state.mode === m.id ? ' active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_MODE', mode: m.id })}
                >
                  <span className="mode-name">{m.name}</span>
                  <span className="mode-desc">{m.desc}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-accent btn-lg px-4"
              onClick={() => dispatch({ type: 'START' })}
            >
              Играть
            </button>
            <p className="small text-secondary mb-0">или нажмите Enter</p>
          </div>
        )}

        {status === 'paused' && (
          <div className="overlay">
            <h1 className="overlay-title">ПАУЗА</h1>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            >
              Продолжить
            </button>
          </div>
        )}

        {status === 'over' && (
          <div className="overlay">
            <h1 className="overlay-title gameover">ПОРАЖЕНИЕ</h1>
            <p className="mb-1">
              Счёт: <strong>{state.score}</strong>
            </p>
            <p className="mb-3 text-secondary small">Длина: {state.snake.length}</p>
            <button type="button" className="btn btn-accent" onClick={() => dispatch({ type: 'START' })}>
              Заново
            </button>
          </div>
        )}

        {status === 'won' && (
          <div className="overlay">
            <h1 className="overlay-title win">ПОБЕДА</h1>
            <p className="mb-1">
              Счёт: <strong>{state.score}</strong>
            </p>
            <p className="mb-3 text-secondary small">Длина: {state.snake.length}</p>
            <button type="button" className="btn btn-accent" onClick={() => dispatch({ type: 'START' })}>
              Заново
            </button>
          </div>
        )}
      </div>

      <GamePanel state={state} dispatch={dispatch} record={record} />
    </div>
  )
}
