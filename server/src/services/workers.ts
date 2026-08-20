import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { fetchAllMailboxes } from "./imap.js";
import { config } from "../lib/config.js";

export const emailQueue = new Queue("email", { connection: redis });

export const emailWorker = new Worker(
  "email",
  async (job) => {
    if (job.name === "fetch-all") {
      await fetchAllMailboxes();
    }
  },
  { connection: redis },
);

export async function scheduleEmailFetch() {
  await emailQueue.add("fetch-all", {}, { repeat: { every: 60000 } });
}

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
