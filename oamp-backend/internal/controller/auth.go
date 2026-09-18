package controller

import (
	"net/http"

	"oamp-backend/internal/auth"
	"oamp-backend/internal/config"
	"oamp-backend/internal/dto"
	"oamp-backend/internal/model"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var req dto.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Data pendaftaran tidak valid",
		})
		return
	}

	// Pastikan sekolah yang dipilih benar-benar ada
	var school model.School
	if err := config.DB.First(&school, req.SchoolID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Sekolah tidak ditemukan",
		})
		return
	}

	// Pastikan username belum digunakan
	var existingUser model.User
	if err := config.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Username sudah digunakan",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memproses password",
		})
		return
	}

	user := model.User{
		Name:         req.Name,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		SchoolID:     &req.SchoolID,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat akun",
		})
		return
	}

	// Buat token setelah akun berhasil dibuat
	token, err := auth.GenerateToken(
		user.ID,
		user.Username,
		user.Role,
		user.SchoolID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat token",
		})
		return
	}

	c.JSON(http.StatusCreated, dto.AuthResponse{
		Token: token,
		User: gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"username":  user.Username,
			"role":      user.Role,
			"school_id": user.SchoolID,
		},
	})
}

func Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username dan password wajib diisi",
		})
		return
	}

	// Cari user berdasarkan username
	var user model.User
	if err := config.DB.
		Preload("School").
		Where("username = ?", req.Username).
		First(&user).Error; err != nil {
			
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Username atau password salah",
		})
		return
	}

		// fmt.Println("LOGIN - USER DITEMUKAN:", user.Username)
		// fmt.Println("LOGIN - PASSWORD HASH ADA:", user.PasswordHash != "")
		// fmt.Println("LOGIN - PANJANG HASH:", len(user.PasswordHash))

	// Periksa password dengan bcrypt
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {

		// fmt.Println("LOGIN - BCRYPT ERROR:", err)

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Username atau password salah",
		})
		return
	}

	// fmt.Println("LOGIN - PASSWORD COCOK")

	// Buat JWT
	token, err := auth.GenerateToken(
		user.ID,
		user.Username,
		user.Role,
		user.SchoolID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat token",
		})
		return
	}

	c.JSON(http.StatusOK, dto.AuthResponse{
		Token: token,
		User: gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"username":  user.Username,
			"role":      user.Role,
			"school_id": user.SchoolID,
			"school":    user.School,
		},
	})
}