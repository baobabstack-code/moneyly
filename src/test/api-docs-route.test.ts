import { GET } from '../app/api/docs/route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe('/api/docs route', () => {
  it('returns OpenAPI docs with employer fields and MSD payload schema', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.components.schemas.Application.properties).toHaveProperty('employer_contact_person');
    expect(body.components.schemas.Application.properties).toHaveProperty('employer_email');
    expect(body.components.schemas.Application.properties).toHaveProperty('employer_address');
    expect(body.components.schemas).toHaveProperty('MsdSubmissionPayload');
  });
});
