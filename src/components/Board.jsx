import { SIZE } from '../game/snake.js'

export default function Board({ snake, dir, food, bonus, bonusLeft }) {
  const kind = new Map()
  snake.forEach((p, i) => kind.set(`${p.x},${p.y}`, i === 0 ? 'head' : 'body'))

  const cells = []
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const key = `${x},${y}`
      const k = kind.get(key)
      if (k === 'head') {
        cells.push(
          <div key={key} className={`cell snake-head dir-${dir}`}>
            <span className="eye eye--1" />
            <span className="eye eye--2" />
          </div>,
        )
      } else if (k === 'body') {
        cells.push(<div key={key} className="cell tile snake-body" />)
      } else if (food.x === x && food.y === y) {
        cells.push(<div key={key} className="cell tile food food--apple" />)
      } else if (bonus && bonus.x === x && bonus.y === y) {
        const blink = bonusLeft > 0 && bonusLeft < 1500
        cells.push(
          <div key={key} className={`cell tile food food--${bonus.type}${blink ? ' blinking' : ''}`} />,
        )
      } else {
        cells.push(<div key={key} className="cell" />)
      }
    }
  }

  return (
    <div className="board" role="img" aria-label="Поле змейки">
      {cells}
    </div>
  )
}
