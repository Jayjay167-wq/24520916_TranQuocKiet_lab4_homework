import { useFormContext } from './FormContext.jsx';

/**
 * A labelled control bound to the surrounding <FormProvider>.
 * - `id` comes from the provider's useId(), so <label htmlFor> always matches.
 * - aria-invalid reflects the visible error.
 * - aria-describedby points at the hint and, when shown, the error text.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {'input' | 'textarea' | 'select'} [props.as]
 * @param {string} [props.type]
 * @param {string} [props.hint]
 * @param {boolean} [props.required]
 * @param {readonly { value: string, label: string }[]} [props.options]  for `as="select"`
 * @param {string} [props.placeholderOption]  first, empty option for `as="select"`
 * @param {string} [props.autoComplete]
 * @param {number} [props.rows]
 */
export default function InputField({
  name,
  label,
  as = 'input',
  type = 'text',
  hint,
  required = false,
  options = [],
  placeholderOption = 'Select…',
  autoComplete,
  rows = 4,
}) {
  const { values, fieldId, visibleError, setValue, touch } = useFormContext();
  const id = fieldId(name);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const error = visibleError(name);

  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    name,
    value: values[name],
    required,
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': describedBy,
    onChange: (event) => setValue(name, event.target.value),
    onBlur: () => touch(name),
  };

  let control;
  if (as === 'textarea') {
    control = <textarea {...shared} rows={rows} />;
  } else if (as === 'select') {
    control = (
      <select {...shared}>
        <option value="">{placeholderOption}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = <input {...shared} type={type} autoComplete={autoComplete} />;
  }

  return (
    <div className="field" data-invalid={error ? '' : undefined}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {control}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
