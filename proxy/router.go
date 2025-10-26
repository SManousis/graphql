package main

import (
	"net/http"

	"github.com/gorilla/mux"
)

// RegisterRoutes wires every HTTP endpoint exposed by the proxy.
func RegisterRoutes(r *mux.Router) {
	// CORS preflight (OPTIONS) is handled by handlers via withCORS + OPTIONS
	r.HandleFunc("/auth/signin", authHandler()).Methods(http.MethodPost, http.MethodOptions)
	r.HandleFunc("/auth/refresh", refreshHandler()).Methods(http.MethodPost, http.MethodOptions)
	r.HandleFunc("/graphql", graphqlHandler()).Methods(http.MethodPost, http.MethodOptions)

	// Optional health endpoint
	r.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		withJSON(w)
		okJSON(w, map[string]string{"status": "ok"})
	}).Methods(http.MethodGet)
}
