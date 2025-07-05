import { FITBIT_CREATE_ACTIVITY, FITBIT_TOKEN } from './endpoints';
import type { AuthTokenResponse, RefreshTokenResponse } from './types';
import { getDateAndTimeFromString, getDurationInMs } from './utils';

export class FitBit {
	private clientId: string;
	private secret: string;
	private authCode: string;
	private codeVerifier: string;
	private kv: KVNamespace;

	constructor(env: Cloudflare.Env) {
		this.clientId = env.FITBIT_CLIENT_ID;
		this.secret = env.FITBIT_SECRET;
		this.authCode = env.FITBIT_AUTH_CODE;
		this.codeVerifier = env.FITBIT_CODE_VERIFIER;
		this.kv = env.HEVY_FITBIT_AUTH_TOKENS;
	}

	private getCredentials = () => btoa(`${this.clientId}:${this.secret}`);

	private async authorize() {
		const params = new URLSearchParams({
			client_id: this.clientId,
			code: this.authCode,
			code_verifier: this.codeVerifier,
			grant_type: 'authorization_code',
		});

		const response = await fetch(FITBIT_TOKEN, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${this.getCredentials()}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: params.toString(),
		});

		if (!response.ok) {
			const error = await response.text();
			const message = `Failed to get Fitbit access token: ${error}`;

			console.error(message);
			throw new Error(message);
		}

		const json = (await response.json()) as AuthTokenResponse;

		await this.kv.put('access_token', json.access_token);
		await this.kv.put('refresh_token', json.refresh_token);

		return json;
	}

	private async refreshToken(refreshToken: string) {
		const params = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
		});

		const response = await fetch(FITBIT_TOKEN, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${this.getCredentials()}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: params.toString(),
		});

		if (!response.ok) {
			const error = await response.text();
			const message = `Failed to refresh Fitbit token: ${error}`;
			await this.kv.delete('refresh_token');

			console.error(message);
			throw new Error(message);
		}

		const json = (await response.json()) as RefreshTokenResponse;

		await this.kv.put('access_token', json.access_token);
		await this.kv.put('refresh_token', json.refresh_token);

		return json;
	}

	async createActivity({
		startTime,
		endTime,
	}: {
		startTime: string;
		endTime: string;
	}) {
		const refreshToken = await this.kv.get('refresh_token');
		const accessToken = await this.kv.get('access_token');

		if (!accessToken && !refreshToken) await this.authorize();

		const { date, time } = getDateAndTimeFromString(startTime);
		const durationMillis = getDurationInMs(startTime, endTime).toString();

		const params = new URLSearchParams({
			activityId: '2050',
			durationMillis,
			startTime: time,
			date,
		});

		const createActivity = `${FITBIT_CREATE_ACTIVITY}?${params.toString()}`;

		const settings = {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		};

		let response = await fetch(createActivity, settings);

		if (response.status === 401 && refreshToken) {
			await this.refreshToken(refreshToken);

			response = await fetch(createActivity, settings);
		}

		if (!response.ok) {
			const error = await response.text();
			const message = `Failed to create activity: ${error}`;

			console.error(message);
			throw new Error(message);
		}

		const data = await response.json();
		console.log(data);

		return 'Success';
	}
}
