import { z } from "zod";
import { zodObjectId } from "../../zod";

const editCollaboratorSchema = z.object({
  email: z.string().email(),
});

export const validateEditCollaborator = editCollaboratorSchema.safeParse;

export type EditCollaboratorDto = z.infer<typeof editCollaboratorSchema>;
