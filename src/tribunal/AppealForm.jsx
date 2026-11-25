import { useId, useState } from 'react';
import { DataInspector, ErrorSummary, FormProvider, useFormContext } from './FormContext.jsx';
import InputField from './InputField.jsx';
import { EMPTY_APPEAL, GROUNDS, STATEMENT_MIN, validateAppeal } from './validateAppeal.js';

/**
 * Appeal form for one dossier. Render it with `key={dossier.id}` so each
 * dossier gets its own fresh form state.
 * @param {{ dossier: import('./dossiers.js').Dossier }} props
 */
export default function AppealForm({ dossier }) {
  const [received, setReceived] = useState(/** @type {Record<string, string> | null} */ (null));
  const headingId = useId();

  return (
    <section className="appeal" aria-labelledby={headingId}>
      <h3 id={headingId}>File an appeal: {dossier.caseId}</h3>
      <FormProvider
        initialValues={EMPTY_APPEAL}
        validate={validateAppeal}
        onSubmit={setReceived}
        labelledBy={headingId}
      >
        <ErrorSummary />
        <p className="field-hint">Fields marked * are required.</p>
        <InputField name="fullName" label="Full name" required autoComplete="name" />
        <InputField name="email" label="Email" type="email" required autoComplete="email" />
        <InputField
          name="grounds"
          label="Grounds"
          as="select"
          required
          options={GROUNDS}
          placeholderOption="Select grounds…"
        />
        <EvidenceField />
        <InputField
          name="statement"
          label="Statement"
          as="textarea"
          required
          rows={5}
          hint={`Explain why the ruling should change. Minimum ${STATEMENT_MIN} characters.`}
        />
        <button type="submit">Submit appeal</button>
        <p role="status" className="appeal-status">
          {received && `Appeal received for ${dossier.caseId}. A reply will go to ${received.email.trim()}.`}
        </p>
        <DataInspector />
      </FormProvider>
    </section>
  );
}

/** Required only when grounds is "new evidence" (the cross-field rule). */
function EvidenceField() {
  const { values } = useFormContext();
  return (
    <InputField
      name="evidenceUrl"
      label="Evidence link"
      type="url"
      required={values.grounds === 'new-evidence'}
      hint="Required for new evidence appeals. Must start with https://."
    />
  );
}
