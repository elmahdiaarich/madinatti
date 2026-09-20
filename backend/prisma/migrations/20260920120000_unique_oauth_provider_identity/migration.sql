-- Prevent one provider identity from being linked to multiple users and
-- prevent a user from having multiple links for the same provider.
CREATE UNIQUE INDEX "OAuthProvider_provider_providerId_key"
ON "OAuthProvider"("provider", "providerId");

CREATE UNIQUE INDEX "OAuthProvider_userId_provider_key"
ON "OAuthProvider"("userId", "provider");
