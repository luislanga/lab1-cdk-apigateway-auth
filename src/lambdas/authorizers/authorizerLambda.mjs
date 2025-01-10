import { getPublicKey, verifyToken } from "./utils/tokenUtils.mjs";
import { getUserGroups } from "./utils/cognitoUtils.mjs";

export const handler = async (event) => {
  try {
    const bearerToken = event.headers.Authorization;
    if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }

    const token = bearerToken.split(" ")[1];
    if (!token) {
      throw new Error("Invalid Authorization header");
    }

    const keys = await getPublicKey();
    const verified = verifyToken(token, keys);

    const username = verified["cognito:username"];
    if (!username) {
      throw new Error("Username not found in token");
    }

    const userGroups = await getUserGroups(username);
    if (!userGroups.includes("admin")) {
      throw new Error("User does not belong to the admin group");
    }

    return {
      principalId: verified.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: [
              "arn:aws:execute-api:us-east-1:436690744348:vxeb0p9jxa/*/*",
            ],
          },
        ],
      },
      context: {
        email: verified.email,
      },
    };
  } catch (error) {
    console.error("Error in authorizer:", error.message);

    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: [event.methodArn],
          },
        ],
      },
      context: {
        error: error.message,
      },
    };
  }
};
