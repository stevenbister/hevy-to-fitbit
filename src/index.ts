import { FitBit } from './fitbit';
import { getWorkout } from './get-workout';
import type { WebhookPayload } from './types';

export default {
	async fetch(request, env): Promise<Response> {
		// Verify that the request method is POST (forwarded by Hookdeck)
		if (request.method !== 'POST') {
			return new Response('Invalid request method.', { status: 405 });
		}

		// Verify any necessary security measures, such as validating the request origin or adding authentication checks

		try {
			// Access the payload of the webhook event
			const payload: WebhookPayload = await request.json();
			const workout = await getWorkout(
				payload.payload.workoutId,
				env.HEVY_API_KEY,
			);

			console.log({ workout });

			const fitbit = new FitBit(env);
			await fitbit.createActivity({
				startTime: workout.start_time,
				endTime: workout.end_time,
			});

			return new Response('Webhook event processed successfully.', {
				status: 200,
			});
		} catch {
			return new Response('Failed to process webhook event.', {
				status: 500,
			});
		}
	},
} satisfies ExportedHandler<Env>;
