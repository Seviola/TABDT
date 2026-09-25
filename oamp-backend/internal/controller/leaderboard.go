package controller

import (
	"log"
	"oamp-backend/internal/config"
	"oamp-backend/internal/model"
	"oamp-backend/pkg/response"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func parseUint(s string, result *uint) (bool, error) {
	val, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return false, err
	}
	*result = uint(val)
	return true, nil
}

func getSchoolID(c *gin.Context) *uint {
	roleValue, _ := c.Get("role")
	role, _ := roleValue.(string)

	// Admin menggunakan school_id dari query parameter
	if role == "admin" {
		schoolIDStr := c.Query("school_id")

		if schoolIDStr == "" || schoolIDStr == "all" {
			var allSchools uint = 0
			return &allSchools
		}

		var schoolID uint
		if _, err := parseUint(schoolIDStr, &schoolID); err != nil {
			return nil
		}

		return &schoolID
	}

	// Guru / Orang Tua menggunakan school_id dari JWT
	value, exists := c.Get("school_id")
	if !exists || value == nil {
		return nil
	}

	switch v := value.(type) {
	case float64:
		id := uint(v)
		return &id
	case uint:
		return &v
	case *uint:
		return v
	default:
		return nil
	}
}

func isAdmin(c *gin.Context) bool {
	roleValue, exists := c.Get("role")
	if !exists {
		return false
	}

	role, ok := roleValue.(string)
	return ok && role == "admin"
}

type LeaderboardEntry struct {
	Rank            int     `json:"rank"`
	ParticipantID   uint    `json:"participant_id"`
	UID             string  `json:"uid"`
	Name            string  `json:"name"`
	Grade           string  `json:"grade"`
	Age             int     `json:"age"`
	Gender          string  `json:"gender"`
	IsPremium       bool    `json:"is_premium"`
	VisuoSpatialFit float64 `json:"visuo_spatial_fit"`
	TotalTime       float64 `json:"total_time"`
	LevelReached    int     `json:"level_reached"`
	DexterityScore  float64 `json:"dexterity_score"`
	Score           float64 `json:"score"`
	Attempts        int     `json:"attempts"`
}

type TimelineEntry struct {
	Name      string    `json:"name"`
	Score     float64   `json:"score"`
	CreatedAt time.Time `json:"created_at"`
}

type TimeStats struct {
	FastestTime float64 `json:"fastest_time"`
	AverageTime float64 `json:"average_time"`
}

func fetchLeaderboard(limit int, batchID *uint, mode string, schoolID *uint) []LeaderboardEntry {
	query := `
        SELECT
            ROW_NUMBER() OVER (ORDER BY sub.score DESC) AS rank,
            sub.participant_id,
            p.uid,
            p.name,
            p.grade,
            p.age,
            p.gender,
            p.is_premium,
            sub.visuo_spatial_fit,
            sub.total_time,
            sub.level_reached,
            sub.dexterity_score,
            sub.score,
            (
                SELECT COUNT(*)
                FROM game_sessions gs
                WHERE gs.participant_id = sub.participant_id
                AND gs.mode = sub.mode
            ) AS attempts
        FROM (
            SELECT DISTINCT ON (participant_id)
                participant_id,
                mode,
                visuo_spatial_fit,
                total_time,
                level_reached,
                dexterity_score,
                ROUND(score, 2) AS score
            FROM game_sessions`

	var args []any
	var conditions []string

	if batchID != nil {
		conditions = append(conditions, "event_batch_id = ?")
		args = append(args, *batchID)
	}

	if mode != "" {
		conditions = append(conditions, "mode = ?")
		args = append(args, mode)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += `
            ORDER BY participant_id, score DESC
        ) sub
        JOIN participants p ON p.id = sub.participant_id
    `

	if schoolID != nil {
		if *schoolID == 0 {
			query += " WHERE p.school_id IS NOT NULL"
		} else {
			query += " WHERE p.school_id = ?"
			args = append(args, *schoolID)
		}
	} else {
		query += " WHERE p.school_id IS NULL"
	}

	query += ` ORDER BY sub.score DESC`

	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	var entries []LeaderboardEntry

	result := config.DB.Raw(query, args...).Scan(&entries)

	if result.Error != nil {
		log.Println("LEADERBOARD QUERY ERROR:", result.Error)
		log.Println("LEADERBOARD QUERY:", query)
		log.Println("LEADERBOARD ARGS:", args)
	}

	return entries
}

func fetchPublicLeaderboard(limit int, batchID *uint, mode string) []LeaderboardEntry {
	query := `
		SELECT
			ROW_NUMBER() OVER (ORDER BY sub.score DESC) AS rank,
			sub.participant_id,
			p.uid,
			p.name,
			p.grade,
			p.age,
			p.gender,
			p.is_premium,
			sub.visuo_spatial_fit,
			sub.total_time,
			sub.level_reached,
			sub.dexterity_score,
			sub.score,
			(
				SELECT COUNT(*)
				FROM game_sessions gs
				WHERE gs.participant_id = sub.participant_id
				AND gs.mode = sub.mode
			) AS attempts
		FROM (
			SELECT DISTINCT ON (participant_id)
				participant_id,
				mode,
				visuo_spatial_fit,
				total_time,
				level_reached,
				dexterity_score,
				ROUND(score, 2) AS score
			FROM game_sessions`

	var args []any
	var conditions []string

	if batchID != nil {
		conditions = append(conditions, "event_batch_id = ?")
		args = append(args, *batchID)
	}

	if mode != "" {
		conditions = append(conditions, "mode = ?")
		args = append(args, mode)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += `
			ORDER BY participant_id, score DESC
		) sub
		JOIN participants p ON p.id = sub.participant_id
		WHERE p.school_id IS NULL
		ORDER BY sub.score DESC
	`

	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	var entries []LeaderboardEntry

	result := config.DB.Raw(query, args...).Scan(&entries)

	if result.Error != nil {
		log.Println("PUBLIC LEADERBOARD QUERY ERROR:", result.Error)
		log.Println("PUBLIC LEADERBOARD QUERY:", query)
		log.Println("PUBLIC LEADERBOARD ARGS:", args)
	}

	return entries
}

func GetLeaderboard(c *gin.Context) {
	var batchID *uint

	if idStr := c.Query("batch_id"); idStr != "" {
		if idStr != "all" {
			var id uint
			if _, err := parseUint(idStr, &id); err == nil {
				batchID = &id
			}
		}
	} else {
		var activeID uint
		if err := config.DB.Model(&model.EventBatch{}).Where("is_active = ?", true).Select("id").First(&activeID).Error; err == nil {
			batchID = &activeID
		}
	}

	mode := c.Query("mode")
	schoolID := getSchoolID(c)

	if !isAdmin(c) {
		roleValue, exists := c.Get("role")

		// Tidak ada role = pengguna umum
		if !exists || roleValue == nil {
			entries := fetchPublicLeaderboard(0, batchID, mode)
			response.OKWithMessage(c, "Leaderboard fetched successfully", entries)
			return
		}
	}

	entries := fetchLeaderboard(0, batchID, mode, schoolID)
	response.OKWithMessage(c, "Leaderboard fetched successfully", entries)
}

func GetLeaderboardTimeline(c *gin.Context) {
	idStr := c.Query("batch_id")
	mode := c.Query("mode")
	var args []any
	var conditions []string

	query := `
        SELECT
            p.name,
            ROUND(gs.score, 2) AS score,
            gs.created_at
        FROM game_sessions gs
        JOIN participants p ON p.id = gs.participant_id`

	if idStr != "" && idStr != "all" {
		var id uint
		if _, err := parseUint(idStr, &id); err == nil {
			conditions = append(conditions, "gs.event_batch_id = ?")
			args = append(args, id)
		} else {
			response.OKWithMessage(c, "Timeline fetched successfully", []TimelineEntry{})
			return
		}
	} else if idStr != "all" {
		var activeID uint
		if err := config.DB.Model(&model.EventBatch{}).Where("is_active = ?", true).Select("id").First(&activeID).Error; err != nil {
			response.OKWithMessage(c, "Timeline fetched successfully", []TimelineEntry{})
			return
		}
		conditions = append(conditions, "gs.event_batch_id = ?")
		args = append(args, activeID)
	}

	if mode != "" {
		conditions = append(conditions, "gs.mode = ?")
		args = append(args, mode)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += ` ORDER BY gs.created_at ASC LIMIT 200`

	var entries []TimelineEntry
	config.DB.Raw(query, args...).Scan(&entries)
	response.OKWithMessage(c, "Timeline fetched successfully", entries)
}

func GetLeaderboardTimeStats(c *gin.Context) {
	idStr := c.Query("batch_id")
	mode := c.Query("mode")

	var args []any
	var conditions []string

	query := `
		SELECT
			COALESCE(MIN(gs.total_time), 0) AS fastest_time,
			COALESCE(AVG(gs.total_time), 0) AS average_time
		FROM game_sessions gs
		JOIN participants p ON p.id = gs.participant_id `

	if idStr != "" && idStr != "all" {
		var id uint
		if _, err := parseUint(idStr, &id); err == nil {
			conditions = append(conditions, "gs.event_batch_id = ?")
			args = append(args, id)
		} else {
			response.OKWithMessage(c, "Time stats fetched successfully", TimeStats{})
			return
		}
	} else if idStr != "all" {
		var activeID uint

		if err := config.DB.
			Model(&model.EventBatch{}).
			Where("is_active = ?", true).
			Select("id").
			First(&activeID).Error; err != nil {

			response.OKWithMessage(c, "Time stats fetched successfully", TimeStats{})
			return
		}

		conditions = append(conditions, "gs.event_batch_id = ?")
		args = append(args, activeID)
	}

	if mode != "" {
		conditions = append(conditions, "gs.mode = ?")
		args = append(args, mode)
	}

	conditions = append(conditions, "gs.total_time > 0")

	roleValue, roleExists := c.Get("role")

	if !roleExists || roleValue == nil {
		// Tanpa login = peserta umum
		conditions = append(conditions, "p.school_id IS NULL")
	} else {
		schoolID := getSchoolID(c)

		if isAdmin(c) {
			if schoolID != nil {
				if *schoolID == 0 {
					// Admin: Semua Sekolah
					conditions = append(conditions, "p.school_id IS NOT NULL")
				} else {
					// Admin: sekolah tertentu
					conditions = append(conditions, "p.school_id = ?")
					args = append(args, *schoolID)
				}
			}
		} else {
			// Guru / Orang Tua
			if schoolID != nil {
				conditions = append(conditions, "p.school_id = ?")
				args = append(args, *schoolID)
			}
		}
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	var stats TimeStats
	config.DB.Raw(query, args...).Scan(&stats)
	response.OKWithMessage(c, "Time stats fetched successfully", stats)
}
