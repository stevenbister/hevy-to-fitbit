import { HEVY_WORKOUT } from './endpoints';
import type { Workout } from './types';

export const getWorkout = async (
	workoutId: string,
	apiKey: string,
): Promise<Workout> => {
	try {
		if (!apiKey) throw new Error('Missing API key');

		const response = await fetch(`${HEVY_WORKOUT}/${workoutId}`, {
			headers: {
				'api-key': apiKey,
			},
		});

		if (!response.ok) throw new Error(`Response status: ${response.status}`);

		return response.json();
	} catch (error) {
		if (error instanceof Error)
			console.log({ 'Hevy workout error': error.message });
		throw error;
	}
};
