import { describe, expect, it } from "vitest";

import { calendarDateInTimezone, localDateKeyInTimezone } from "./timezoneDate";

describe("timezoneDate", () => {
  it("formats local date keys in the account timezone", () => {
    const reference = new Date("2026-04-20T23:30:00.000Z");
    expect(localDateKeyInTimezone("Asia/Seoul", reference)).toBe("2026-04-21");
    expect(localDateKeyInTimezone("America/New_York", reference)).toBe("2026-04-20");
  });

  it("builds calendar anchors from zoned date keys", () => {
    const reference = new Date("2026-04-20T16:00:00.000Z");
    const zoned = calendarDateInTimezone("Asia/Seoul", reference);
    expect(zoned.getFullYear()).toBe(2026);
    expect(zoned.getMonth()).toBe(3);
    expect(zoned.getDate()).toBe(21);
  });
});
