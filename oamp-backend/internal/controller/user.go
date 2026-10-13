package controller

import (
	"net/http"
	"strconv"

	"oamp-backend/internal/config"
	"oamp-backend/internal/dto"
	"oamp-backend/internal/model"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetUsers(c *gin.Context) {
	// Hanya admin yang boleh melihat daftar pengguna
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Akses hanya untuk admin",
		})
		return
	}

	var users []model.User

	if err := config.DB.
		Preload("School").
		Order("id ASC").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil data pengguna",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

func ResetUserPassword(c *gin.Context) {
	// Hanya admin yang boleh mereset password pengguna
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Akses hanya untuk admin",
		})
		return
	}

	// Ambil ID pengguna dari URL
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID pengguna tidak valid",
		})
		return
	}

	// Ambil password baru dari request
	var req dto.ResetPasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password baru minimal 6 karakter",
		})
		return
	}

	// Cari pengguna
	var user model.User

	if err := config.DB.First(&user, uint(userID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pengguna tidak ditemukan",
		})
		return
	}

	// Hash password baru dengan bcrypt
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

	// Simpan password baru
	if err := config.DB.
		Model(&user).
		Update("password_hash", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mereset password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password pengguna berhasil direset",
	})
}
