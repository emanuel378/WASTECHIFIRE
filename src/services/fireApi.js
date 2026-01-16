import Papa from "papaparse";

export async function getFires() {
  const response = await fetch("/fires.csv");
  const text = await response.text();

  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
  });

  return parsed.data;
}
