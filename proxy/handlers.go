package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// Upstream endpoints can be configured via environment variables for multiple deployments.
var zone01Base = getenv("ZONE01_BASE", "https://platform.zone01.gr")
var signinPath = getenv("SIGNIN_PATH", "/api/auth/signin")
var graphqlPath = getenv("GRAPHQL_PATH", "/api/graphql-engine/v1/graphql")

// authHandler validates user credentials against Zone01 and returns the JWT from the upstream service.
func authHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		withCORS(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if req.Identity == "" || req.Password == "" {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		basic := base64.StdEncoding.EncodeToString([]byte(req.Identity + ":" + req.Password))
		zReq, err := http.NewRequest(http.MethodPost, zone01Base+signinPath, nil)
		if err != nil {
			http.Error(w, "cannot create auth request", http.StatusInternalServerError)
			return
		}
		zReq.Header.Set("Authorization", "Basic "+basic)

		client := &http.Client{Timeout: 15 * time.Second}
		zResp, err := client.Do(zReq)
		if err != nil {
			log.Printf("auth signin proxy error: %v", err)
			http.Error(w, "auth service unreachable", http.StatusBadGateway)
			return
		}
		defer zResp.Body.Close()

		body, _ := io.ReadAll(zResp.Body)
		if zResp.StatusCode < 200 || zResp.StatusCode >= 300 {
			log.Printf("auth signin upstream status=%d body=%q", zResp.StatusCode, string(body))
			// avoid leaking server messages; keep it generic
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		// The signin endpoint might return plain text (JWT) or JSON.
		// 1) Try JSON: { "token": "<JWT>" } or { "jwt": "<JWT>" }
		type anyResp map[string]any
		var js anyResp
		token := ""
		if json.Unmarshal(body, &js) == nil && js != nil {
			if v, ok := js["token"].(string); ok {
				token = v
			} else if v, ok := js["jwt"].(string); ok {
				token = v
			}
		}
		// 2) Fallback to raw string (strip quotes/newlines)
		if token == "" {
			token = strings.TrimSpace(string(bytes.Trim(body, "\" \n\r\t")))
		}
		if token == "" {
			http.Error(w, "could not parse token", http.StatusBadGateway)
			return
		}

		withJSON(w)
		okJSON(w, loginResponse{Token: token})

	}
}

// refreshHandler keeps the session alive by returning a simple ok JSON response.
func refreshHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		withCORS(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		withJSON(w)
		okJSON(w, map[string]string{"status": "ok"})
	}
}

// graphqlHandler proxies GraphQL POST requests and streams the upstream response.
func graphqlHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		withCORS(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		bearer := r.Header.Get("Authorization")
		if !strings.HasPrefix(strings.ToLower(bearer), "bearer ") {
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		zReq, err := http.NewRequest(http.MethodPost, zone01Base+graphqlPath, bytes.NewReader(body))
		if err != nil {
			http.Error(w, "cannot create upstream request", http.StatusInternalServerError)
			return
		}
		zReq.Header.Set("Content-Type", "application/json")
		zReq.Header.Set("Authorization", bearer)

		client := &http.Client{Timeout: 30 * time.Second}
		zResp, err := client.Do(zReq)
		if err != nil {
			log.Printf("graphql proxy error: %v", err)
			http.Error(w, "graphql upstream unreachable", http.StatusBadGateway)
			return
		}
		defer zResp.Body.Close()

		withJSON(w)
		w.WriteHeader(zResp.StatusCode)
		io.Copy(w, zResp.Body) // stream back (includes GraphQL errors as JSON)

	}
}
