package main

type loginRequest struct {
	Identity string `json:"identity"` // username OR email
	Password string `json:"password"`
}

type loginResponse struct {
	Token string `json:"token"`
	// optional: include expiry if the auth API returns it
	Exp *int64 `json:"exp,omitempty"`
}
