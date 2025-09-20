import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import './App.css';

const frameworks = ['React', 'Vue', 'Svelte', 'Solid'];

export default function App(): ReactElement {
  const [count, setCount] = useState(0);
  const activeFramework = useMemo(
    () => frameworks[count % frameworks.length],
    [count]
  );

  return (
    <div className="App">
      <header className="App__header">
        <h1>Behavior Driven UI</h1>
        <p className="App__tagline">
          Minimal React sample configured to build on Node 20.9+
        </p>
      </header>

      <main className="App__main">
        <p>
          Current focus:{' '}
          <span className="App__highlight">{activeFramework}</span>
        </p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Rotate framework
        </button>
      </main>
    </div>
  );
}
