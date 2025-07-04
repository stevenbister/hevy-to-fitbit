import { env } from 'cloudflare:test';
import { expect, it, vi } from 'vitest';
import * as hevy from '../src/get-workout';
import worker from '../src/index';
import type { Workout } from '../src/types';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const fetchWorker = async (
	opts?: RequestInit<IncomingRequestCfProperties<unknown>> | undefined,
) => {
	const request = new IncomingRequest('http://example.com', opts);
	const response = await worker.fetch(request, env);

	return response;
};

it('returns 405 for non-POST requests', async () => {
	const response = await fetchWorker();

	expect(await response.text()).toBe('Invalid request method.');
});

it('returns 500 for requests with missing or invalid payload', async () => {
	const response = await fetchWorker({
		method: 'POST',
		body: JSON.stringify({ invalid: 'payload' }),
	});

	expect(response.status).toBe(500);
	expect(await response.text()).toBe('Failed to process webhook event.');
});

it('returns 500 for requests with valid payload but failed getWorkout call', async () => {
	const request = new IncomingRequest('http://example.com', {
		method: 'POST',
		body: JSON.stringify({ payload: { workoutId: '123' } }),
	});

	const response = await worker.fetch(request, env);

	const getWorkoutSpy = vi.spyOn(hevy, 'getWorkout');
	getWorkoutSpy.mockRejectedValue(new Error('Mocked error'));

	expect(response.status).toBe(500);
	expect(await response.text()).toBe('Failed to process webhook event.');
});

it('returns 200 for requests with valid payload and successful getWorkout call', async () => {
	const request = new IncomingRequest('http://example.com', {
		method: 'POST',
		body: JSON.stringify({ payload: { workoutId: '123' } }),
	});

	const getWorkoutSpy = vi.spyOn(hevy, 'getWorkout');
	getWorkoutSpy.mockResolvedValue({
		title: 'mock-workout-id',
	} as Workout);

	const response = await worker.fetch(request, env);

	expect(response.status).toBe(200);
	expect(await response.text()).toBe('Webhook event processed successfully.');
});
