import { handleEmailRequest } from "../_shared/email-dispatcher.ts";

Deno.serve((request) => handleEmailRequest(request, "order"));
