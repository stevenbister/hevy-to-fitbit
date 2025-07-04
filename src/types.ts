export type WebhookPayload = {
	id: string;
	payload: {
		workoutId: string;
	};
};

export type Workout = {
	title: string;
	description: string;
	start_time: string;
	end_time: string;
	is_private: boolean;
	exercises: {
		exercise_template_id: string;
		superset_id: string | null;
		notes: string;
		sets: {
			type: string;
			weight_kg: number;
			reps: number;
			distance_meters: number | null;
			duration_seconds: number | null;
			custom_metric: string | null;
			rpe: number | null;
		}[];
	}[];
};
