import { getApiDocs } from '../lib/swagger';

type OpenApiSchema = {
  components?: {
    schemas?: Record<string, { properties?: Record<string, unknown>; description?: string }>;
  };
  info?: { description?: string };
};

describe('OpenAPI documentation', () => {
  it('documents richer employer details on applications and profiles', () => {
    const spec = getApiDocs() as OpenApiSchema;

    const applicationProps = spec.components?.schemas?.Application?.properties || {};
    const profileProps = spec.components?.schemas?.Profile?.properties || {};

    expect(applicationProps).toHaveProperty('employer_phone');
    expect(applicationProps).toHaveProperty('employer_contact_person');
    expect(applicationProps).toHaveProperty('employer_email');
    expect(applicationProps).toHaveProperty('employer_address');

    expect(profileProps).toHaveProperty('employment_phone');
    expect(profileProps).toHaveProperty('employer_contact_person');
    expect(profileProps).toHaveProperty('employer_email');
    expect(profileProps).toHaveProperty('employer_address');
  });

  it('documents the future MSD backend payload contract', () => {
    const spec = getApiDocs() as OpenApiSchema;

    expect(spec.info?.description).toContain('MSD backend');
    expect(spec.components?.schemas).toHaveProperty('MsdSubmissionPayload');
    expect(spec.components?.schemas?.MsdSubmissionPayload?.description).toContain('MSD backend');
  });
});
