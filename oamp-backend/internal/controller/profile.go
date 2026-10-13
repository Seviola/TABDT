package controller

import (
	"net/http"
	"strings"

	"oamp-backend/internal/auth"
	"oamp-backend/internal/config"
	"oamp-backend/internal/dto"
	"oamp-backend/internal/model"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GetMyProfile mengambil profil terbaru dari akun yang sedang login.
func GetMyProfile(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Identitas pengguna tidak ditemukan",
		})
		return
	}

	var user model.User
	if err := config.DB.Preload("School").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pengguna tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"username":  user.Username,
			"role":      user.Role,
			"school_id": user.SchoolID,
			"school":    user.School,
		},
	})
}

// UpdateMyProfile mengubah nama dan username akun yang sedang login.
func UpdateMyProfile(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Identitas pengguna tidak ditemukan",
		})
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama dan username wajib diisi",
		})
		return
	}

	name := strings.TrimSpace(req.Name)
	username := strings.TrimSpace(req.Username)

	if name == "" || username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama dan username tidak boleh kosong",
		})
		return
	}

	if len(name) > 100 || len(username) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nama dan username maksimal 100 karakter",
		})
		return
	}

	var user model.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pengguna tidak ditemukan",
		})
		return
	}

	// Tolak username yang sudah digunakan akun lain.
	var existing model.User
	if err := config.DB.
		Where("username = ? AND id <> ?", username, user.ID).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Username sudah digunakan",
		})
		return
	}

	if err := config.DB.Model(&user).Updates(map[string]interface{}{
		"name":     name,
		"username": username,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memperbarui profil",
		})
		return
	}

	// Terbitkan token baru agar claim username tetap terbaru.
	token, err := auth.GenerateToken(
		user.ID,
		username,
		user.Role,
		user.SchoolID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Profil tersimpan, tetapi token baru gagal dibuat. Silakan login kembali",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil berhasil diperbarui",
		"token":   token,
		"user": gin.H{
			"id":        user.ID,
			"name":      name,
			"username":  username,
			"role":      user.Role,
			"school_id": user.SchoolID,
		},
	})
}

// ChangeMyPassword mengganti password akun yang sedang login.
func ChangeMyPassword(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Identitas pengguna tidak ditemukan",
		})
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password lama wajib diisi dan password baru minimal 6 karakter",
		})
		return
	}

	var user model.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Pengguna tidak ditemukan",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.CurrentPassword),
	); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Password lama tidak sesuai",
		})
		return
	}

	if req.CurrentPassword == req.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password baru harus berbeda dari password lama",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.NewPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memproses password baru",
		})
		return
	}

	if err := config.DB.Model(&user).
		Update("password_hash", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memperbarui password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diperbarui",
	})
}
