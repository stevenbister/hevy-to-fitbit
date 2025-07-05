import { describe, expect, it } from "vitest";
import { getDateAndTimeFromString, getDurationInMs } from "../src/utils";

describe("getDateAndTimeFromString", () => {
	it("returns date in yyyy-MM-dd format", () => {
		const { date } = getDateAndTimeFromString("2025-07-04T05:41:12+00:00");
		expect(date).toBe("2025-07-04");
	});

	it("returns date in HH:mm format", () => {
		const { time } = getDateAndTimeFromString("2025-07-04T05:41:12+00:00");
		expect(time).toBe("05:41");
	});
});

describe("getDurationInMs", () => {
	it("returns duration in milliseconds", () => {
		expect(
			getDurationInMs(
				"2025-07-04T05:41:12+00:00",
				"2025-07-04T06:25:06+00:00",
			),
		).toBe(2634000);
	});
});
