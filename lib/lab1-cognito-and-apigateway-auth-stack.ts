import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { join, dirname } from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export class Lab1CognitoAndApigatewayAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      "us-east-1_WNNunSvUe"
    );
    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      "ImportedUserPoolClient",
      "opi4p3n7tgvtnt8j5rc8tqfmv"
    );

    const pathToLambdaCode = join(__dirname, "../src/lambdas/authorizers");

    const authorizerLambda = new lambda.Function(this, "AuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "authorizerLambda.handler",
      code: lambda.Code.fromAsset(pathToLambdaCode),
    });

    authorizerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminListGroupsForUser"],
        resources: [
          `arn:aws:cognito-idp:us-east-1:436690744348:userpool/us-east-1_WNNunSvUe`,
        ],
      })
    );

    const api = new apigateway.RestApi(this, "Lab1Api", {
      restApiName: "Lab1Api",
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    const openResource = api.root.addResource("open");
    openResource.addMethod(
      "GET",
      new apigateway.HttpIntegration("https://www.google.com")
    );

    const cognitoProtectedResource = api.root.addResource("cognito-protected");
    cognitoProtectedResource.addMethod(
      "GET",
      new apigateway.HttpIntegration("https://www.google.com"),
      {
        authorizer: cognitoAuthorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    const lambdaProtectedResource = api.root.addResource("lambda-protected");
    lambdaProtectedResource.addMethod(
      "GET",
      new apigateway.HttpIntegration("https://www.google.com"),
      {
        authorizer: new apigateway.RequestAuthorizer(this, "LambdaAuthorizer", {
          handler: authorizerLambda,
          identitySources: [apigateway.IdentitySource.header("Authorization")],
        }),
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );
  }
}
