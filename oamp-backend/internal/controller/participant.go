package controller

import (
	"fmt"
	"log"
	"net/http"
	"oamp-backend/internal/config"
	"oamp-backend/internal/model"
	"oamp-backend/pkg/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterParticipant(c *gin.Context) {
	var participant model.Participant

	if err := c.ShouldBindJSON(&participant); err != nil {
		response.Error(c, http.StatusBadRequest, response.FormatBindError(err))
		return
	}

	// Tentukan school_id berdasarkan login.
	participant.SchoolID = nil

	if schoolID, exists := c.Get("school_id"); exists && schoolID != nil {
		switch v := schoolID.(type) {
		case float64:
			id := uint(v)
			participant.SchoolID = &id

		case uint:
			id := v
			participant.SchoolID = &id

		case *uint:
			participant.SchoolID = v
		}
	}

	// Ambil informasi login/role
	roleValue, loggedIn := c.Get("role")

	if !loggedIn || roleValue == nil {
		if participant.Age == 0 {
			response.Error(c, http.StatusBadRequest, "Age is required")
			return
		}

		if participant.Gender == "" {
			response.Error(c, http.StatusBadRequest, "Gender is required")
			return
		}
	}

	// GENERATE UID OTOMATIS
	if participant.UID == "" {

		// Jika tidak login, UID tetap wajib diisi manual.
		if !loggedIn || roleValue == nil {
			response.Error(c, http.StatusBadRequest, "UID is required")
			return
		}

		// UID otomatis hanya untuk guru/admin.
		role, ok := roleValue.(string)
		if !ok || (role != "guru" && role != "admin") {
			response.Error(c, http.StatusBadRequest, "UID is required")
			return
		}

		var school model.School

		// Guru/Admin harus memiliki sekolah.
		if participant.SchoolID == nil {
			response.Error(
				c,
				http.StatusBadRequest,
				"School is required for automatic UID generation",
			)
			return
		}

		// Ambil data sekolah.
		if err := config.DB.First(&school, *participant.SchoolID).Error; err != nil {
			response.Error(c, http.StatusBadRequest, "School not found")
			return
		}

		// Pastikan kode sekolah sudah tersedia.
		if school.Code == "" {
			response.Error(
				c,
				http.StatusBadRequest,
				"School UID code is not configured",
			)
			return
		}

		// Tambahkan counter UID khusus untuk sekolah ini.
		if err := config.DB.Model(&model.School{}).
			Where("id = ?", school.ID).
			UpdateColumn(
				"uid_counter",
				gorm.Expr("uid_counter + 1"),
			).Error; err != nil {

			log.Printf(
				"[participant] failed to update school UID counter: %v",
				err,
			)

			response.Error(
				c,
				http.StatusInternalServerError,
				"Failed to generate participant UID",
			)
			return
		}

		// Ambil counter terbaru.
		if err := config.DB.First(&school, school.ID).Error; err != nil {
			response.Error(
				c,
				http.StatusInternalServerError,
				"Failed to generate participant UID",
			)
			return
		}

		participant.UID = fmt.Sprintf(
			"%s%03d",
			school.Code,
			school.UIDCounter,
		)
	}

	log.Printf(
		"[participant] registering UID=%s Name=%s SchoolID=%v",
		participant.UID,
		participant.Name,
		participant.SchoolID,
	)

	var existing model.Participant

	if err := config.DB.
		Where("uid = ?", participant.UID).
		First(&existing).Error; err == nil {

		response.Error(
			c,
			http.StatusConflict,
			"UID already registered",
		)
		return
	}

	if err := config.DB.Create(&participant).Error; err != nil {
		log.Printf(
			"[participant] DB insert failed: %v",
			err,
		)

		response.Error(
			c,
			http.StatusInternalServerError,
			"Failed to register participant",
		)
		return
	}

	response.CreatedWithMessage(
		c,
		"Participant registered successfully",
		participant,
	)
}

func GetParticipants(c *gin.Context) {
	batchID := c.Query("batch_id")

	query := `
        SELECT
            p.id, p.uid, p.name, p.age, p.grade, p.gender,
            p.height, p.weight, p.heart_rate, p.grip_strength, p.dexterity,
            p.is_premium, p.ai_analysis, p.ai_analysis_updated_at, p.created_at,
            COALESCE(best.level_reached, 0) AS level_reached,
            COALESCE(best.total_time, 0) AS total_time,
            COALESCE(best.visuo_spatial_fit, 0) AS visuo_spatial_fit,
            COALESCE(best.dexterity_score, 0) AS dexterity_score,
            COALESCE(best.score, 0) AS score
        FROM participants p
        LEFT JOIN LATERAL (
            SELECT participant_id, level_reached, total_time, visuo_spatial_fit, dexterity_score, score
            FROM game_sessions gs
            WHERE gs.participant_id = p.id`

	var args []any

	if batchID != "" && batchID != "all" {
		if id, err := strconv.Atoi(batchID); err == nil {
			query += ` AND gs.event_batch_id = ?`
			args = append(args, id)
		}
	}

	query += ` ORDER BY gs.score DESC LIMIT 1
        ) best ON true`

	// Filter berdasarkan role dan sekolah
	role, roleExists := c.Get("role")
	schoolID, schoolExists := c.Get("school_id")

	log.Printf(
		"[participant-filter] role=%v roleExists=%v schoolID=%v schoolExists=%v",
		role,
		roleExists,
		schoolID,
		schoolExists,
	)

	if role == "guru" {
		switch id := schoolID.(type) {
		case float64:
			query += ` WHERE p.school_id = ?`
			args = append(args, uint(id))

		case uint:
			query += ` WHERE p.school_id = ?`
			args = append(args, id)

		case int:
			query += ` WHERE p.school_id = ?`
			args = append(args, uint(id))

		case int64:
			query += ` WHERE p.school_id = ?`
			args = append(args, uint(id))

		default:
			log.Printf(
				"[participant-filter] school_id tidak dikenali, type=%T value=%v",
				schoolID,
				schoolID,
			)
		}
	}

	query += ` ORDER BY best.score DESC NULLS LAST, p.name ASC`

	var results []ParticipantWithScores
	result := config.DB.Raw(query, args...).Scan(&results)

	if result.Error != nil {
		log.Printf("[participant-filter] query error: %v", result.Error)
		response.Error(c, http.StatusInternalServerError, "Failed to fetch participants")
		return
	}

	log.Printf(
		"[participant-filter] fetched=%d role=%v schoolID=%v",
		len(results),
		role,
		schoolID,
	)

	response.OKWithMessage(c, "Participants fetched successfully", results)
}

// GET /api/v1/participants/id/:id — lookup by numeric DB ID
func GetParticipantByID(c *gin.Context) {
	idStr := c.Param("id")
	var id uint
	if _, err := strconv.ParseUint(idStr, 10, 64); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var participant model.Participant
	if err := config.DB.First(&participant, id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Participant not found")
		return
	}

	response.OKWithMessage(c, "", participant)
}

// GET /api/v1/participants/lookup/:nickname — find participant by name
func LookupParticipant(c *gin.Context) {
	nickname := c.Param("nickname")

	var participant model.Participant
	if err := config.DB.Where("name ILIKE ?", nickname).First(&participant).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Participant not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"uid":    participant.UID,
		"name":   participant.Name,
		"age":    participant.Age,
		"gender": participant.Gender,
	})
}

type ParticipantWithScores struct {
	ID                  uint       `json:"id"`
	UID                 string     `json:"uid"`
	Name                string     `json:"name"`
	Age                 int        `json:"age"`
	Grade               string     `json:"grade"`
	SchoolName          string     `json:"school_name"`
	Gender              string     `json:"gender"`
	Height              float64    `json:"height"`
	Weight              float64    `json:"weight"`
	HeartRate           int        `json:"heart_rate"`
	GripStrength        float64    `json:"grip_strength"`
	Dexterity           float64    `json:"dexterity"`
	IsPremium           bool       `json:"is_premium"`
	AiAnalysis          string     `json:"ai_analysis"`
	AiAnalysisUpdatedAt *time.Time `json:"ai_analysis_updated_at"`
	CreatedAt           time.Time  `json:"created_at"`
	LevelReached        int        `json:"level_reached"`
	TotalTime           float64    `json:"total_time"`
	VisuoSpatialFit     float64    `json:"visuo_spatial_fit"`
	DexterityScore      float64    `json:"dexterity_score"`
	Score               float64    `json:"score"`
}

func GetParticipantsWithScores(c *gin.Context) {
	log.Println("[DEBUG] GetParticipantsWithScores TERPANGGIL")

	batchID := c.Query("batch_id")

	query := `
		SELECT
			p.id, p.uid, p.name, p.age, p.grade, p.gender,
			p.height, p.weight, p.heart_rate, p.grip_strength, p.dexterity,
			p.is_premium, p.ai_analysis, p.ai_analysis_updated_at, p.created_at,
			COALESCE(s.name, '') AS school_name,
			COALESCE(best.level_reached, 0) AS level_reached,
			COALESCE(best.total_time, 0) AS total_time,
			COALESCE(best.visuo_spatial_fit, 0) AS visuo_spatial_fit,
			COALESCE(best.dexterity_score, 0) AS dexterity_score,
			COALESCE(best.score, 0) AS score
		FROM participants p
		LEFT JOIN schools s ON s.id = p.school_id
		LEFT JOIN LATERAL (
			SELECT participant_id, level_reached, total_time, visuo_spatial_fit, dexterity_score, score
			FROM game_sessions gs
			WHERE gs.participant_id = p.id`

	var args []any

	if batchID != "" && batchID != "all" {
		if id, err := strconv.Atoi(batchID); err == nil {
			query += ` AND gs.event_batch_id = ?`
			args = append(args, id)
		}
	}

	query += ` ORDER BY gs.score DESC LIMIT 1
		) best ON true`

	// Filter berdasarkan role dan sekolah
	log.Println("[DEBUG] Sebelum mengambil role")

	role, roleExists := c.Get("role")
	schoolID, schoolExists := c.Get("school_id")

	// school_id dari query digunakan khusus untuk admin
	selectedSchoolID := c.Query("school_id")

	log.Printf(
		"[DEBUG] role=%v roleExists=%v schoolID=%v schoolExists=%v selectedSchoolID=%v",
		role,
		roleExists,
		schoolID,
		schoolExists,
		selectedSchoolID,
	)

	if role == "guru" || role == "orang_tua" {
		if id, ok := schoolID.(float64); ok {
			query += ` WHERE p.school_id = ?`
			args = append(args, uint(id))
		}
	} else if role == "admin" {
		// Admin dapat memilih sekolah tertentu
		if selectedSchoolID != "" && selectedSchoolID != "all" {
			if id, err := strconv.Atoi(selectedSchoolID); err == nil {
				query += ` WHERE p.school_id = ?`
				args = append(args, id)
			} else {
				query += ` WHERE p.school_id IS NOT NULL`
			}
		} else {
			// Jika admin memilih "Semua Sekolah"
			query += ` WHERE p.school_id IS NOT NULL`
		}
	} else {
		// Umum melihat data tanpa sekolah
		query += ` WHERE p.school_id IS NULL`
	}

	query += ` ORDER BY best.score DESC NULLS LAST, p.name ASC`

	var results []ParticipantWithScores

	result := config.DB.Raw(query, args...).Scan(&results)

	if result.Error != nil {
		log.Printf("[participant-stats] query error: %v", result.Error)
		response.Error(c, http.StatusInternalServerError, "Failed to fetch participants")
		return
	}

	log.Printf(
		"[participant-stats] fetched=%d role=%v schoolID=%v",
		len(results),
		role,
		schoolID,
	)

	response.OKWithMessage(c, "Participants fetched successfully", results)
}

func GetParticipantSessions(c *gin.Context) {
	uid := c.Param("uid")

	var participant model.Participant
	if err := config.DB.Where("uid = ?", uid).First(&participant).Error; err != nil {
		response.Error(c, 404, "Participant not found")
		return
	}

	var sessions []model.GameSession
	config.DB.Where("participant_id = ?", participant.ID).Order("created_at desc").Find(&sessions)

	response.OKWithMessage(c, "Sessions fetched successfully", sessions)
}

// DeleteParticipant — DELETE /api/v1/participants/:id
func DeleteParticipant(c *gin.Context) {
	idStr := c.Param("id")
	var id uint
	if parsed, err := strconv.ParseUint(idStr, 10, 64); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid ID")
		return
	} else {
		id = uint(parsed)
	}

	var participant model.Participant
	if err := config.DB.First(&participant, id).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Participant not found")
		return
	}

	// Explicitly delete related records (production DB may lack ON DELETE CASCADE)
	config.DB.Where("participant_id = ?", participant.ID).Delete(&model.GameSession{})
	config.DB.Where("participant_id = ?", participant.ID).Delete(&model.TournamentPlayer{})
	config.DB.Where("uid = ?", participant.UID).Delete(&model.GameResult{})

	if err := config.DB.Delete(&participant).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete participant")
		return
	}

	response.OKWithMessage(c, "Participant deleted", nil)
}

// UpdateParticipantPayload — body for PUT /api/v1/participants/uid/:uid
// Pointer fields so we only update what the client sends, not zero-value confusion.
type UpdateParticipantPayload struct {
	Height       *float64 `json:"height" binding:"omitempty,gt=0,lte=300"`
	Weight       *float64 `json:"weight" binding:"omitempty,gt=0,lte=500"`
	GripStrength *float64 `json:"grip_strength" binding:"omitempty,gte=0,lte=200"`
	Dexterity    *float64 `json:"dexterity" binding:"omitempty,gte=0,lte=500"`
}

// UpdateParticipant — PUT /api/v1/participants/uid/:uid
// Updates measurement fields (height, weight, grip_strength, dexterity) for a participant by UID.
// Designed for hardware auto-fill: after keyboard registration, a measurement station
// uploads body metrics.
func UpdateParticipant(c *gin.Context) {
	uid := c.Param("uid")

	var payload UpdateParticipantPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, response.FormatBindError(err))
		return
	}

	updates := make(map[string]interface{})
	if payload.Height != nil {
		updates["height"] = *payload.Height
	}
	if payload.Weight != nil {
		updates["weight"] = *payload.Weight
	}
	if payload.GripStrength != nil {
		updates["grip_strength"] = *payload.GripStrength
	}
	if payload.Dexterity != nil {
		updates["dexterity"] = *payload.Dexterity
	}

	if len(updates) == 0 {
		response.Error(c, http.StatusBadRequest, "No updatable fields provided")
		return
	}

	result := config.DB.Model(&model.Participant{}).Where("uid = ?", uid).Updates(updates)
	if result.RowsAffected == 0 {
		response.Error(c, http.StatusNotFound, "Participant not found")
		return
	}

	// Return updated participant
	var participant model.Participant
	config.DB.Where("uid = ?", uid).First(&participant)
	response.OKWithMessage(c, "Participant updated", participant)
}

// GetParticipantResult — GET /api/v1/participants/uid/:uid/results
func GetParticipantResult(c *gin.Context) {
	uid := c.Param("uid")
	var result model.GameResult
	if err := config.DB.Where("uid = ?", uid).First(&result).Error; err != nil {
		response.Error(c, http.StatusNotFound, "No results found for this UID")
		return
	}
	response.OKWithMessage(c, "Game result found", result)
}

func ResetSchoolParticipants(c *gin.Context) {
	roleValue, exists := c.Get("role")

	if !exists || roleValue == nil {
		response.Error(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	role, ok := roleValue.(string)
	if !ok || role != "admin" {
		response.Error(c, http.StatusForbidden, "Admin access required")
		return
	}

	schoolIDStr := c.Param("id")

	schoolID64, err := strconv.ParseUint(schoolIDStr, 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid school ID")
		return
	}

	schoolID := uint(schoolID64)

	var school model.School

	if err := config.DB.First(&school, schoolID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Error(c, http.StatusNotFound, "School not found")
			return
		}

		log.Printf(
			"[reset-school] failed to find school: %v",
			err,
		)

		response.Error(
			c,
			http.StatusInternalServerError,
			"Failed to find school",
		)
		return
	}

	var participants []model.Participant

	if err := config.DB.
		Where("school_id = ?", schoolID).
		Find(&participants).Error; err != nil {

		log.Printf(
			"[reset-school] failed to fetch participants: %v",
			err,
		)

		response.Error(
			c,
			http.StatusInternalServerError,
			"Failed to fetch school participants",
		)
		return
	}

	err = config.DB.Transaction(func(tx *gorm.DB) error {

		for _, participant := range participants {

			// Hapus game sessions
			if err := tx.
				Where("participant_id = ?", participant.ID).
				Delete(&model.GameSession{}).Error; err != nil {

				return err
			}

			// Hapus tournament players
			if err := tx.
				Where("participant_id = ?", participant.ID).
				Delete(&model.TournamentPlayer{}).Error; err != nil {

				return err
			}

			// Hapus game results berdasarkan UID
			if err := tx.
				Where("uid = ?", participant.UID).
				Delete(&model.GameResult{}).Error; err != nil {

				return err
			}

			// Hapus participant
			if err := tx.Delete(&participant).Error; err != nil {
				return err
			}
		}

		if err := tx.
			Model(&model.School{}).
			Where("id = ?", schoolID).
			Update("uid_counter", 0).Error; err != nil {

			return err
		}

		return nil
	})

	if err != nil {
		log.Printf(
			"[reset-school] transaction failed school=%d: %v",
			schoolID,
			err,
		)

		response.Error(
			c,
			http.StatusInternalServerError,
			"Failed to reset school participants",
		)
		return
	}

	log.Printf(
		"[reset-school] school=%s (ID=%d) reset successfully, deleted=%d participants",
		school.Name,
		school.ID,
		len(participants),
	)

	response.OKWithMessage(
		c,
		"School participants reset successfully",
		gin.H{
			"school_id":       school.ID,
			"school":          school.Name,
			"deleted_count":   len(participants),
			"uid_counter":     0,
			"next_uid_example": school.Code + "001",
		},
	)
}
