import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import AIAutonomy from './pages/AIAutonomy';
import Login from './pages/Login';
import AIWorkspace, { workspaceFields } from './components/AIWorkspace';
import AIReport from './components/AIReport';
import FormattedAIReport from './components/FormattedAIReport';
import { auth, aiAutonomyService } from './services/api';

jest.mock('./services/api', () => ({ auth: { login: jest.fn() }, aiAutonomyService: { missionPlanner: jest.fn(), obstacleAvoidance: jest.fn(), swarmCoordination: jest.fn(), geofenceOptimize: jest.fn(), telemetryAnomaly: jest.fn() } }));
let host, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.restoreAllMocks(); });
const click = async (button) => { await act(async () => button.click()); };
const button = (label) => [...host.querySelectorAll('button')].find((node) => node.textContent.trim() === label);

test('all flight presets fill active editable fields without generation and keep record IDs', async () => {
  await act(async () => root.render(<AIAutonomy />));
  for (const tab of ['Mission Planner', 'Obstacle Avoidance', 'Swarm Coordination', 'Geofence Optimize', 'Telemetry Anomaly']) {
    await click(button(tab));
    const before = Object.fromEntries([...host.querySelectorAll('[data-ai-field]')].filter((el) => /^(?:drone_id|drones_json)$/.test(el.dataset.aiField)).map((el) => [el.dataset.aiField, el.value]));
    for (const preset of ['Corridor review', 'Levee survey', 'Solar inspection']) {
      await click(button(preset));
      const fields = [...host.querySelectorAll('[data-ai-field]')];
      expect(fields.length).toBeGreaterThan(1);
      for (const field of fields) {
        expect(field.value).not.toBe('');
        if (field.dataset.aiField.endsWith('_json')) expect(() => JSON.parse(field.value)).not.toThrow();
      }
      for (const [key, value] of Object.entries(before)) expect(host.querySelector(`[data-ai-field="${key}"]`).value).toBe(value);
      expect(host.querySelector('[role="status"]')?.textContent).toMatch(/filled/);
    }
  }
  expect(Object.values(aiAutonomyService).every((fn) => fn.mock.calls.length === 0)).toBe(true);
});

test('demo credentials fill action does not submit', async () => {
  process.env.REACT_APP_DEMO_EMAIL = 'fixture@example.test';
  process.env.REACT_APP_DEMO_PASSWORD = 'fixture-only-password';
  await act(async () => root.render(<Login onLogin={jest.fn()} />));
  await click(button('Fill demo credentials'));
  expect(host.querySelector('input[type="email"]').value).toBe(process.env.REACT_APP_DEMO_EMAIL);
  expect(host.querySelector('input[type="password"]').value).toBe(process.env.REACT_APP_DEMO_PASSWORD);
  expect(auth.login).not.toHaveBeenCalled();
  delete process.env.REACT_APP_DEMO_EMAIL;
  delete process.env.REACT_APP_DEMO_PASSWORD;
});

test('returned and saved structured reports render facts, table, false, zero and empty strings', async () => {
  const result = { id: 1, result_json: { summary: { ready: false, count: 0, note: '' }, findings: [{ name: 'Battery', score: 0 }, { name: 'Wind', score: 2 }], steps: ['Review route', 'Check forecast'] }, input: { goal: '', context: 'fixture' }, created_at: '2026-01-01T00:00:00Z' };
  const html = renderToStaticMarkup(<AIReport response={result} />);
  expect(html).toMatch(/Summary/); expect(html).toMatch(/<table/); expect(html).toMatch(/No/); expect(html).toMatch(/>0</); expect(html).not.toMatch(/<pre/);
  const nativeHtml = renderToStaticMarkup(<FormattedAIReport response={result} />);
  expect(nativeHtml).toMatch(/<table/); expect(nativeHtml).toMatch(/Empty string/);
  expect(renderToStaticMarkup(<AIReport response={{ result_json: false, result: 'ignored' }} />)).toMatch(/>No</);
  expect(renderToStaticMarkup(<AIReport response={{ result_json: 0, result: 'ignored' }} />)).toMatch(/>0</);
  expect(renderToStaticMarkup(<AIReport response={{ result_json: '', result: 'ignored' }} />)).toMatch(/Empty string/);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [result] }) });
  const feature = { id: 'fixture', title: 'Fixture report', description: 'Fixture', samples: [] };
  await act(async () => root.render(<AIWorkspace feature={feature} />));
  await click(host.querySelector('.ai-history-row'));
  expect(document.body.textContent).toMatch(/Request inputs/);
  expect(document.body.textContent).toMatch(/Battery/);
  expect(document.body.textContent).toMatch(/No/);
  const details = document.querySelector('details');
  expect(details.querySelectorAll('dd')[2].textContent).toBe('Empty string');
});


test('workspace presets fill required and optional fields without generation', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
  const feature = { id: 'fixture', title: 'Fixture report', description: 'Fixture', samples: [] };
  await act(async () => root.render(<AIWorkspace feature={feature} />));
  for (const preset of ['Scenario', 'Data sample', 'Executive review']) {
    await click(button(preset));
    const form = host.querySelector('form');
    const values = workspaceFields.map((field) => form.querySelector(`[id="fixture-${field.key}"]`).value);
    expect(values).toHaveLength(10);
    expect(values.every(Boolean)).toBe(true);
    expect(global.fetch.mock.calls.every((call) => !call[1] || call[1].method !== 'POST')).toBe(true);
  }
});

test('unconfigured demo login makes the prerequisite explicit', async () => {
  delete process.env.REACT_APP_DEMO_EMAIL;
  delete process.env.REACT_APP_DEMO_PASSWORD;
  await act(async () => root.render(<Login onLogin={jest.fn()} />));
  expect(button('Fill demo credentials').disabled).toBe(true);
  expect(host.textContent).toMatch(/not configured/);
});
