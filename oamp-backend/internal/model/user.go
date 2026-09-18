package model

import "time"

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"size:100;not null"`
	Username     string    `json:"username" gorm:"size:100;not null;uniqueIndex"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;not null"`
	Role         string    `json:"role" gorm:"size:20;not null"`
	SchoolID     *uint     `json:"school_id"`
	School       *School   `json:"school,omitempty" gorm:"foreignKey:SchoolID"`
	CreatedAt    time.Time `json:"created_at"`
}