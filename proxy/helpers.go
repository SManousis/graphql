package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

// withCORS mirrors the caller origin and configures minimal headers for browser requests.
func withCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		origin = "*"
	}
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

// okJSON encodes the provided value and ignores serialization errors for simplicity.
func okJSON(w http.ResponseWriter, v any) {
	_ = json.NewEncoder(w).Encode(v)
}

// logRequest wraps a handler and emits a concise access log with latency.
func logRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// getenv returns the environment value if it exists or a provided default.
func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// withJSON sets the Content-Type header to JSON for downstream handlers.
func withJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
}
