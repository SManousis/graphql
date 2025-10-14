package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestGetenv(t *testing.T) {
	t.Setenv("FOO_ENV", "from-env")
	if got := getenv("FOO_ENV", "default"); got != "from-env" {
		t.Fatalf("expected env override, got %q", got)
	}
	if got := getenv("MISSING_ENV", "fallback"); got != "fallback" {
		t.Fatalf("expected default fallback, got %q", got)
	}
}
func TestWithCORS(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Origin", "https://app.example")
	rr := httptest.NewRecorder()
	withCORS(rr, req)
	h := rr.Result().Header
	if got := h.Get("Access-Control-Allow-Origin"); got != "https://app.example" {
		t.Fatalf("expected echoed origin, got %q", got)
	}
	if got := h.Get("Access-Control-Allow-Methods"); got != "POST, OPTIONS" {
		t.Fatalf("unexpected methods header: %q", got)
	}
	if got := h.Get("Access-Control-Allow-Headers"); got != "Content-Type, Authorization" {
		t.Fatalf("unexpected allow headers: %q", got)
	}
	if got := h.Get("Vary"); got != "Origin" {
		t.Fatalf("unexpected vary header: %q", got)
	}
}
func TestWithCORSDefaultsToWildcard(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rr := httptest.NewRecorder()
	withCORS(rr, req)
	if got := rr.Result().Header.Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("expected wildcard CORS header, got %q", got)
	}
}
func TestWithJSON(t *testing.T) {
	rr := httptest.NewRecorder()
	withJSON(rr)
	if got := rr.Result().Header.Get("Content-Type"); got != "application/json" {
		t.Fatalf("unexpected content type: %q", got)
	}
}
func TestOkJSON(t *testing.T) {
	rr := httptest.NewRecorder()
	want := map[string]string{"status": "ok"}
	okJSON(rr, want)
	body := bytes.TrimSpace(rr.Body.Bytes())
	var got map[string]string
	if err := json.Unmarshal(body, &got); err != nil {
		t.Fatalf("body is not valid JSON: %v", err)
	}
	if got["status"] != "ok" {
		t.Fatalf("unexpected payload: %+v", got)
	}
}
func TestLogRequestDelegates(t *testing.T) {
	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
	})
	req := httptest.NewRequest(http.MethodGet, "/resource", nil)
	rr := httptest.NewRecorder()
	logRequest(next).ServeHTTP(rr, req)
	if !called {
		t.Fatal("expected wrapped handler to be invoked")
	}
	if rr.Code != http.StatusTeapot {
		t.Fatalf("unexpected status code: %d", rr.Code)
	}
}
func TestGetenvIgnoresEmpty(t *testing.T) {
	key := "EMPTY_ENV"
	if err := os.Setenv(key, ""); err != nil {
		t.Fatalf("prep failed: %v", err)
	}
	t.Cleanup(func() { os.Unsetenv(key) })
	if got := getenv(key, "fallback"); got != "fallback" {
		t.Fatalf("expected fallback for empty env, got %q", got)
	}
}
