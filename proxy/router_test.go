package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

func TestRegisterRoutes(t *testing.T) {
	router := mux.NewRouter()
	RegisterRoutes(router)

	tests := []struct {
		method string
		path   string
		want   int
	}{
		{http.MethodOptions, "/auth/signin", http.StatusNoContent},
		{http.MethodOptions, "/auth/refresh", http.StatusNoContent},
		{http.MethodOptions, "/graphql", http.StatusNoContent},
		{http.MethodGet, "/healthz", http.StatusOK},
		{http.MethodGet, "/missing", http.StatusNotFound},
	}

	for _, tc := range tests {
		req := httptest.NewRequest(tc.method, tc.path, nil)
		req.Header.Set("Origin", "https://client.test")
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		if rr.Code != tc.want {
			t.Errorf("%s %s: expected status %d, got %d", tc.method, tc.path, tc.want, rr.Code)
		}
	}
}
