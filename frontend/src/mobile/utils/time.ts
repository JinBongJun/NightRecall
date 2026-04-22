export function splitHourMinute(value: string) {
  const [hour, minute] = value.split(":").map((item) => Number(item));
  return { hour, minute };
}
