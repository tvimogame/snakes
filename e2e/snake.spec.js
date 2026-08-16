import { test, expect } from '@playwright/test'

const getState = (page) => page.evaluate(() => window.__snake.state())

const preset = (page, props) =>
  page.evaluate((p) => window.__snake.dispatch({ type: 'DEBUG_PRESET', ...p }), props)

const tick = (page, dt = 100) => page.evaluate((d) => window.__snake.dispatch({ type: 'TICK', dt: d }), dt)

const START_SNAKE = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
]

test.describe('Snake (tvimogame)', () => {
  test('page loads in ready state with tvimogame chrome', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.snake-brand')).toContainText('tvimogame')
    await expect(page.locator('.snake-footer')).toContainText('tvimogame')
    await expect(page).toHaveTitle(/tvimogame/i)
    await expect(page.locator('.overlay-title')).toHaveText('SNAKE')

    const s0 = await getState(page)
    expect(s0.status).toBe('ready')
    expect(s0.snake.length).toBe(3)
    expect(s0.food).not.toBeNull()
  })

  test('start game begins play and the snake moves on its own', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Играть' }).click()

    const s1 = await getState(page)
    expect(s1.status).toBe('playing')

    const head0 = s1.snake[0]
    await page.waitForTimeout(500)
    const s2 = await getState(page)
    expect(s2.status).toBe('playing')
    expect(s2.snake[0]).not.toEqual(head0)
  })

  test('mode can be switched before start', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('radio', { name: 'Выживи' }).click()
    expect((await getState(page)).mode).toBe('survive')
    await page.getByRole('button', { name: 'Играть' }).click()
    expect((await getState(page)).mode).toBe('survive')
  })

  test('arrow keys turn the snake, 180° reversal is rejected', async ({ page }) => {
    await page.goto('/')
    await preset(page, { snake: START_SNAKE, dir: 'right', food: { x: 0, y: 0 } })

    await page.keyboard.press('ArrowUp')
    await tick(page)
    let s = await getState(page)
    expect(s.snake[0]).toEqual({ x: 9, y: 9 })
    expect(s.dir).toBe('up')

    await page.keyboard.press('ArrowDown')
    s = await getState(page)
    expect(s.dir).toBe('up')

    await tick(page)
    s = await getState(page)
    expect(s.snake[0]).toEqual({ x: 9, y: 8 })
  })

  test('WASD controls work', async ({ page }) => {
    await page.goto('/')
    await preset(page, { snake: START_SNAKE, dir: 'right', food: { x: 0, y: 0 } })

    await page.keyboard.press('s')
    await tick(page)
    const s = await getState(page)
    expect(s.dir).toBe('down')
    expect(s.snake[0]).toEqual({ x: 9, y: 11 })
  })

  test('eating an apple increases score and length', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 10, y: 10 },
      score: 0,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.score).toBe(10)
    expect(s.snake.length).toBe(4)
    expect(s.snake[0]).toEqual({ x: 10, y: 10 })
  })

  test('double points double the apple score', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 10, y: 10 },
      score: 0,
      doubleLeft: 10000,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.score).toBe(20)
  })

  test('golden apple gives +50 and 15s of double points', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'golden' },
      bonusLeft: 6000,
      score: 0,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.score).toBe(50)
    expect(s.doubleLeft).toBe(15000)
    expect(s.bonus).toBeNull()
  })

  test('stamina shrinks the snake but never below the head', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: [
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 },
        { x: 5, y: 10 },
      ],
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'stamina' },
      bonusLeft: 6000,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.snake.length).toBe(2)
    expect(s.snake[0]).toEqual({ x: 10, y: 10 })
  })

  test('stamina on a 3-cell snake leaves only the head', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'stamina' },
      bonusLeft: 6000,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.snake.length).toBe(1)
    expect(s.snake[0]).toEqual({ x: 10, y: 10 })
  })

  test('speed bonus gives +50 without growth', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'speed' },
      bonusLeft: 6000,
      score: 0,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.score).toBe(50)
    expect(s.snake.length).toBe(3)
  })

  test('poison apple takes 50 points (not below zero) and grows the snake by 2', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'poison' },
      bonusLeft: 6000,
      score: 100,
    })

    await tick(page)
    let s = await getState(page)
    expect(s.score).toBe(50)
    expect(s.snake.length).toBe(5)

    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'poison' },
      bonusLeft: 6000,
      score: 10,
    })

    await tick(page)
    s = await getState(page)
    expect(s.score).toBe(0)
  })

  test('slow debuff halves the step interval for 5s', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      bonus: { x: 10, y: 10, type: 'slow' },
      bonusLeft: 6000,
    })

    await tick(page, 100)
    const s = await getState(page)
    expect(s.slowLeft).toBe(5000)
  })

  test('hitting the wall ends the game', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: [
        { x: 19, y: 10 },
        { x: 18, y: 10 },
        { x: 17, y: 10 },
      ],
      dir: 'right',
      food: { x: 0, y: 0 },
      score: 42,
    })

    await tick(page)
    const s = await getState(page)
    expect(s.status).toBe('over')
    await expect(page.locator('.overlay-title.gameover')).toHaveText('ПОРАЖЕНИЕ')
    await expect(page.getByText('Счёт:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Заново' })).toBeVisible()
  })

  test('hitting its own body ends the game', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: [
        { x: 10, y: 10 },
        { x: 10, y: 9 },
        { x: 9, y: 9 },
        { x: 9, y: 10 },
        { x: 9, y: 11 },
        { x: 10, y: 11 },
        { x: 11, y: 11 },
        { x: 11, y: 10 },
      ],
      dir: 'up',
      food: { x: 0, y: 0 },
    })

    await tick(page)
    expect((await getState(page)).status).toBe('over')
  })

  test('Space pauses and resumes the game', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Играть' }).click()

    await page.keyboard.press(' ')
    expect((await getState(page)).status).toBe('paused')

    const headPaused = (await getState(page)).snake[0]
    await page.waitForTimeout(400)
    expect((await getState(page)).snake[0]).toEqual(headPaused)

    await page.keyboard.press(' ')
    expect((await getState(page)).status).toBe('playing')

    await page.waitForTimeout(400)
    expect((await getState(page)).snake[0]).not.toEqual(headPaused)
  })

  test('R restarts the game', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Играть' }).click()
    await page.waitForTimeout(300)

    await page.keyboard.press('r')
    const s = await getState(page)
    expect(s.status).toBe('playing')
    expect(s.score).toBe(0)
    expect(s.snake.length).toBe(3)
    expect(s.elapsed).toBe(0)
  })

  test('survive mode wins after 3 minutes', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      mode: 'survive',
      elapsed: 179900,
    })

    await tick(page, 100)
    const s = await getState(page)
    expect(s.status).toBe('won')
    await expect(page.locator('.overlay-title.win')).toHaveText('ПОБЕДА')
  })

  test('conquer mode wins when the board is filled', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const snake = []
      for (let y = 0; y < 20; y += 1) {
        for (let i = 0; i < 20; i += 1) {
          snake.push(y % 2 === 0 ? { x: i, y } : { x: 19 - i, y })
        }
      }
      window.__snake.dispatch({ type: 'DEBUG_PRESET', snake, dir: 'down', food: { x: 0, y: 0 } })
    })

    await tick(page)
    const s = await getState(page)
    expect(s.status).toBe('won')
    await expect(page.locator('.overlay-title.win')).toHaveText('ПОБЕДА')
  })

  test('speed level grows every 30s with a banner', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: START_SNAKE,
      dir: 'right',
      food: { x: 0, y: 0 },
      elapsed: 29950,
    })

    await tick(page, 100)
    const s = await getState(page)
    expect(s.elapsed).toBe(30050)
    expect(s.speedUp).not.toBeNull()
    expect(s.speedUp.label).toBe('1.1×')
    await expect(page.locator('.clear-banner.banner--speed')).toHaveText(/СКОРОСТЬ 1\.1×/)
  })

  test('record is saved to localStorage at game end', async ({ page }) => {
    await page.goto('/')
    await preset(page, {
      snake: [
        { x: 19, y: 10 },
        { x: 18, y: 10 },
        { x: 17, y: 10 },
      ],
      dir: 'right',
      food: { x: 0, y: 0 },
      score: 77,
    })

    await tick(page)
    expect((await getState(page)).status).toBe('over')

    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('tvimogame-snake-record') || 'null'),
    )
    expect(stored.score).toBeGreaterThanOrEqual(77)
    expect(stored.length).toBeGreaterThanOrEqual(3)

    const panel = page.locator('.panels')
    await expect(panel).toContainText('77')
  })
})
