package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// main boots the HTTP server that fronts the Zone01 APIs.
func main() {
	port := getenv("PORT", "8080")

	// Boot router + middleware once and start listening.
	router := mux.NewRouter()
	RegisterRoutes(router)
	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, logRequest(router)); err != nil {
		log.Fatal(err)
	}
}
