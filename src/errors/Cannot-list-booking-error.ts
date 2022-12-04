import { ApplicationError } from "@/protocols";

export function paymentRequiredError(): ApplicationError {
  return {
    name: "Payment Required Error",
    message: "Payment required to proceed",
  };
}
