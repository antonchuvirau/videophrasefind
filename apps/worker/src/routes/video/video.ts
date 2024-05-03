import { Hono } from "hono";

import {
  triggerSaveMetadataTask,
  triggerUpdateVideoProcessingStatusTask,
} from "./tasks";

const app = new Hono();

app.patch("/trigger-save-metadata", async (c) => {
  const { videoId } = await c.req.json<{
    videoId: string;
  }>();
  triggerSaveMetadataTask({ videoId });
  return c.json({ message: "Save video metadata task was triggered!" });
});

app.patch("/trigger-status-update", async (c) => {
  const { videoId } = await c.req.json<{
    videoId: string;
  }>();
  triggerUpdateVideoProcessingStatusTask({ videoId });
  return c.json({
    message: "Video processing task status update was triggered!",
  });
});

export default app;
