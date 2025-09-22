import type { ChangeEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';

import './App.css';

const frameworks = ['React', 'Vue', 'Svelte', 'Solid'];

function FocusSection(): ReactElement {
  const [count, setCount] = useState(0);
  const activeFramework = useMemo(
    () => frameworks[count % frameworks.length],
    [count]
  );

  return (
    <section className="App__section" aria-labelledby="app-focus-heading">
      <h2 id="app-focus-heading">Rotating focus</h2>
      <p>
        Current focus <span className="App__highlight">{activeFramework}</span>
      </p>
      <button
        type="button"
        id="demo-rotate-framework"
        onClick={() => setCount((value) => value + 1)}
      >
        Rotate framework
      </button>
    </section>
  );
}

interface FormFieldsProps {
  readonly name: string;
  readonly bio: string;
  readonly fruit: string;
  readonly toppings: readonly string[];
  readonly subscribe: boolean;
  onNameChange(value: string): void;
  onBioChange(value: string): void;
  onFruitChange(value: string): void;
  onToppingsChange(values: string[]): void;
  onSubscribeChange(value: boolean): void;
}

function FormFields({
  name,
  bio,
  fruit,
  toppings,
  subscribe,
  onNameChange,
  onBioChange,
  onFruitChange,
  onToppingsChange,
  onSubscribeChange,
}: FormFieldsProps): ReactElement {
  return (
    <form
      className="App__form"
      onSubmit={(event) => event.preventDefault()}
      autoComplete="off"
    >
      <label htmlFor="demo-name">
        Name
        <input
          id="demo-name"
          name="demo-name"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onNameChange(event.target.value)
          }
        />
      </label>

      <label htmlFor="demo-bio">
        Bio
        <textarea
          id="demo-bio"
          name="demo-bio"
          value={bio}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onBioChange(event.target.value)
          }
        />
      </label>

      <label htmlFor="demo-fruit">
        Favorite fruit
        <select
          id="demo-fruit"
          name="demo-fruit"
          value={fruit}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onFruitChange(event.target.value)
          }
        >
          <option value="apple">Apple</option>
          <option value="pear">Pear</option>
          <option value="orange">Orange</option>
        </select>
      </label>

      <label htmlFor="demo-toppings">
        Dessert toppings
        <select
          id="demo-toppings"
          name="demo-toppings"
          multiple
          size={3}
          value={toppings}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const selected = Array.from(
              event.currentTarget.selectedOptions
            ).map((option) => option.value);
            onToppingsChange(selected);
          }}
        >
          <option value="sprinkles">Sprinkles</option>
          <option value="chocolate">Chocolate</option>
          <option value="marshmallow">Marshmallow</option>
        </select>
      </label>

      <label className="App__checkbox" htmlFor="demo-subscribe">
        <input
          id="demo-subscribe"
          name="demo-subscribe"
          type="checkbox"
          checked={subscribe}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onSubscribeChange(event.target.checked)
          }
        />
        Subscribe to release notes
      </label>
    </form>
  );
}

interface FormSummaryProps {
  readonly name: string;
  readonly bio: string;
  readonly fruit: string;
  readonly toppings: readonly string[];
  readonly subscribe: boolean;
}

function FormSummary({
  name,
  bio,
  fruit,
  toppings,
  subscribe,
}: FormSummaryProps): ReactElement {
  return (
    <dl className="App__summary" aria-label="Form values">
      <div>
        <dt>Name</dt>
        <dd>{name || '—'}</dd>
      </div>
      <div>
        <dt>Bio</dt>
        <dd>{bio || '—'}</dd>
      </div>
      <div>
        <dt>Fruit</dt>
        <dd>{fruit}</dd>
      </div>
      <div>
        <dt>Toppings</dt>
        <dd>{toppings.length > 0 ? toppings.join(', ') : '—'}</dd>
      </div>
      <div>
        <dt>Subscribed</dt>
        <dd>{subscribe ? 'Yes' : 'No'}</dd>
      </div>
    </dl>
  );
}

function FormSection(): ReactElement {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [fruit, setFruit] = useState('apple');
  const [toppings, setToppings] = useState<string[]>([]);
  const [subscribe, setSubscribe] = useState(false);

  return (
    <section className="App__section" aria-labelledby="app-form-heading">
      <h2 id="app-form-heading">Shared demo form</h2>
      <FormFields
        name={name}
        bio={bio}
        fruit={fruit}
        toppings={toppings}
        subscribe={subscribe}
        onNameChange={setName}
        onBioChange={setBio}
        onFruitChange={setFruit}
        onToppingsChange={setToppings}
        onSubscribeChange={setSubscribe}
      />
      <FormSummary
        name={name}
        bio={bio}
        fruit={fruit}
        toppings={toppings}
        subscribe={subscribe}
      />
    </section>
  );
}

function VisibilitySection(): ReactElement {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <section className="App__section" aria-labelledby="app-visibility-heading">
      <h2 id="app-visibility-heading">Visibility demo</h2>
      <button
        type="button"
        id="demo-visibility-toggle"
        onClick={() => setIsVisible((previous) => !previous)}
      >
        {isVisible ? 'Hide panel' : 'Show panel'}
      </button>
      <div
        id="demo-visibility-target"
        className="App__visibilityPanel"
        hidden={!isVisible}
      >
        Panel content for visibility checks.
      </div>
    </section>
  );
}

export default function App(): ReactElement {
  return (
    <div className="App">
      <header className="App__header">
        <h1>Behavior Driven UI</h1>
        <p className="App__tagline">
          Minimal React sample configured to build on Node 20.9+
        </p>
      </header>

      <main className="App__main">
        <FocusSection />
        <FormSection />
        <VisibilitySection />
      </main>
    </div>
  );
}
