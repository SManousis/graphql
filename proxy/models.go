package main

// loginRequest represents the body sent by the frontend to authenticate a user.
type loginRequest struct {
	Identity string `json:"identity"` // username OR email
	Password string `json:"password"`
}

// loginResponse is the minimal payload returned back to the client after auth.
type loginResponse struct {
	Token string `json:"token"`
	// optional: include expiry if the auth API returns it
	Exp *int64 `json:"exp,omitempty"`
}
