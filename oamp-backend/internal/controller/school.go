package controller

import (
	"net/http"

	"oamp-backend/internal/config"
	"oamp-backend/internal/model"

	"github.com/gin-gonic/gin"
)

func GetSchools(c *gin.Context) {
	var schools []model.School

	if err := config.DB.Order("name ASC").Find(&schools).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil data sekolah",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": schools,
	})
}