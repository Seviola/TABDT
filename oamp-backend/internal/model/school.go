package model

import "time"

type School struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"size:150;not null;uniqueIndex"`
	CreatedAt time.Time `json:"created_at"`
}