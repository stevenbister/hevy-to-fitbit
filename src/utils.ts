export const getDateAndTimeFromString = (dateTimeString: string) => {
	const d = new Date(dateTimeString);
	const en_GB = 'en-GB';

	const [day, month, year] = d
		.toLocaleDateString(en_GB, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		})
		.split('/');
	const date = `${year}-${month}-${day}`;

	const time = d.toLocaleTimeString(en_GB, {
		timeStyle: 'short',
	});

	return { date, time };
};

export const getDurationInMs = (start: string, end: string) => {
	const startDate = new Date(start);
	const endDate = new Date(end);

	return endDate.getTime() - startDate.getTime();
};
