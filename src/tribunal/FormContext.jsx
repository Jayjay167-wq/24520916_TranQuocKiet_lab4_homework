import { createContext, use, useId, useState } from 'react';

/**
 * @typedef {object} FormContextValue
 * @property {Record<string, string>} values
 * @property {Record<string, string>} errors   Every current error, shown or not.
 * @property {boolean} isValid
 * @property {boolean} submitAttempted
 * @property {(name: string) => string} fieldId   Stable DOM id for a field.
 * @property {(name: string) => string | undefined} visibleError
 * @property {(name: string, value: string) => void} setValue
 * @property {(name: string) => void} touch
 */

const FormContext = createContext(/** @type {FormContextValue | null} */ (null));

/**
 * Holds the form values. Errors are computed from them on every render by
 * the pure `validate` function: there is no error state and no effect.
 *
 * @param {object} props
 * @param {Record<string, string>} props.initialValues
 * @param {(values: Record<string, string>) => Record<string, string>} props.validate
 * @param {(values: Record<string, string>) => void} props.onSubmit  Called only when valid.
 * @param {string} props.labelledBy  id of the heading that names the form.
 * @param {import('react').ReactNode} props.children
 */
export function FormProvider({ initialValues, validate, onSubmit, labelledBy, children }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const baseId = useId();

  const errors = validate(values);
  const isValid = Object.keys(errors).length === 0;

  /** @type {FormContextValue} */
  const context = {
    values,
    errors,
    isValid,
    submitAttempted,
    fieldId: (name) => `${baseId}-${name}`,
    // A field shows its error once the user has changed or left it, or after a submit.
    visibleError: (name) => (touched[name] || submitAttempted ? errors[name] : undefined),
    setValue: (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    },
    touch: (name) => setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true })),
  };

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (isValid) {
      onSubmit(values);
      return;
    }
    // Move focus to the first invalid control, in DOM order.
    const firstInvalid = [...event.currentTarget.elements].find((el) => el.name && errors[el.name]);
    firstInvalid?.focus();
  }

  return (
    <FormContext value={context}>
      <form noValidate aria-labelledby={labelledBy} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormContext>
  );
}

/** @returns {FormContextValue} */
export function useFormContext() {
  const context = use(FormContext);
  if (!context) throw new Error('useFormContext must be used inside <FormProvider>');
  return context;
}

/**
 * Lists every error after a failed submit. role="alert" makes screen readers
 * announce it; each entry links to (and focuses) its field.
 */
export function ErrorSummary() {
  const { errors, submitAttempted, isValid, fieldId } = useFormContext();
  if (!submitAttempted || isValid) return null;

  const entries = Object.entries(errors);
  return (
    <div role="alert" className="error-summary">
      <p className="error-summary-title">
        There {entries.length === 1 ? 'is 1 problem' : `are ${entries.length} problems`} with this appeal:
      </p>
      <ul>
        {entries.map(([name, message]) => (
          <li key={name}>
            <a
              href={`#${fieldId(name)}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(fieldId(name))?.focus();
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Live view of the form state for debugging and demos. */
export function DataInspector() {
  const { values, errors, isValid, submitAttempted } = useFormContext();
  const headingId = useId();

  return (
    <section className="data-inspector" aria-labelledby={headingId}>
      <h4 id={headingId}>Data inspector</h4>
      <pre data-testid="inspector-json">
        {JSON.stringify({ values, errors, isValid, submitAttempted }, null, 2)}
      </pre>
    </section>
  );
}
