package main

import (
	"fmt"
	"log"

	"oamp-backend/internal/config"
	"oamp-backend/internal/model"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Connect to database
	config.ConnectDB()

	// Data akun admin
	name := "Administrator"
	username := "admin"
	password := "admin123"

	// Cek apakah username sudah digunakan
	var existingUser model.User
	result := config.DB.Where("username = ?", username).First(&existingUser)

	if result.Error == nil {
		fmt.Println("Akun admin dengan username tersebut sudah ada.")
		return
	}

	// Hash password dengan bcrypt
	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Fatal("Gagal membuat password hash:", err)
	}

	// Buat akun admin
	admin := model.User{
		Name:         name,
		Username:     username,
		PasswordHash: string(passwordHash),
		Role:         "admin",
		SchoolID:     nil,
	}

	if err := config.DB.Create(&admin).Error; err != nil {
		log.Fatal("Gagal membuat akun admin:", err)
	}

	fmt.Println("===================================")
	fmt.Println("Akun Admin berhasil dibuat!")
	fmt.Println("Username :", username)
	fmt.Println("Password :", password)
	fmt.Println("Role     :", admin.Role)
	fmt.Println("School   : Semua Sekolah")
	fmt.Println("===================================")
}