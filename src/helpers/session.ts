export const getSessionId = () => {
  let sessionId = sessionStorage.getItem("sessionId");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);
  }

  return sessionId;
};

export function clearSession() {
    sessionStorage.removeItem("sessionId");
}

export const hasSessionId = () => {
  const sessionId = sessionStorage.getItem("sessionId");

  if (!sessionId) {
    return false;
  }

  return true;
};
