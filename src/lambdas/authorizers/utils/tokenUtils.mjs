import axios from "axios";
import pkg from "jsonwebtoken";
import JWK from "jwk-to-pem";

export const getPublicKey = async () => {
  const response = await axios.get(
    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_WNNunSvUe/.well-known/jwks.json"
  );
  const keys = response.data.keys;

  if (!keys || keys.length === 0) {
    throw new Error("No keys found in JWKS");
  }
  
  return keys;
};

export const verifyToken = (token, keys) => {
  const decoded = pkg.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error("Invalid token structure");
  }

  const key = keys.find((k) => k.kid === decoded.header.kid);
  if (!key) {
    throw new Error("Key not found in JWKS");
  }

  const jwk = { kty: key.kty, n: key.n, e: key.e };
  const publicKey = JWK(jwk);
  return pkg.verify(token, publicKey);
};