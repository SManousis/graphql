package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	port := getenv("PORT", "8080")

	//
	router := mux.NewRouter()
	RegisterRoutes(router)
	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, logRequest(router)); err != nil {
		log.Fatal(err)
	}
}
