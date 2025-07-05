import { afterEach, expect, it, vi } from 'vitest';
import { getWorkout } from '../src/get-workout';
import type { Workout } from '../src/types';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const setup = async ({
	workoutId,
	apiKey,
	mockResponse,
}: {
	workoutId: string;
	apiKey: string;
	mockResponse?: {
		ok?: boolean;
		data?: Workout;
	};
}) => {
	mockFetch.mockResolvedValue({
		ok: mockResponse?.ok ?? true,
		json: () => Promise.resolve(mockResponse?.data ?? null),
	});

	return await getWorkout(workoutId, apiKey);
};

afterEach(() => vi.clearAllMocks());

it('returns workout data with valid API key and workout ID', async () => {
	const workoutId = '123';
	const apiKey = 'valid-api-key';
	const mockResponse = {
		data: { title: 'Workout 1' } as Workout,
	};

	const result = await setup({ workoutId, apiKey, mockResponse });

	expect(result).toEqual(mockResponse.data);
});

it('should throw error with missing API key', async () => {
	const workoutId = '123';
	const apiKey = '';

	const result = setup({ workoutId, apiKey });

	await expect(result).rejects.toThrowError('Missing API key');
});
