import { TwelveLabs } from "twelvelabs-js";

const apiKey = process.env.TWELVE_LABS_API_KEY as string;

export const client12Labs = new TwelveLabs({ apiKey });
