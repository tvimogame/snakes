export const SIZE = 20
export const CELL_COUNT = SIZE * SIZE

export const BASE_MS = 150
export const MIN_MS = 60
export const SPEEDUP_EVERY_MS = 30000
export const DOUBLE_MS = 15000
export const SLOW_MS = 5000
export const BONUS_LIFE_MS = 6000
export const SURVIVE_WIN_MS = 180000

export const ITEM_DEFS = {
  apple: { color: '#ff2d55', label: 'Яблоко' },
  golden: { color: '#ffd600', label: 'Золотое яблоко' },
  stamina: { color: '#00e676', label: 'Стройность' },
  speed: { color: '#3d7bff', label: 'Ускорение' },
  poison: { color: '#c93dff', label: 'Ядовитое яблоко' },
  slow: { color: '#ff9100', label: 'Паня' },
}

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }

const BONUS_TABLE = [
  { type: 'golden', weight: 20 },
  { type: 'stamina', weight: 20 },
  { type: 'speed', weight: 20 },
  { type: 'poison', weight: 22 },
  { type: 'slow', weight: 18 },
]

const cellKey = (p) => `${p.x},${p.y}`

export function inBounds(p) {
  return p.x >= 0 && p.y >= 0 && p.x < SIZE && p.y < SIZE
}

export function speedLevelOf(elapsed) {
  return Math.floor(elapsed / SPEEDUP_EVERY_MS)
}

export function baseStepMs(elapsed) {
  return Math.max(MIN_MS, Math.round(BASE_MS * Math.pow(0.9, speedLevelOf(elapsed))))
}

export function stepMs(elapsed, slowed) {
  return (slowed ? 2 : 1) * baseStepMs(elapsed)
}

export function speedLabel(elapsed) {
  return `${(BASE_MS / baseStepMs(elapsed)).toFixed(1)}×`
}

function nextBonusDelay() {
  return 6000 + Math.floor(Math.random() * 8000)
}

function randomFreeCell(occupied) {
  const free = []
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.floor(Math.random() * free.length)]
}

function pickBonusType() {
  const total = BONUS_TABLE.reduce((sum, entry) => sum + entry.weight, 0)
  let r = Math.random() * total
  for (const entry of BONUS_TABLE) {
    r -= entry.weight
    if (r <= 0) return entry.type
  }
  return BONUS_TABLE[0].type
}

function extendTail(snake, n) {
  const out = [...snake]
  for (let i = 0; i < n; i += 1) {
    const tail = out[out.length - 1]
    const neck = out.length > 1 ? out[out.length - 2] : tail
    const candidate = { x: tail.x + (tail.x - neck.x), y: tail.y + (tail.y - neck.y) }
    out.push(inBounds(candidate) ? candidate : { ...tail })
  }
  return out
}

export function createInitialState() {
  const snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ]
  const occupied = new Set(snake.map(cellKey))
  const food = randomFreeCell(occupied) ?? { x: 14, y: 10 }
  return {
    mode: 'conquer',
    status: 'ready',
    snake,
    dir: 'right',
    pending: [],
    food,
    bonus: null,
    bonusLeft: 0,
    nextBonusAt: nextBonusDelay(),
    score: 0,
    doubleLeft: 0,
    slowLeft: 0,
    elapsed: 0,
    speedUp: null,
    frozen: false,
  }
}

export function snakeReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE': {
      if (action.mode === 'conquer' || action.mode === 'survive') {
        return { ...state, mode: action.mode }
      }
      return state
    }

    case 'START': {
      const mode = action.mode || state.mode || 'conquer'
      return { ...createInitialState(), mode, status: 'playing' }
    }

    case 'TICK': {
      if (state.status !== 'playing') return state
      if (state.snake.length >= CELL_COUNT) return { ...state, status: 'won' }

      const dt = Math.min(4000, Math.max(1, action.dt ?? stepMs(state.elapsed, state.slowLeft > 0)))
      const elapsed = state.elapsed + dt
      let doubleLeft = Math.max(0, state.doubleLeft - dt)
      let slowLeft = Math.max(0, state.slowLeft - dt)

      let speedUp = state.speedUp
      if (speedLevelOf(elapsed) > speedLevelOf(state.elapsed)) {
        speedUp = { key: (state.speedUp?.key ?? 0) + 1, label: speedLabel(elapsed) }
      }

      if (state.mode === 'survive' && elapsed >= SURVIVE_WIN_MS) {
        return { ...state, elapsed, doubleLeft, slowLeft, speedUp, status: 'won' }
      }

      let bonus = state.bonus
      let bonusLeft = state.bonusLeft
      let nextBonusAt = state.nextBonusAt
      if (bonus) {
        bonusLeft = Math.max(0, bonusLeft - dt)
        if (bonusLeft === 0) {
          bonus = null
          nextBonusAt = elapsed + nextBonusDelay()
        }
      }

      const dir = state.pending.length > 0 ? state.pending[0] : state.dir
      const pending = state.pending.length > 0 ? state.pending.slice(1) : []
      const head = state.snake[0]
      const next = { x: head.x + DIRS[dir].x, y: head.y + DIRS[dir].y }

      if (!inBounds(next)) {
        return { ...state, elapsed, doubleLeft, slowLeft, speedUp, bonus, bonusLeft, nextBonusAt, status: 'over' }
      }

      const eatsApple = next.x === state.food.x && next.y === state.food.y
      const body = eatsApple ? state.snake : state.snake.slice(0, -1)
      if (body.some((p) => p.x === next.x && p.y === next.y)) {
        return { ...state, elapsed, doubleLeft, slowLeft, speedUp, bonus, bonusLeft, nextBonusAt, status: 'over' }
      }

      let snake = [next, ...state.snake]
      if (!eatsApple) snake = snake.slice(0, -1)

      let score = state.score
      let food = state.food
      const mult = doubleLeft > 0 ? 2 : 1

      if (eatsApple) {
        score += 10 * mult
        const occupied = new Set(snake.map(cellKey))
        if (bonus) occupied.add(cellKey(bonus))
        food = randomFreeCell(occupied) ?? { ...head }
      }

      if (bonus && next.x === bonus.x && next.y === bonus.y) {
        if (bonus.type === 'golden') {
          score += 50 * mult
          doubleLeft = DOUBLE_MS
        } else if (bonus.type === 'stamina') {
          snake = snake.slice(0, Math.max(1, snake.length - 3))
        } else if (bonus.type === 'speed') {
          score += 50 * mult
        } else if (bonus.type === 'poison') {
          score = Math.max(0, score - 50)
          snake = extendTail(snake, 2)
        } else if (bonus.type === 'slow') {
          slowLeft = SLOW_MS
        }
        bonus = null
        bonusLeft = 0
        nextBonusAt = elapsed + nextBonusDelay()
      }

      if (!bonus && elapsed >= nextBonusAt) {
        const occupied = new Set(snake.map(cellKey))
        occupied.add(cellKey(food))
        const cell = randomFreeCell(occupied)
        if (cell) {
          bonus = { ...cell, type: pickBonusType() }
          bonusLeft = BONUS_LIFE_MS
        }
        nextBonusAt = elapsed + nextBonusDelay()
      }

      return {
        ...state,
        snake,
        dir,
        pending,
        food,
        bonus,
        bonusLeft,
        nextBonusAt,
        score,
        doubleLeft,
        slowLeft,
        elapsed,
        speedUp,
        status: snake.length >= CELL_COUNT ? 'won' : 'playing',
      }
    }

    case 'TURN': {
      if (state.status !== 'playing') return state
      const target = action.dir
      const last = state.pending.length > 0 ? state.pending[state.pending.length - 1] : state.dir
      if (target === last || target === OPPOSITE[last] || state.pending.length >= 2) {
        return state
      }
      return { ...state, pending: [...state.pending, target] }
    }

    case 'TOGGLE_PAUSE': {
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return state
    }

    case 'DEBUG_PRESET': {
      const base = createInitialState()
      const elapsed = action.elapsed ?? 0
      return {
        ...base,
        mode: action.mode ?? state.mode ?? 'conquer',
        status: 'playing',
        snake: action.snake ?? base.snake,
        dir: action.dir ?? 'right',
        pending: [],
        food: action.food ?? base.food,
        bonus: action.bonus ?? null,
        bonusLeft: action.bonusLeft ?? 0,
        nextBonusAt: action.nextBonusAt ?? elapsed + 60000,
        score: action.score ?? 0,
        doubleLeft: action.doubleLeft ?? 0,
        slowLeft: action.slowLeft ?? 0,
        elapsed,
        speedUp: null,
        frozen: true,
      }
    }

    default:
      return state
  }
}
