import { ApplicationError } from "@/protocols";

export function forbiddenError(): ApplicationError {
  return {
    name: "Forbidden Error",
    message: "Forbidden Error!",
  };
}
