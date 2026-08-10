import { getAuth } from "@clerk/express";

// clerk's requireAuth() redirects to a sign-in page — wrong for a JSON api.
export function createRequireAuthApi(getAuthFn = getAuth) {
  return (req, res, next) => {
    const { userId } = getAuthFn(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
}

export const requireAuthApi = createRequireAuthApi();
