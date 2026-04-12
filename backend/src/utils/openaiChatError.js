/**
 * Turn axios / OpenAI errors into safe, actionable API messages for clients.
 */
export function resolveOpenAIRequestError(err) {
  const status = err.response?.status;
  let data = err.response?.data;
  if (typeof data === "string") {
    data = { message: data.slice(0, 200) };
  }
  const oai = data?.error;
  const text = (oai?.message || data?.message || err.message || "").trim();

  if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
    return {
      message:
        "The connection to OpenAI timed out. Check your network and try again.",
      code: "OPENAI_TIMEOUT",
    };
  }
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    return {
      message:
        "Cannot reach the OpenAI API. Check OPENAI_BASE_URL in backend/.env (if set) and your internet connection.",
      code: "OPENAI_NETWORK",
    };
  }

  if (status === 401) {
    return {
      message:
        "OpenAI rejected the API key (401). Verify OPENAI_API_KEY in backend/.env — no extra spaces, correct key from platform.openai.com/api-keys — then restart the server.",
      code: "OPENAI_AUTH",
    };
  }

  if (status === 429) {
    return {
      message:
        "OpenAI rate limit (429) after automatic retries. Wait 1–2 minutes, avoid sending many messages in a row, and check usage or billing at platform.openai.com. Free-tier keys have low limits — consider adding a payment method for higher limits.",
      code: "OPENAI_RATE",
    };
  }

  if (status === 503 || /overload|overloaded/i.test(text)) {
    return {
      message: "OpenAI is temporarily overloaded. Try again in a few minutes.",
      code: "OPENAI_UPSTREAM",
    };
  }

  const oaiCode = oai?.code;
  if (
    oaiCode === "insufficient_quota" ||
    /insufficient_quota|billing|quota|exceeded your current quota/i.test(text)
  ) {
    return {
      message:
        "OpenAI reports a billing or quota issue. Add a payment method or credits at platform.openai.com/account/billing.",
      code: "OPENAI_QUOTA",
    };
  }

  if (oaiCode === "invalid_api_key" || /invalid api key/i.test(text)) {
    return {
      message:
        "OpenAI says the API key is invalid. Create a new secret key at platform.openai.com/api-keys and update OPENAI_API_KEY in backend/.env.",
      code: "OPENAI_AUTH",
    };
  }

  if (
    oaiCode === "model_not_found" ||
    /does not exist|model.*not found|is not a valid model/i.test(text)
  ) {
    return {
      message: `Model error: ${text || "Unknown"}. Set OPENAI_MODEL=gpt-4o-mini in backend/.env (or another model your key can access) and restart.`,
      code: "OPENAI_MODEL",
    };
  }

  if (/context_length|maximum context|too many tokens|token limit/i.test(text)) {
    return {
      message:
        "The request was too large for the model (context length). Try a shorter message; the app also limits how many courses are sent.",
      code: "OPENAI_CONTEXT",
    };
  }

  if (text) {
    return { message: `OpenAI: ${text}`, code: "OPENAI_ERROR" };
  }

  return {
    message:
      "The course advisor could not complete the request. Check the server console for [advisor] logs.",
    code: "OPENAI_UNKNOWN",
  };
}
