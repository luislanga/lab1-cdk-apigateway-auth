import { CognitoIdentityProviderClient, AdminListGroupsForUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const getUserGroups = async (username) => {
  const userGroupsResponse = await cognitoClient.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: "us-east-1_WNNunSvUe", // Replace with your User Pool ID
      Username: username,
    })
  );
  return userGroupsResponse.Groups.map((group) => group.GroupName);
};
