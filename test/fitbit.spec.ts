import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FitBit } from '../src/fitbit';

const mockEnv = {
	HEVY_API_KEY: 'test-api-key',
	FITBIT_CLIENT_ID: 'test-client-id',
	FITBIT_SECRET: 'test-secret',
	FITBIT_AUTH_CODE: 'test-auth-code',
	FITBIT_CODE_VERIFIER: 'test-code-verifier',
	HEVY_FITBIT_AUTH_TOKENS: {
		get: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	} as unknown as KVNamespace,
} satisfies Cloudflare.Env;

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('FitBit', () => {
	let fitbit: FitBit;

	beforeEach(() => {
		fitbit = new FitBit(mockEnv);
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should authorize successfully and store tokens', async () => {
		const fakeAuthResponse = {
			access_token: 'new-access-token',
			refresh_token: 'new-refresh-token',
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => fakeAuthResponse,
		} as Response);

		const result = await fitbit['authorize']();

		expect(result).toEqual(fakeAuthResponse);
		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockEnv.HEVY_FITBIT_AUTH_TOKENS.put).toHaveBeenCalledWith(
			'access_token',
			'new-access-token',
		);
		expect(mockEnv.HEVY_FITBIT_AUTH_TOKENS.put).toHaveBeenCalledWith(
			'refresh_token',
			'new-refresh-token',
		);
	});

	it('should throw when authorize fails', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			text: async () => 'Invalid code',
		} as Response);

		await expect(fitbit['authorize']()).rejects.toThrowError(
			/Failed to get Fitbit access token/,
		);
	});

	it('should refresh token successfully', async () => {
		const fakeRefreshResponse = {
			access_token: 'refreshed-access-token',
			refresh_token: 'refreshed-refresh-token',
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => fakeRefreshResponse,
		} as Response);

		const result = await fitbit['refreshToken']('old-refresh-token');

		expect(result).toEqual(fakeRefreshResponse);
		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockEnv.HEVY_FITBIT_AUTH_TOKENS.put).toHaveBeenCalledWith(
			'access_token',
			'refreshed-access-token',
		);
		expect(mockEnv.HEVY_FITBIT_AUTH_TOKENS.put).toHaveBeenCalledWith(
			'refresh_token',
			'refreshed-refresh-token',
		);
	});

	it('should delete refresh_token and throw if refresh fails', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			text: async () => 'Token expired',
		} as Response);

		await expect(
			fitbit['refreshToken']('old-refresh-token'),
		).rejects.toThrowError(/Failed to refresh Fitbit token/);

		expect(mockEnv.HEVY_FITBIT_AUTH_TOKENS.delete).toHaveBeenCalledWith(
			'refresh_token',
		);
	});

	it('should create activity with valid access token', async () => {
		mockEnv.HEVY_FITBIT_AUTH_TOKENS.get = vi
			.fn()
			.mockResolvedValueOnce(null) // refresh_token
			.mockResolvedValueOnce('access-token'); // access_token

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ activityId: 123 }),
		} as Response);

		const result = await fitbit.createActivity({
			startTime: '2025-07-05T08:00:00Z',
			endTime: '2025-07-05T09:00:00Z',
		});

		expect(result).toBe('Success');
		expect(mockFetch).toHaveBeenCalled();
	});

	it('should refresh token if activity request is unauthorized', async () => {
		mockEnv.HEVY_FITBIT_AUTH_TOKENS.get = vi
			.fn()
			.mockResolvedValueOnce('refresh-token') // refresh_token
			.mockResolvedValueOnce('expired-access-token'); // access_token

		mockFetch
			.mockResolvedValueOnce({
				status: 401,
				ok: false,
				text: async () => 'Unauthorized',
			} as Response) // first call
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response); // second call after refresh

		// Mock refreshToken to resolve immediately
		fitbit['refreshToken'] = vi.fn().mockResolvedValue({
			access_token: 'new-access-token',
			refresh_token: 'new-refresh-token',
		});

		const result = await fitbit.createActivity({
			startTime: '2025-07-05T08:00:00Z',
			endTime: '2025-07-05T09:00:00Z',
		});

		expect(result).toBe('Success');
		expect(fitbit['refreshToken']).toHaveBeenCalledWith('refresh-token');
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});
});
