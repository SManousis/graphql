package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func overridePaths(t *testing.T, base, signin, graphql string) {
	oldBase, oldSignin, oldGraphql := zone01Base, signinPath, graphqlPath
	zone01Base, signinPath, graphqlPath = base, signin, graphql
	t.Cleanup(func() {
		zone01Base, signinPath, graphqlPath = oldBase, oldSignin, oldGraphql
	})
}

func TestAuthHandlerOptions(t *testing.T) {
	handler := authHandler()
	req := httptest.NewRequest(http.MethodOptions, "/auth/signin", nil)
	req.Header.Set("Origin", "https://client.test")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rr.Code)
	}
	if got := rr.Result().Header.Get("Access-Control-Allow-Origin"); got != "https://client.test" {
		t.Fatalf("unexpected CORS origin: %q", got)
	}
}

func TestAuthHandlerMethodNotAllowed(t *testing.T) {
	handler := authHandler()
	req := httptest.NewRequest(http.MethodGet, "/auth/signin", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rr.Code)
	}
}

func TestAuthHandlerBadJSON(t *testing.T) {
	handler := authHandler()
	req := httptest.NewRequest(http.MethodPost, "/auth/signin", bytes.NewBufferString("{invalid"))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestAuthHandlerMissingFields(t *testing.T) {
	handler := authHandler()
	payload := `{"identity":"","password":""}`
	req := httptest.NewRequest(http.MethodPost, "/auth/signin", bytes.NewBufferString(payload))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestAuthHandlerUpstreamError(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "nope", http.StatusUnauthorized)
	}))
	t.Cleanup(upstream.Close)
	overridePaths(t, upstream.URL, "/signin", graphqlPath)

	handler := authHandler()
	body := `{"identity":"user","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/signin", bytes.NewBufferString(body))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

func TestAuthHandlerSuccessJSONToken(t *testing.T) {
	seenAuth := ""
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenAuth = r.Header.Get("Authorization")
		io.WriteString(w, `{"token":"jwt-123"}`)
	}))
	t.Cleanup(upstream.Close)
	overridePaths(t, upstream.URL, "/signin", graphqlPath)

	handler := authHandler()
	body := `{"identity":"user","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/signin", bytes.NewBufferString(body))
	req.Header.Set("Origin", "https://client.test")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
	wantAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte("user:pass"))
	if seenAuth != wantAuth {
		t.Fatalf("unexpected upstream auth header: %q", seenAuth)
	}
	if got := rr.Result().Header.Get("Content-Type"); got != "application/json" {
		t.Fatalf("expected JSON header, got %q", got)
	}
	var resp loginResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("response not JSON: %v", err)
	}
	if resp.Token != "jwt-123" {
		t.Fatalf("unexpected token: %+v", resp)
	}
}

func TestAuthHandlerSuccessPlainToken(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "  plain-token\n")
	}))
	t.Cleanup(upstream.Close)
	overridePaths(t, upstream.URL, "/signin", graphqlPath)

	handler := authHandler()
	body := `{"identity":"user","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/signin", bytes.NewBufferString(body))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
	var resp loginResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("response not JSON: %v", err)
	}
	if resp.Token != "plain-token" {
		t.Fatalf("unexpected token: %+v", resp)
	}
}

func TestRefreshHandlerOptions(t *testing.T) {
	handler := refreshHandler()
	req := httptest.NewRequest(http.MethodOptions, "/auth/refresh", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rr.Code)
	}
}

func TestRefreshHandlerPost(t *testing.T) {
	handler := refreshHandler()
	req := httptest.NewRequest(http.MethodPost, "/auth/refresh", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
	var resp map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("response not JSON: %v", err)
	}
	if resp["status"] != "ok" {
		t.Fatalf("unexpected payload: %+v", resp)
	}
}

func TestRefreshHandlerMethodNotAllowed(t *testing.T) {
	handler := refreshHandler()
	req := httptest.NewRequest(http.MethodGet, "/auth/refresh", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rr.Code)
	}
}

type errReader struct{}

func (errReader) Read([]byte) (int, error) {
	return 0, errors.New("boom")
}

func TestGraphqlHandlerOptions(t *testing.T) {
	handler := graphqlHandler()
	req := httptest.NewRequest(http.MethodOptions, "/graphql", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rr.Code)
	}
}

func TestGraphqlHandlerMethodNotAllowed(t *testing.T) {
	handler := graphqlHandler()
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rr.Code)
	}
}

func TestGraphqlHandlerMissingBearer(t *testing.T) {
	handler := graphqlHandler()
	req := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(`{"query":"{}"}`))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

func TestGraphqlHandlerBodyReadError(t *testing.T) {
	handler := graphqlHandler()
	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	req.Body = io.NopCloser(errReader{})
	rr := httptest.NewRecorder()
	req.Header.Set("Authorization", "Bearer token")

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestGraphqlHandlerUpstreamError(t *testing.T) {
	overridePaths(t, "http://127.0.0.1:0", signinPath, "/graphql")

	handler := graphqlHandler()
	req := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(`{"query":"{}"}`))
	req.Header.Set("Authorization", "Bearer token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Fatalf("expected status 502, got %d", rr.Code)
	}
}

func TestGraphqlHandlerSuccess(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer token" {
			t.Fatalf("unexpected Authorization header: %q", got)
		}
		if got := r.Header.Get("Content-Type"); got != "application/json" {
			t.Fatalf("unexpected Content-Type header: %q", got)
		}
		body, _ := io.ReadAll(r.Body)
		if !bytes.Equal(body, []byte(`{"query":"{}"}`)) {
			t.Fatalf("unexpected upstream body: %s", string(body))
		}
		w.Header().Set("X-Upstream", "present")
		w.WriteHeader(http.StatusTeapot)
		io.WriteString(w, `{"data":"ok"}`)
	}))
	t.Cleanup(upstream.Close)
	overridePaths(t, upstream.URL, signinPath, "/graphql")

	handler := graphqlHandler()
	req := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(`{"query":"{}"}`))
	req.Header.Set("Authorization", "Bearer token")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusTeapot {
		t.Fatalf("expected status 418, got %d", rr.Code)
	}
	if got := rr.Result().Header.Get("Content-Type"); got != "application/json" {
		t.Fatalf("expected JSON header, got %q", got)
	}
	if got := rr.Body.String(); got != `{"data":"ok"}` {
		t.Fatalf("unexpected proxied body: %s", got)
	}
}

