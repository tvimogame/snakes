import { useEffect, useReducer, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createInitialState, snakeReducer, speedLevelOf, stepMs } from '../game/snake.js'

const RECORD_KEY = 'tvimogame-snake-record'

function loadRecord() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECORD_KEY) || 'null')
    if (raw && Number.isFinite(raw.score) && Number.isFinite(raw.length)) {
      return { score: raw.score, length: raw.length }
    }
  } catch {
    // corrupted record — fall through to defaults
  }
  return { score: 0, length: 0 }
}

export function useSnake() {
  const [state, dispatch] = useReducer(snakeReducer, undefined, createInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Apply updates synchronously so window.__snake.state() is always fresh
  // (used by e2e tests and keyboard/interval drivers).
  const push = (action) => {
    flushSync(() => dispatch(action))
  }

  const [record, setRecord] = useState(loadRecord)

  useEffect(() => {
    if (state.status !== 'over' && state.status !== 'won') return undefined
    const finalScore = state.score
    const finalLength = state.snake.length
    setRecord((prev) => {
      const next = {
        score: Math.max(prev.score, finalScore),
        length: Math.max(prev.length, finalLength),
      }
      if (next.score === prev.score && next.length === prev.length) return prev
      localStorage.setItem(RECORD_KEY, JSON.stringify(next))
      return next
    })
    return undefined
  }, [state.status, state.score, state.snake.length])

  const speedLevel = speedLevelOf(state.elapsed)
  const slowed = state.slowLeft > 0

  useEffect(() => {
    if (state.status !== 'playing' || state.frozen) return undefined
    const ms = stepMs(state.elapsed, slowed)
    const id = setInterval(() => push({ type: 'TICK', dt: ms }), ms)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.frozen, speedLevel, slowed])

  useEffect(() => {
    const onKey = (e) => {
      const st = stateRef.current
      const k = e.key
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) {
        e.preventDefault()
      }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') push({ type: 'TURN', dir: 'left' })
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') push({ type: 'TURN', dir: 'right' })
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') push({ type: 'TURN', dir: 'up' })
      else if (k === 'ArrowDown' || k === 's' || k === 'S') push({ type: 'TURN', dir: 'down' })
      else if (k === ' ') {
        if (st.status === 'playing' || st.status === 'paused') push({ type: 'TOGGLE_PAUSE' })
      } else if (k === 'r' || k === 'R') {
        if (st.status !== 'ready') push({ type: 'START' })
      } else if (k === 'Enter' && (st.status === 'ready' || st.status === 'over' || st.status === 'won')) {
        push({ type: 'START' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.__snake = {
      dispatch: push,
      state: () => stateRef.current,
    }
    return () => {
      delete window.__snake
    }
  }, [])

  return { state, dispatch, record }
}
