import { z } from "zod";
import { zodObjectId } from "../../zod";

const createCollaboratorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  company: zodObjectId,
});

export const validateCreateCollaborator = createCollaboratorSchema.safeParse;

export type CreateCollaboratorDto = z.infer<typeof createCollaboratorSchema>;
