import os
import jwt
import httpx
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.algorithms import RSAAlgorithm

security = HTTPBearer()

# Simple cache for JWKS to avoid fetching it on every request
jwks_cache = {}

async def get_jwks(issuer: str, force_refresh: bool = False):
    if not force_refresh and issuer in jwks_cache:
        return jwks_cache[issuer]
    
    jwks_url = f"{issuer}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Unable to fetch JWKS")
        jwks = response.json()
        jwks_cache[issuer] = jwks
        return jwks

async def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Decode the unverified header to get the kid (key ID)
        unverified_header = jwt.get_unverified_header(token)
        if "kid" not in unverified_header:
            raise HTTPException(status_code=401, detail="Invalid token header")
        
        # Decode the unverified payload to get the issuer
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified_payload.get("iss")
        if not issuer:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing iss")
            
        jwks = await get_jwks(issuer)
        
        def find_rsa_key(jwks_data, kid_str):
            for key in jwks_data["keys"]:
                if key["kid"] == kid_str:
                    return {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
            return None
        
        rsa_key = find_rsa_key(jwks, unverified_header["kid"])
                
        if not rsa_key:
            # Key might have rotated, force refresh the JWKS cache
            jwks = await get_jwks(issuer, force_refresh=True)
            rsa_key = find_rsa_key(jwks, unverified_header["kid"])
            
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")
            
        public_key = RSAAlgorithm.from_jwk(rsa_key)
        
        # Verify the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=issuer,
            audience=os.getenv("CLERK_AUDIENCE", None)  # Typically not needed if not configured
        )
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
