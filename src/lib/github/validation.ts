import { z } from "zod";

export const repositoryInputSchema = z.object({
  owner: z.string().trim().min(1).max(39).regex(/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i, "Ungültiger GitHub-Owner"),
  repo: z.string().trim().min(1).max(100).regex(/^[\w.-]+$/, "Ungültiger Repository-Name").refine((value) => value !== "." && value !== "..", "Ungültiger Repository-Name"),
});

