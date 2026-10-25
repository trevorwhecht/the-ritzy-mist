const send = jest.fn();
jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: { setApiKey: jest.fn(), send: (...a: unknown[]) => send(...a) },
}));
jest.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }) },
}));

import { POST } from './route';

const post = (body: Record<string, unknown>) =>
  POST({ json: async () => body } as unknown as Request) as unknown as Promise<{ body: unknown }>;

const base = { firstName: 'A', lastName: 'B', email: 'a@b.c', phone: '1' };

beforeEach(() => send.mockReset().mockResolvedValue(undefined));

describe('gmail route', () => {
  test('gmail route escapes html', async () => {
    await post({ ...base, inquiry: '<script>alert(1)</script>' });
    const msg = send.mock.calls[0][0];
    expect(msg.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(msg.html).not.toContain('<script>');
  });

  test('escapes all five characters', async () => {
    await post({ ...base, inquiry: `& < > " '` });
    expect(send.mock.calls[0][0].html).toContain('&amp; &lt; &gt; &quot; &#39;');
  });

  test('keeps br for newlines', async () => {
    await post({ ...base, inquiry: 'x\ny' });
    expect(send.mock.calls[0][0].html).toContain('x<br>y');
  });

  test('text body stays raw', async () => {
    await post({ ...base, inquiry: '<b>&</b>' });
    expect(send.mock.calls[0][0].text).toContain('<b>&</b>');
  });

  test('sends without group fields', async () => {
    const res = await post({ ...base, inquiry: 'hi' });
    expect(res.body).toEqual({ success: true });
  });
});
