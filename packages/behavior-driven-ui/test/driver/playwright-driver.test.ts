import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PlaywrightDriver } from '../../src/driver/playwright/playwright-driver.js';

function encodeHtmlFixture(html: string): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

const BASIC_PAGE_FIXTURE = encodeHtmlFixture(
  '<!doctype html><html><body><h1 id="message">Hello BDUI</h1></body></html>'
);

const FORM_FIXTURE = encodeHtmlFixture(`
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>BDUI Form Fixture</title>
      <style>
        body { font-family: sans-serif; margin: 1rem; }
        label { display: block; margin-bottom: 0.5rem; }
        textarea { width: 100%; min-height: 4rem; }
      </style>
      <script>
        window.fixture = {
          toggle() {
            const target = document.getElementById('toggle-target');
            if (target) {
              target.hidden = !target.hidden;
            }
          },
        };
      </script>
    </head>
    <body>
      <h1 id="heading">Hello BDUI</h1>
      <form id="sample-form" action="about:blank">
        <label>
          Name
          <input id="name" name="name" />
        </label>
        <label>
          Bio
          <textarea id="bio" name="bio"></textarea>
        </label>
        <label>
          Favorite Fruit
          <select id="favorite-fruit" name="fruit">
            <option value="apple">Apple</option>
            <option value="pear">Pear</option>
            <option value="orange">Orange</option>
          </select>
        </label>
        <label>
          Toppings
          <select id="toppings" name="toppings" multiple>
            <option value="sprinkles">Sprinkles</option>
            <option value="chocolate">Chocolate</option>
            <option value="marshmallow">Marshmallow</option>
          </select>
        </label>
        <label>
          Subscribe
          <input id="subscribe" type="checkbox" name="subscribe" />
        </label>
        <button type="button" id="toggle-button" onclick="window.fixture.toggle()">Toggle</button>
        <div id="toggle-target" hidden>Toggled content</div>
      </form>
    </body>
  </html>
`);

describe('PlaywrightDriver', () => {
  let driver: PlaywrightDriver;

  beforeAll(async () => {
    driver = await PlaywrightDriver.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    await driver.destroy();
  });

  it('navigates to a page and reads text content', async () => {
    await driver.goto(BASIC_PAGE_FIXTURE);
    await driver.waitFor('#message');

    const text = await driver.getText('#message');
    expect(text).toBe('Hello BDUI');
    expect(driver.visitedUrls.at(-1)?.url).toBe(BASIC_PAGE_FIXTURE);
  });

  it('updates and reads the viewport size', async () => {
    await driver.setViewport(1024, 768);
    const viewport = await driver.getViewport();

    expect(viewport).toEqual({ width: 1024, height: 768 });
  });

  it('fills inputs and reads values', async () => {
    driver.resetHistory();
    await driver.goto(FORM_FIXTURE);

    await driver.expect(
      '#heading',
      `to have text ${JSON.stringify('Hello BDUI')}`
    );

    await driver.fill('#name', 'Ada Lovelace');
    await driver.expect(
      '#name',
      `to have value ${JSON.stringify('Ada Lovelace')}`
    );
    expect(await driver.getValue('#name')).toBe('Ada Lovelace');

    await driver.fill('#bio', '');
    await driver.type('#bio', 'Line One');
    await driver.type('#bio', '\nLine Two');
    expect(await driver.getValue('#bio')).toBe('Line One\nLine Two');

    await driver.click('#subscribe');
    expect(await driver.getValue('#subscribe')).toBe('true');
  }, 20000);

  it('selects single and multiple options', async () => {
    driver.resetHistory();
    await driver.goto(FORM_FIXTURE);

    await driver.select('#favorite-fruit', 'pear');
    await driver.expect(
      '#favorite-fruit',
      `to have value ${JSON.stringify('pear')}`
    );

    await driver.select('#toppings', ['sprinkles', 'chocolate']);
    expect(await driver.getValue('#toppings')).toBe('sprinkles,chocolate');
  }, 20000);

  it('waits for visibility changes', async () => {
    driver.resetHistory();
    await driver.goto(FORM_FIXTURE);

    await driver.expect('#toggle-target', 'to be hidden');
    await driver.click('#toggle-button');
    await driver.expect('#toggle-target', 'to be visible');

    await driver.click('#toggle-button');
    await driver.expect('#toggle-target', 'to be hidden');
  }, 20000);

  it('records navigation history after reloads and redirects', async () => {
    driver.resetHistory();
    await driver.goto(FORM_FIXTURE);

    const secondPage = encodeHtmlFixture(
      '<!doctype html><html><body><p id="second">Second</p></body></html>'
    );

    await driver.goto(secondPage);
    await driver.reload();

    const visited = driver.visitedUrls.map((entry) => entry.url);
    expect(visited).toContain(FORM_FIXTURE);
    expect(visited).toContain(secondPage);
    expect(visited.at(-1)).toBe(secondPage);
    expect(visited.length).toBeGreaterThanOrEqual(2);
  }, 20000);
});
