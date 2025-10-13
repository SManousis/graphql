package proxy

import (
	"encoding/json"
	"net/http"
)

func main() {
	zone01Base := getenv("ZONE01_BASE", "https://platform.zone01.gr")
	signinPath := getenv("SIGNIN_PATH", "/api/auth/signin")
	graphqlPath := getenv("GRAPHQL_PATH", "/api/graphql-engine/v1/graphql")
	port := getenv("PORT", "8080")

	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		okJSON(w, map[string]string{"status": "ok"})
	})

}

func okJSON(w http.ResponseWriter, v any) {
	_ = json.NewEncoder(w).Encode(v)
}
