export const getDateAndTimeFromString = (dateTimeString: string) => {
	const date = new Date(dateTimeString);

	const [datePart, timePart] = date.toISOString().split("T");
	const formattedDate = datePart;

	const formattedTime = timePart
		.split(".")[0]
		.split(":")
		.slice(0, 2)
		.join(":");

	return {
		date: formattedDate,
		time: formattedTime,
	};
};

export const getDurationInMs = (start: string, end: string) => {
	const startDate = new Date(start);
	const endDate = new Date(end);

	return endDate.getTime() - startDate.getTime();
};
